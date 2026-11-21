import bcrypt from 'bcryptjs';
import express, { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { ZodError, ZodSchema } from 'zod';
import {
  bookingStatusSchema,
  createBookingSchema,
  loginSchema,
  paymentSchema,
  registerSchema,
  resubmitIdSchema,
  reviewSchema,
  vehicleSchema,
  verificationSchema,
} from './schemas.ts';
import { db, UserRecord, VehicleRecord } from './store.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'rentride-dev-session-secret-key';

interface AuthUser {
  id: number;
  role: 'customer' | 'admin';
}

interface AuthedRequest extends Request {
  user?: AuthUser;
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Ongoing', 'Cancelled'],
  Ongoing: ['Completed'],
  Completed: [],
  Cancelled: [],
};

function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues[0];
        next(new HttpError(400, first ? `${first.message}` : 'Invalid request payload.'));
        return;
      }
      next(err);
    }
  };
}

function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Please sign in to continue.'));
  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    next();
  } catch {
    next(new HttpError(401, 'Session expired. Please sign in again.'));
  }
}

function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return next(new HttpError(403, 'Administrator access required.'));
  }
  next();
}

function maskAndValidateId(idType: string, idNumber: string): string {
  const cleaned = String(idNumber || '').replace(/[\s-]/g, '').toUpperCase();
  if (idType === 'Aadhaar Card') {
    if (!/^\d{12}$/.test(cleaned)) {
      throw new HttpError(400, 'Aadhaar number must be exactly 12 digits.');
    }
    return `XXXXXXXX${cleaned.slice(-4)}`;
  }
  if (!/^[A-Z0-9]{8,20}$/.test(cleaned)) {
    throw new HttpError(400, 'Driving licence number must be 8 to 20 letters/digits.');
  }
  return cleaned;
}

function sanitizeUser(u: UserRecord) {
  return {
    user_id: u.user_id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    id_type: u.id_type,
    id_number: u.id_number,
    has_document: Boolean(u.id_document_data),
    verification_status: u.verification_status,
    verification_remark: u.verification_remark,
    created_at: u.created_at,
  };
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86400000);
}

function validateDates(startDate: string, endDate: string) {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (startDate < todayStr) {
    throw new HttpError(400, 'Pickup date cannot be in the past.');
  }
  const days = calculateDays(startDate, endDate);
  if (days < 1) {
    throw new HttpError(400, 'Return date must be at least 1 day after pickup date.');
  }
  if (days > 45) {
    throw new HttpError(400, 'Maximum single booking duration is 45 days.');
  }
  return days;
}

function hasDateConflict(vehicleId: number, startDate: string, endDate: string, excludeBookingId?: number): boolean {
  return db.data.bookings.some(
    (b) =>
      b.vehicle_id === vehicleId &&
      b.booking_id !== excludeBookingId &&
      ['Pending', 'Confirmed', 'Ongoing'].includes(b.booking_status) &&
      b.start_date < endDate &&
      b.end_date > startDate
  );
}

function expireStalePendingBookings() {
  const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;
  let changed = false;
  for (const b of db.data.bookings) {
    if (b.booking_id > 1005 && b.booking_status === 'Pending') {
      const payment = db.data.payments.find((p) => p.booking_id === b.booking_id);
      if (!payment && new Date(b.created_at).getTime() < thirtyMinsAgo) {
        b.booking_status = 'Cancelled';
        changed = true;
      }
    }
  }
  if (changed) db.save();
}

function enrichVehicle(v: VehicleRecord) {
  const vReviews = db.data.reviews.filter((r) => r.vehicle_id === v.vehicle_id);
  const avgRating =
    vReviews.length > 0
      ? Number((vReviews.reduce((acc, r) => acc + r.rating, 0) / vReviews.length).toFixed(1))
      : 4.8;
  return {
    ...v,
    rating: avgRating,
    review_count: vReviews.length,
  };
}

