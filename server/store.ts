import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

export interface UserRecord {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: 'customer' | 'admin';
  id_type: 'Driving Licence' | 'Aadhaar Card' | null;
  id_number: string | null;
  id_document_data: string | null;
  verification_status: 'Pending' | 'Approved' | 'Rejected';
  verification_remark: string | null;
  created_at: string;
}

export interface VehicleRecord {
  vehicle_id: number;
  name: string;
  category: 'Car' | 'SUV' | 'Bike' | 'Van';
  model: string;
  transmission_type: 'Manual' | 'Automatic';
  fuel_type: 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
  price_per_day: number;
  security_deposit: number;
  seats: number;
  registration_number: string;
  mileage: string;
  location: string;
  status: 'Available' | 'Booked' | 'Under Maintenance';
  description: string;
  features: string[];
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export interface BookingRecord {
  booking_id: number;
  user_id: number;
  vehicle_id: number;
  start_date: string;
  end_date: string;
  days: number;
  base_amount: number;
  gst_amount: number;
  security_deposit: number;
  total_cost: number;
  booking_status: 'Pending' | 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';
  pickup_notes?: string;
  created_at: string;
}

export interface PaymentRecord {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_method: 'UPI / Card Online' | 'Cash on Pickup';
  payment_status: 'Paid' | 'Pending' | 'Refunded';
  transaction_id: string | null;
  refund_id: string | null;
  paid_at: string | null;
  refunded_at: string | null;
}

export interface ReviewRecord {
  review_id: number;
  vehicle_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface DatabaseState {
  users: UserRecord[];
  vehicles: VehicleRecord[];
  bookings: BookingRecord[];
  payments: PaymentRecord[];
  reviews: ReviewRecord[];
  counters: {
    user: number;
    vehicle: number;
    booking: number;
    payment: number;
    review: number;
  };
}

const DATA_FILE = path.resolve(process.cwd(), 'data', 'rentride-db.json');

function addDaysISO(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function sampleSvgDocument(name: string, idType: string, idNumber: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="380" viewBox="0 0 640 380">
    <rect width="640" height="380" rx="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
    <rect x="0" y="0" width="640" height="68" rx="18" fill="#0f172a"/>
    <text x="32" y="42" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="700">GOVERNMENT OF INDIA · ${idType.toUpperCase()}</text>
    <rect x="32" y="100" width="132" height="164" rx="10" fill="#e2e8f0" stroke="#94a3b8"/>
    <circle cx="98" cy="156" r="28" fill="#94a3b8"/>
    <path d="M54 242 C54 206, 142 206, 142 242" fill="#94a3b8"/>
    <text x="192" y="132" fill="#64748b" font-family="sans-serif" font-size="13">CARDHOLDER NAME</text>
    <text x="192" y="160" fill="#0f172a" font-family="sans-serif" font-size="24" font-weight="700">${name}</text>
    <text x="192" y="206" fill="#64748b" font-family="sans-serif" font-size="13">DOCUMENT NUMBER</text>
    <text x="192" y="236" fill="#1e40af" font-family="monospace" font-size="22" font-weight="700">${idNumber}</text>
    <text x="32" y="330" fill="#475569" font-family="sans-serif" font-size="13">Verified KYC specimen for demonstration · Encrypted at rest</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createInitialState(): DatabaseState {
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const custHash = bcrypt.hashSync('Customer@123', 10);
  const nowIso = new Date().toISOString();

  const users: UserRecord[] = [
    {
      user_id: 1,
      name: 'Kapil Sharma',
      email: 'admin@rental.com',
      phone: '9876500001',
      password_hash: adminHash,
      role: 'admin',
      id_type: null,
      id_number: null,
      id_document_data: null,
      verification_status: 'Approved',
      verification_remark: null,
      created_at: nowIso,
    },
    {
      user_id: 2,
      name: 'Aarav Mehta',
      email: 'customer@rental.com',
      phone: '9876500002',
      password_hash: custHash,
      role: 'customer',
      id_type: 'Driving Licence',
      id_number: 'HP0120210048912',
      id_document_data: sampleSvgDocument('Aarav Mehta', 'Driving Licence', 'HP0120210048912'),
      verification_status: 'Approved',
      verification_remark: null,
      created_at: nowIso,
    },
    {
      user_id: 3,
      name: 'Priya Verma',
      email: 'priya.verma@example.com',
      phone: '9816422110',
      password_hash: custHash,
      role: 'customer',
      id_type: 'Driving Licence',
      id_number: 'CH0120220091145',
      id_document_data: sampleSvgDocument('Priya Verma', 'Driving Licence', 'CH0120220091145'),
      verification_status: 'Pending',
      verification_remark: null,
      created_at: nowIso,
    },
    {
      user_id: 4,
      name: 'Rohan Thakur',
      email: 'rohan.thakur@example.com',
      phone: '9418033490',
      password_hash: custHash,
      role: 'customer',
      id_type: 'Aadhaar Card',
      id_number: 'XXXXXXXX7821',
      id_document_data: sampleSvgDocument('Rohan Thakur', 'Aadhaar Card', 'XXXXXXXX7821'),
      verification_status: 'Rejected',
      verification_remark: 'Please upload a Driving Licence with a clear front photo for self-drive rentals.',
      created_at: nowIso,
    },
  ];

  const vehicles: VehicleRecord[] = [
    {
      vehicle_id: 1,
      name: 'Swift Dzire',
      category: 'Car',
      model: '2023 ZXi',
      transmission_type: 'Manual',
      fuel_type: 'Petrol',
      price_per_day: 1800,
      security_deposit: 2500,
      seats: 5,
      registration_number: 'HP-01A-4412',
      mileage: '22 km/l',
      location: 'Shimla',
      status: 'Available',
      description: 'Fuel-efficient compact sedan ideal for Shimla hill commutes and highway transfers with generous boot space.',
      features: ['Dual Airbags', 'Apple CarPlay', 'Rear Parking Camera', 'Hill Hold'],
      image_url: '/src/assets/images/fleet_sedan_hatch_1795285334347.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 2,
      name: 'Hyundai i20',
      category: 'Car',
      model: '2024 Asta IVT',
      transmission_type: 'Automatic',
      fuel_type: 'Petrol',
      price_per_day: 2200,
      security_deposit: 3000,
      seats: 5,
      registration_number: 'HP-01A-7820',
      mileage: '19 km/l',
      location: 'Shimla',
      status: 'Available',
      description: 'Smooth IVT automatic hatchback with sunroof, wireless charging, and effortless hill climb control.',
      features: ['Automatic IVT', 'Sunroof', 'Cruise Control', 'ABS + EBD'],
      image_url: '/src/assets/images/fleet_sedan_hatch_1795285334347.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 3,
      name: 'Mahindra Thar',
      category: 'SUV',
      model: '2023 LX 4x4',
      transmission_type: 'Manual',
      fuel_type: 'Diesel',
      price_per_day: 3500,
      security_deposit: 5000,
      seats: 4,
      registration_number: 'HP-58B-1109',
      mileage: '15 km/l',
      location: 'Manali',
      status: 'Available',
      description: 'Trail-rated 4x4 diesel off-roader equipped with all-terrain tyres for Atal Tunnel, Spiti, and Rohtang corridors.',
      features: ['4x4 Low Range', 'All-Terrain Tyres', 'Hard Top', 'Roll Cage'],
      image_url: '/src/assets/images/fleet_suv_offroad_1795285334115.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 4,
      name: 'Toyota Fortuner',
      category: 'SUV',
      model: '2022 Legender AT',
      transmission_type: 'Automatic',
      fuel_type: 'Diesel',
      price_per_day: 5500,
      security_deposit: 8000,
      seats: 7,
      registration_number: 'CH-01C-9004',
      mileage: '14 km/l',
      location: 'Chandigarh',
      status: 'Available',
      description: 'Full-size 7-seater executive SUV built for long Himalayan tours, airport VIP transfers, and family expeditions.',
      features: ['7-Seater Cabin', '4WD Automatic', 'Ventilated Seats', '7 Airbags'],
      image_url: '/src/assets/images/hero_himalayan_suv_1795285335402.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 5,
      name: 'Royal Enfield Classic 350',
      category: 'Bike',
      model: '2023 Signals',
      transmission_type: 'Manual',
      fuel_type: 'Petrol',
      price_per_day: 900,
      security_deposit: 1500,
      seats: 2,
      registration_number: 'HP-58K-3318',
      mileage: '35 km/l',
      location: 'Manali',
      status: 'Available',
      description: 'Iconic J-series 350cc thumper maintained on a 2,500 km service schedule. Includes two ISI-certified helmets.',
      features: ['Dual-Channel ABS', '2 Helmets Included', 'Tripper Navigation', 'Phone Mount'],
      image_url: '/src/assets/images/fleet_classic_bike_1795285334107.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 6,
      name: 'Honda Activa 6G',
      category: 'Bike',
      model: '2024 Smart',
      transmission_type: 'Automatic',
      fuel_type: 'Petrol',
      price_per_day: 500,
      security_deposit: 1000,
      seats: 2,
      registration_number: 'HP-01M-2091',
      mileage: '48 km/l',
      location: 'Shimla',
      status: 'Available',
      description: 'Nimble gearless scooter perfect for navigating Mall Road approach lanes and local sightseeing stops.',
      features: ['Under-seat Storage', 'USB Charger', '1 Helmet Included', 'Silent Start'],
      image_url: '/src/assets/images/fleet_classic_bike_1795285334107.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 7,
      name: 'Tata Nexon EV',
      category: 'Car',
      model: '2024 Empowered LR',
      transmission_type: 'Automatic',
      fuel_type: 'Electric',
      price_per_day: 2800,
      security_deposit: 4000,
      seats: 5,
      registration_number: 'CH-01E-5582',
      mileage: '465 km range',
      location: 'Chandigarh',
      status: 'Available',
      description: 'Zero-emission long-range electric SUV with fast-charging cable included and regenerative hill descent braking.',
      features: ['465 km ARAI Range', 'DC Fast Charging', '360° Camera', '5-Star Safety'],
      image_url: '/src/assets/images/fleet_ev_crossover_1795285334284.jpg',
      is_active: true,
      created_at: nowIso,
    },
    {
      vehicle_id: 8,
      name: 'Force Traveller',
      category: 'Van',
      model: '2022 Executive 12S',
      transmission_type: 'Manual',
      fuel_type: 'Diesel',
      price_per_day: 4800,
      security_deposit: 6000,
      seats: 12,
      registration_number: 'HP-39D-6640',
      mileage: '12 km/l',
      location: 'Dharamshala',
      status: 'Available',
      description: 'High-roof 12-seater group touring van with reclining push-back seats, dual roof AC vents, and roof luggage rack.',
      features: ['12 Push-back Seats', 'Dual Roof AC', 'Roof Carrier', 'First-Aid Kit'],
      image_url: '/src/assets/images/fleet_touring_van_1795285334050.jpg',
      is_active: true,
      created_at: nowIso,
    },
  ];

  const bookings: BookingRecord[] = [
    {
      booking_id: 1001,
      user_id: 2,
      vehicle_id: 3,
      start_date: addDaysISO(-14),
      end_date: addDaysISO(-11),
      days: 3,
      base_amount: 10500,
      gst_amount: 1890,
      security_deposit: 5000,
      total_cost: 12390,
      booking_status: 'Completed',
      pickup_notes: 'Manali Mall Road Hub pickup at 9:00 AM',
      created_at: new Date(Date.now() - 16 * 86400000).toISOString(),
    },
    {
      booking_id: 1002,
      user_id: 2,
      vehicle_id: 7,
      start_date: addDaysISO(4),
      end_date: addDaysISO(7),
      days: 3,
      base_amount: 8400,
      gst_amount: 1512,
      security_deposit: 4000,
      total_cost: 9912,
      booking_status: 'Confirmed',
      pickup_notes: 'Chandigarh Sector 17 hub',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      booking_id: 1003,
      user_id: 2,
      vehicle_id: 5,
      start_date: addDaysISO(12),
      end_date: addDaysISO(15),
      days: 3,
      base_amount: 2700,
      gst_amount: 486,
      security_deposit: 1500,
      total_cost: 3186,
      booking_status: 'Pending',
      created_at: new Date().toISOString(),
    },
    {
      booking_id: 1004,
      user_id: 3,
      vehicle_id: 4,
      start_date: addDaysISO(-6),
      end_date: addDaysISO(-3),
      days: 3,
      base_amount: 16500,
      gst_amount: 2970,
      security_deposit: 8000,
      total_cost: 19470,
      booking_status: 'Completed',
      created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    {
      booking_id: 1005,
      user_id: 2,
      vehicle_id: 1,
      start_date: addDaysISO(-25),
      end_date: addDaysISO(-22),
      days: 3,
      base_amount: 5400,
      gst_amount: 972,
      security_deposit: 2500,
      total_cost: 6372,
      booking_status: 'Cancelled',
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    },
  ];

  const payments: PaymentRecord[] = [
    {
      payment_id: 1,
      booking_id: 1001,
      amount: 12390,
      payment_method: 'UPI / Card Online',
      payment_status: 'Paid',
      transaction_id: 'PAY_RR90418273',
      refund_id: null,
      paid_at: new Date(Date.now() - 16 * 86400000).toISOString(),
      refunded_at: null,
    },
    {
      payment_id: 2,
      booking_id: 1002,
      amount: 9912,
      payment_method: 'UPI / Card Online',
      payment_status: 'Paid',
      transaction_id: 'PAY_RR90881244',
      refund_id: null,
      paid_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      refunded_at: null,
    },
    {
      payment_id: 3,
      booking_id: 1004,
      amount: 19470,
      payment_method: 'UPI / Card Online',
      payment_status: 'Paid',
      transaction_id: 'PAY_RR90112945',
      refund_id: null,
      paid_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      refunded_at: null,
    },
    {
      payment_id: 4,
      booking_id: 1005,
      amount: 6372,
      payment_method: 'UPI / Card Online',
      payment_status: 'Refunded',
      transaction_id: 'PAY_RR89014200',
      refund_id: 'RFD_RR89014200',
      paid_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      refunded_at: new Date(Date.now() - 27 * 86400000).toISOString(),
    },
  ];

  const reviews: ReviewRecord[] = [
    {
      review_id: 1,
      vehicle_id: 3,
      user_id: 2,
      user_name: 'Aarav Mehta',
      rating: 5,
      comment: 'Spotless condition and strong 4x4 grip through snow patches past Solang Valley. Pickup took under 5 minutes.',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      review_id: 2,
      vehicle_id: 4,
      user_id: 3,
      user_name: 'Priya Verma',
      rating: 5,
      comment: 'Smooth highway ride from Chandigarh to Shimla with plenty of luggage room for five adults.',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      review_id: 3,
      vehicle_id: 7,
      user_id: 2,
      user_name: 'Aarav Mehta',
      rating: 4,
      comment: 'Quiet cabin and delivered with 96% battery. Fast charger adapter in the boot was super convenient.',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ];

  return {
    users,
    vehicles,
    bookings,
    payments,
    reviews,
    counters: {
      user: 5,
      vehicle: 9,
      booking: 1006,
      payment: 5,
      review: 4,
    },
  };
}

class Store {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(raw) as DatabaseState;
      }
    } catch {
      // Fallback to fresh seed if file is corrupted
    }
    const fresh = createInitialState();
    this.persist(fresh);
    return fresh;
  }

  private persist(nextState: DatabaseState) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(nextState, null, 2), 'utf8');
    } catch {
      // Ignore write failures in read-only runtimes
    }
  }

  get data(): DatabaseState {
    return this.state;
  }

  save() {
    this.persist(this.state);
  }
}

export const db = new Store();
