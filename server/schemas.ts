import { z } from 'zod';

export const CATEGORIES = ['Car', 'SUV', 'Bike', 'Van'] as const;
export const TRANSMISSIONS = ['Manual', 'Automatic'] as const;
export const FUELS = ['Petrol', 'Diesel', 'Electric', 'CNG'] as const;
export const VEHICLE_STATUSES = ['Available', 'Booked', 'Under Maintenance'] as const;
export const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'] as const;
export const PAYMENT_METHODS = ['UPI / Card Online', 'Cash on Pickup'] as const;
export const ID_TYPES = ['Driving Licence', 'Aadhaar Card'] as const;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Full name must be at least 2 characters').max(80),
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  phone: z.string().trim().regex(/^\d{10,15}$/, 'Phone number must be 10 to 15 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  id_type: z.enum(ID_TYPES),
  id_number: z.string().trim().min(8, 'Enter a valid ID number').max(25),
  id_document_data: z.string().min(10, 'Please upload a photo of your Driving Licence or Aadhaar Card'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const resubmitIdSchema = z.object({
  id_type: z.enum(ID_TYPES),
  id_number: z.string().trim().min(8, 'Enter a valid ID number').max(25),
  id_document_data: z.string().min(10, 'Please upload a clear photo of your ID document'),
});

export const createBookingSchema = z.object({
  vehicle_id: z.coerce.number().int().positive('Valid vehicle_id is required'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid pickup date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid return date format (YYYY-MM-DD)'),
  pickup_notes: z.string().trim().max(250).optional(),
});

export const paymentSchema = z.object({
  booking_id: z.coerce.number().int().positive(),
  payment_method: z.enum(PAYMENT_METHODS),
  upi_or_card_last4: z.string().trim().max(24).optional(),
});

export const vehicleSchema = z.object({
  name: z.string().trim().min(2, 'Vehicle name is required').max(80),
  category: z.enum(CATEGORIES),
  model: z.string().trim().min(2, 'Model year or trim is required').max(40),
  transmission_type: z.enum(TRANSMISSIONS),
  fuel_type: z.enum(FUELS),
  price_per_day: z.coerce.number().positive('Daily rate must be greater than 0'),
  security_deposit: z.coerce.number().min(0).default(3000),
  seats: z.coerce.number().int().min(1).max(24).default(5),
  registration_number: z.string().trim().min(4, 'Registration number is required').max(20),
  mileage: z.string().trim().min(2).max(40).default('18 km/l'),
  location: z.string().trim().min(2, 'Location is required').max(60),
  status: z.enum(VEHICLE_STATUSES).default('Available'),
  description: z.string().trim().max(500).optional(),
  image_url: z.string().trim().optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
});

export const verificationSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
  remark: z.string().trim().max(255).optional(),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(4, 'Please write at least a short review').max(400),
});