export function createApiApp() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(express.json({ limit: '5mb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please try again shortly.' },
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
  });

  // ---------- AUTH ----------
  app.post('/api/auth/register', authLimiter, validate(registerSchema), async (req, res, next) => {
    try {
      const { name, email, phone, password, id_type, id_number, id_document_data } = req.body;
      if (db.data.users.some((u) => u.email.toLowerCase() === email)) {
        throw new HttpError(409, 'An account with this email already exists.');
      }
      const maskedId = maskAndValidateId(id_type, id_number);
      const passwordHash = await bcrypt.hash(password, 10);
      const user: UserRecord = {
        user_id: db.data.counters.user++,
        name,
        email,
        phone,
        password_hash: passwordHash,
        role: 'customer',
        id_type,
        id_number: maskedId,
        id_document_data,
        verification_status: 'Pending',
        verification_remark: null,
        created_at: new Date().toISOString(),
      };
      db.data.users.push(user);
      db.save();

      const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.status(201).json({
        success: true,
        message: 'Registration complete. Your KYC document is queued for admin review.',
        token,
        user: sanitizeUser(user),
      });
    } catch (e) {
      next(e);
    }
  });

  app.post('/api/auth/login', authLimiter, validate(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = db.data.users.find((u) => u.email.toLowerCase() === email);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new HttpError(401, 'Invalid email or password.');
      }
      const token = jwt.sign({ id: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ success: true, token, user: sanitizeUser(user) });
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res, next) => {
    const user = db.data.users.find((u) => u.user_id === req.user!.id);
    if (!user) return next(new HttpError(404, 'User not found.'));
    res.json({ success: true, user: sanitizeUser(user) });
  });

  app.post('/api/auth/resubmit-id', requireAuth, validate(resubmitIdSchema), (req: AuthedRequest, res, next) => {
    try {
      const user = db.data.users.find((u) => u.user_id === req.user!.id);
      if (!user || user.role !== 'customer') {
        throw new HttpError(403, 'Only customers can submit KYC verification documents.');
      }
      if (user.verification_status !== 'Rejected') {
        throw new HttpError(400, 'Resubmission is only available when your document was rejected.');
      }
      const maskedId = maskAndValidateId(req.body.id_type, req.body.id_number);
      user.id_type = req.body.id_type;
      user.id_number = maskedId;
      user.id_document_data = req.body.id_document_data;
      user.verification_status = 'Pending';
      user.verification_remark = null;
      db.save();

      res.json({
        success: true,
        message: 'Updated KYC document submitted for review.',
        user: sanitizeUser(user),
      });
    } catch (e) {
      next(e);
    }
  });

  // ---------- VEHICLES ----------
  app.get('/api/vehicles', (req, res) => {
    expireStalePendingBookings();
    const {
      category = '',
      location = '',
      fuel = '',
      transmission = '',
      search = '',
      startDate = '',
      endDate = '',
      maxPrice = '',
      sort = 'featured',
      page = '1',
      limit = '24',
    } = req.query as Record<string, string>;

    let list = db.data.vehicles.filter((v) => v.is_active);

    if (category) list = list.filter((v) => v.category.toLowerCase() === category.toLowerCase());
    if (location) list = list.filter((v) => v.location.toLowerCase().includes(location.toLowerCase()));
    if (fuel) list = list.filter((v) => v.fuel_type.toLowerCase() === fuel.toLowerCase());
    if (transmission) list = list.filter((v) => v.transmission_type.toLowerCase() === transmission.toLowerCase());
    if (maxPrice && Number(maxPrice) > 0) list = list.filter((v) => v.price_per_day <= Number(maxPrice));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.location.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
      );
    }
    if (startDate && endDate && endDate > startDate) {
      list = list.filter(
        (v) => v.status !== 'Under Maintenance' && !hasDateConflict(v.vehicle_id, startDate, endDate)
      );
    }

    let enriched = list.map(enrichVehicle);

    if (sort === 'price_asc') enriched.sort((a, b) => a.price_per_day - b.price_per_day);
    else if (sort === 'price_desc') enriched.sort((a, b) => b.price_per_day - a.price_per_day);
    else if (sort === 'rating') enriched.sort((a, b) => b.rating - a.rating);

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(50, Math.max(1, Number(limit) || 24));
    const total = enriched.length;
    const paged = enriched.slice((p - 1) * l, p * l);

    const locations = Array.from(new Set(db.data.vehicles.filter((v) => v.is_active).map((v) => v.location))).sort();

    res.json({
      success: true,
      vehicles: paged,
      locations,
      pagination: { page: p, limit: l, total, totalPages: Math.max(1, Math.ceil(total / l)) },
    });
  });

  app.get('/api/vehicles/:id', (req, res, next) => {
    expireStalePendingBookings();
    const id = Number(req.params.id);
    const vehicle = db.data.vehicles.find((v) => v.vehicle_id === id && v.is_active);
    if (!vehicle) return next(new HttpError(404, 'Vehicle not found.'));

    const todayStr = new Date().toISOString().slice(0, 10);
    const bookedDates = db.data.bookings
      .filter(
        (b) =>
          b.vehicle_id === id &&
          ['Pending', 'Confirmed', 'Ongoing'].includes(b.booking_status) &&
          b.end_date >= todayStr
      )
      .map((b) => ({ start_date: b.start_date, end_date: b.end_date, booking_status: b.booking_status }))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    const reviews = db.data.reviews
      .filter((r) => r.vehicle_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    res.json({
      success: true,
      vehicle: enrichVehicle(vehicle),
      bookedDates,
      reviews,
    });
  });

  app.post('/api/vehicles/:id/reviews', requireAuth, validate(reviewSchema), (req: AuthedRequest, res, next) => {
    try {
      const id = Number(req.params.id);
      const vehicle = db.data.vehicles.find((v) => v.vehicle_id === id && v.is_active);
      if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
      const user = db.data.users.find((u) => u.user_id === req.user!.id);
      if (!user) throw new HttpError(401, 'User not found.');

      const review = {
        review_id: db.data.counters.review++,
        vehicle_id: id,
        user_id: user.user_id,
        user_name: user.name,
        rating: req.body.rating,
        comment: req.body.comment,
        created_at: new Date().toISOString(),
      };
      db.data.reviews.unshift(review);
      db.save();
      res.status(201).json({ success: true, message: 'Thank you for reviewing this vehicle.', review });
    } catch (e) {
      next(e);
    }
  });

  // ---------- BOOKINGS ----------
  app.post('/api/bookings', requireAuth, validate(createBookingSchema), (req: AuthedRequest, res, next) => {
    try {
      expireStalePendingBookings();
      const { vehicle_id, start_date, end_date, pickup_notes } = req.body;
      const days = validateDates(start_date, end_date);

      const user = db.data.users.find((u) => u.user_id === req.user!.id);
      if (!user) throw new HttpError(401, 'Account not found.');

      if (user.role === 'customer' && user.verification_status !== 'Approved') {
        throw new HttpError(
          403,
          user.verification_status === 'Rejected'
            ? `Your KYC document was rejected${user.verification_remark ? `: ${user.verification_remark}` : ''}. Please re-upload from My Bookings.`
            : 'Your KYC verification is pending admin approval. You can reserve once verified.'
        );
      }

      const vehicle = db.data.vehicles.find((v) => v.vehicle_id === vehicle_id && v.is_active);
      if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
      if (vehicle.status === 'Under Maintenance') {
        throw new HttpError(409, 'This vehicle is currently under scheduled maintenance.');
      }
      if (hasDateConflict(vehicle_id, start_date, end_date)) {
        throw new HttpError(409, 'Selected dates overlap with an existing reservation.');
      }

      const baseAmount = days * vehicle.price_per_day;
      const gstAmount = Math.round(baseAmount * 0.18);
      const totalCost = baseAmount + gstAmount;

      const booking = {
        booking_id: db.data.counters.booking++,
        user_id: user.user_id,
        vehicle_id,
        start_date,
        end_date,
        days,
        base_amount: baseAmount,
        gst_amount: gstAmount,
        security_deposit: vehicle.security_deposit,
        total_cost: totalCost,
        booking_status: 'Pending' as const,
        pickup_notes,
        created_at: new Date().toISOString(),
      };
      db.data.bookings.unshift(booking);
      db.save();

      res.status(201).json({
        success: true,
        message: 'Reservation held for 30 minutes. Complete payment to confirm.',
        booking,
      });
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/bookings/my', requireAuth, (req: AuthedRequest, res) => {
    expireStalePendingBookings();
    const list = db.data.bookings
      .filter((b) => b.user_id === req.user!.id)
      .map((b) => {
        const vehicle = db.data.vehicles.find((v) => v.vehicle_id === b.vehicle_id);
        const payment = db.data.payments.find((p) => p.booking_id === b.booking_id);
        return {
          ...b,
          vehicle_name: vehicle?.name || 'Vehicle',
          model: vehicle?.model || '',
          category: vehicle?.category || 'Car',
          location: vehicle?.location || '',
          image_url: vehicle?.image_url || '',
          registration_number: vehicle?.registration_number || '',
          payment_status: payment?.payment_status || null,
          payment_method: payment?.payment_method || null,
          transaction_id: payment?.transaction_id || null,
          refund_id: payment?.refund_id || null,
        };
      })
      .sort((a, b) => b.booking_id - a.booking_id);

    res.json({ success: true, bookings: list });
  });

  app.put('/api/bookings/:id/cancel', requireAuth, (req: AuthedRequest, res, next) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = db.data.bookings.find((b) => b.booking_id === bookingId);
      if (!booking || booking.user_id !== req.user!.id) {
        throw new HttpError(404, 'Booking not found.');
      }
      if (!['Pending', 'Confirmed'].includes(booking.booking_status)) {
        throw new HttpError(400, `Cannot cancel a booking that is already ${booking.booking_status}.`);
      }
      const hoursLeft = (new Date(`${booking.start_date}T00:00:00`).getTime() - Date.now()) / 3600000;
      if (hoursLeft < 24) {
        throw new HttpError(400, 'Bookings cannot be cancelled within 24 hours of pickup.');
      }

      booking.booking_status = 'Cancelled';
      const payment = db.data.payments.find((p) => p.booking_id === bookingId);
      if (payment && payment.payment_status === 'Paid') {
        payment.payment_status = 'Refunded';
        payment.refund_id = `RFD_${payment.transaction_id || Date.now()}`;
        payment.refunded_at = new Date().toISOString();
      }
      db.save();

      res.json({
        success: true,
        message: payment?.payment_status === 'Refunded'
          ? 'Booking cancelled and refund initiated.'
          : 'Booking cancelled successfully.',
      });
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/bookings/:id/invoice', requireAuth, (req: AuthedRequest, res, next) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = db.data.bookings.find((b) => b.booking_id === bookingId);
      if (!booking) throw new HttpError(404, 'Booking not found.');
      if (req.user!.role !== 'admin' && booking.user_id !== req.user!.id) {
        throw new HttpError(403, 'Access denied.');
      }
      const customer = db.data.users.find((u) => u.user_id === booking.user_id);
      const vehicle = db.data.vehicles.find((v) => v.vehicle_id === booking.vehicle_id);
      const payment = db.data.payments.find((p) => p.booking_id === booking.booking_id);

      res.json({
        success: true,
        invoice: {
          invoice_number: `INV-RR-${booking.booking_id}`,
          issued_at: booking.created_at,
          booking,
          customer: customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null,
          vehicle: vehicle
            ? {
                name: vehicle.name,
                model: vehicle.model,
                registration_number: vehicle.registration_number,
                location: vehicle.location,
                price_per_day: vehicle.price_per_day,
              }
            : null,
          payment: payment || null,
        },
      });
    } catch (e) {
      next(e);
    }
  });

  // ---------- PAYMENTS ----------
  app.post('/api/payments', requireAuth, validate(paymentSchema), (req: AuthedRequest, res, next) => {
    try {
      const { booking_id, payment_method } = req.body;
      const booking = db.data.bookings.find((b) => b.booking_id === booking_id);
      if (!booking || booking.user_id !== req.user!.id) {
        throw new HttpError(404, 'Booking not found.');
      }
      if (booking.booking_status !== 'Pending') {
        throw new HttpError(400, 'Only pending bookings can be paid.');
      }
      if (db.data.payments.some((p) => p.booking_id === booking_id)) {
        throw new HttpError(409, 'Payment already recorded for this booking.');
      }

      const isOnline = payment_method === 'UPI / Card Online';
      const txnId = isOnline ? `PAY_RR${Date.now().toString().slice(-8)}` : null;

      const payment = {
        payment_id: db.data.counters.payment++,
        booking_id,
        amount: booking.total_cost,
        payment_method,
        payment_status: isOnline ? ('Paid' as const) : ('Pending' as const),
        transaction_id: txnId,
        refund_id: null,
        paid_at: isOnline ? new Date().toISOString() : null,
        refunded_at: null,
      };
      db.data.payments.push(payment);
      booking.booking_status = 'Confirmed';
      db.save();

      res.status(201).json({
        success: true,
        message: isOnline
          ? 'Payment verified. Your booking is confirmed.'
          : 'Booking confirmed. Pay total rental + refundable deposit at hub pickup.',
        payment,
      });
    } catch (e) {
      next(e);
    }
  });

  // ---------- ADMIN ROUTES ----------
  app.get('/api/admin/stats', requireAuth, requireAdmin, (_req, res) => {
    expireStalePendingBookings();
    const customers = db.data.users.filter((u) => u.role === 'customer');
    const activeVehicles = db.data.vehicles.filter((v) => v.is_active);
    const bookings = db.data.bookings;
    const paidPayments = db.data.payments.filter((p) => p.payment_status === 'Paid');
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingVerifications = customers.filter((c) => c.verification_status === 'Pending').length;

    const statusCounts = ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'].map((status) => ({
      booking_status: status,
      count: bookings.filter((b) => b.booking_status === status).length,
    }));

    const categories = ['Car', 'SUV', 'Bike', 'Van'].map((cat) => {
      const catVehicleIds = new Set(activeVehicles.filter((v) => v.category === cat).map((v) => v.vehicle_id));
      const catBookings = bookings.filter(
        (b) => catVehicleIds.has(b.vehicle_id) && b.booking_status !== 'Cancelled'
      );
      const revenue = catBookings.reduce((sum, b) => {
        const paid = db.data.payments.find((p) => p.booking_id === b.booking_id && p.payment_status === 'Paid');
        return sum + (paid ? paid.amount : 0);
      }, 0);
      return { category: cat, bookings: catBookings.length, revenue };
    });

    const topCat = [...categories].sort((a, b) => b.bookings - a.bookings)[0];

    const monthlyRevenue = [
      { month: 'Jul', revenue: 28400, bookings: 5 },
      { month: 'Aug', revenue: 41200, bookings: 7 },
      { month: 'Sep', revenue: 36800, bookings: 6 },
      { month: 'Oct', revenue: 52900, bookings: 9 },
      { month: 'Nov', revenue: totalRevenue, bookings: bookings.filter((b) => b.booking_status !== 'Cancelled').length },
    ];

    res.json({
      success: true,
      stats: {
        totalCustomers: customers.length,
        totalVehicles: activeVehicles.length,
        availableVehicles: activeVehicles.filter((v) => v.status === 'Available').length,
        totalBookings: bookings.length,
        totalRevenue,
        pendingVerifications,
        mostRentedCategory: topCat?.bookings ? topCat.category : '—',
        bookingsByStatus: statusCounts,
        categoryBreakdown: categories,
        monthlyRevenue,
      },
    });
  });

  app.post('/api/admin/vehicles', requireAuth, requireAdmin, validate(vehicleSchema), (req, res) => {
    const v = req.body;
    const defaultImageByCategory: Record<string, string> = {
      Car: '/src/assets/images/fleet_sedan_hatch_1795285334347.jpg',
      SUV: '/src/assets/images/fleet_suv_offroad_1795285334115.jpg',
      Bike: '/src/assets/images/fleet_classic_bike_1795285334107.jpg',
      Van: '/src/assets/images/fleet_touring_van_1795285334050.jpg',
    };
    const record: VehicleRecord = {
      vehicle_id: db.data.counters.vehicle++,
      name: v.name,
      category: v.category,
      model: v.model,
      transmission_type: v.transmission_type,
      fuel_type: v.fuel_type,
      price_per_day: v.price_per_day,
      security_deposit: v.security_deposit,
      seats: v.seats,
      registration_number: v.registration_number.toUpperCase(),
      mileage: v.mileage,
      location: v.location,
      status: v.status,
      description: v.description || `${v.model} ${v.category} maintained by RentRide ${v.location} hub.`,
      features: ['24/7 Roadside Assist', 'Comprehensive Insurance', 'Sanitized Cabin'],
      image_url: v.image_url || defaultImageByCategory[v.category],
      is_active: true,
      created_at: new Date().toISOString(),
    };
    db.data.vehicles.unshift(record);
    db.save();
    res.status(201).json({ success: true, message: `${record.name} added to fleet.`, vehicle: record });
  });

  app.put('/api/admin/vehicles/:id', requireAuth, requireAdmin, validate(vehicleSchema), (req, res, next) => {
    const id = Number(req.params.id);
    const vehicle = db.data.vehicles.find((v) => v.vehicle_id === id && v.is_active);
    if (!vehicle) return next(new HttpError(404, 'Vehicle not found.'));

    const v = req.body;
    Object.assign(vehicle, {
      name: v.name,
      category: v.category,
      model: v.model,
      transmission_type: v.transmission_type,
      fuel_type: v.fuel_type,
      price_per_day: v.price_per_day,
      security_deposit: v.security_deposit,
      seats: v.seats,
      registration_number: v.registration_number.toUpperCase(),
      mileage: v.mileage,
      location: v.location,
      status: v.status,
      description: v.description ?? vehicle.description,
      image_url: v.image_url || vehicle.image_url,
    });
    db.save();
    res.json({ success: true, message: `${vehicle.name} updated.`, vehicle });
  });

  app.delete('/api/admin/vehicles/:id', requireAuth, requireAdmin, (req, res, next) => {
    const id = Number(req.params.id);
    const vehicle = db.data.vehicles.find((v) => v.vehicle_id === id && v.is_active);
    if (!vehicle) return next(new HttpError(404, 'Vehicle not found.'));

    const activeBooking = db.data.bookings.some(
      (b) => b.vehicle_id === id && ['Pending', 'Confirmed', 'Ongoing'].includes(b.booking_status)
    );
    if (activeBooking) {
      return next(new HttpError(409, 'Cannot archive a vehicle with active reservations.'));
    }
    vehicle.is_active = false;
    db.save();
    res.json({ success: true, message: `${vehicle.name} removed from active fleet.` });
  });

  app.get('/api/admin/bookings', requireAuth, requireAdmin, (req, res) => {
    expireStalePendingBookings();
    const { status = '', from = '', to = '', search = '' } = req.query as Record<string, string>;

    let list = db.data.bookings.map((b) => {
      const customer = db.data.users.find((u) => u.user_id === b.user_id);
      const vehicle = db.data.vehicles.find((v) => v.vehicle_id === b.vehicle_id);
      const payment = db.data.payments.find((p) => p.booking_id === b.booking_id);
      return {
        ...b,
        customer_name: customer?.name || 'Customer',
        customer_email: customer?.email || '',
        customer_phone: customer?.phone || '',
        vehicle_name: vehicle?.name || 'Vehicle',
        model: vehicle?.model || '',
        registration_number: vehicle?.registration_number || '',
        payment_status: payment?.payment_status || 'Unpaid',
        payment_method: payment?.payment_method || '—',
      };
    });

    if (status) list = list.filter((b) => b.booking_status === status);
    if (from) list = list.filter((b) => b.start_date >= from);
    if (to) list = list.filter((b) => b.end_date <= to);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          String(b.booking_id).includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_email.toLowerCase().includes(q) ||
          b.vehicle_name.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => b.booking_id - a.booking_id);
    res.json({ success: true, bookings: list });
  });

  app.put('/api/admin/bookings/:id/status', requireAuth, requireAdmin, validate(bookingStatusSchema), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const booking = db.data.bookings.find((b) => b.booking_id === id);
      if (!booking) throw new HttpError(404, 'Booking not found.');

      if (booking.booking_status === status) {
        return res.json({ success: true, message: `Booking is already ${status}.` });
      }
      const allowed = VALID_TRANSITIONS[booking.booking_status] || [];
      if (!allowed.includes(status)) {
        throw new HttpError(
          400,
          `Invalid transition: cannot change ${booking.booking_status} booking directly to ${status}.`
        );
      }

      booking.booking_status = status;
      const vehicle = db.data.vehicles.find((v) => v.vehicle_id === booking.vehicle_id);
      if (vehicle) {
        if (status === 'Ongoing') vehicle.status = 'Booked';
        if ((status === 'Completed' || status === 'Cancelled') && vehicle.status === 'Booked') {
          vehicle.status = 'Available';
        }
      }

      if (status === 'Cancelled') {
        const payment = db.data.payments.find((p) => p.booking_id === id);
        if (payment && payment.payment_status === 'Paid') {
          payment.payment_status = 'Refunded';
          payment.refund_id = `RFD_${payment.transaction_id || Date.now()}`;
          payment.refunded_at = new Date().toISOString();
        }
      }
      if (status === 'Completed') {
        const payment = db.data.payments.find((p) => p.booking_id === id);
        if (payment && payment.payment_status === 'Pending') {
          payment.payment_status = 'Paid';
          payment.paid_at = new Date().toISOString();
        }
      }

      db.save();
      res.json({ success: true, message: `Booking #${id} marked ${status}.` });
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
    const { status = '', search = '' } = req.query as Record<string, string>;
    let list = db.data.users.filter((u) => u.role === 'customer');
    if (status) list = list.filter((u) => u.verification_status === status);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q)
      );
    }
    res.json({ success: true, users: list.map(sanitizeUser) });
  });

  app.get('/api/admin/users/:id/document', requireAuth, requireAdmin, (req, res, next) => {
    const id = Number(req.params.id);
    const user = db.data.users.find((u) => u.user_id === id && u.role === 'customer');
    if (!user || !user.id_document_data) {
      return next(new HttpError(404, 'No KYC document uploaded for this customer.'));
    }
    res.json({
      success: true,
      documentData: user.id_document_data,
      name: user.name,
      id_type: user.id_type,
      id_number: user.id_number,
    });
  });

  app.put('/api/admin/users/:id/verification', requireAuth, requireAdmin, validate(verificationSchema), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { status, remark } = req.body;
      const user = db.data.users.find((u) => u.user_id === id && u.role === 'customer');
      if (!user) throw new HttpError(404, 'Customer not found.');
      if (status === 'Rejected' && !(remark || '').trim()) {
        throw new HttpError(400, 'Please provide a clear rejection reason for the customer.');
      }

      user.verification_status = status;
      user.verification_remark = status === 'Rejected' ? (remark || '').trim() : null;
      db.save();

      res.json({
        success: true,
        message: `${user.name} KYC ${status.toLowerCase()}.`,
        user: sanitizeUser(user),
      });
    } catch (e) {
      next(e);
    }
  });

  // Error handler
  app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  });

  return app;
}
