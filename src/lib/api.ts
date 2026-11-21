export interface User {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  id_type: 'Driving Licence' | 'Aadhaar Card' | null;
  id_number: string | null;
  has_document: boolean;
  verification_status: 'Pending' | 'Approved' | 'Rejected';
  verification_remark: string | null;
  created_at: string;
}

export interface Vehicle {
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
  rating: number;
  review_count: number;
}

export interface Booking {
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
  vehicle_name?: string;
  model?: string;
  category?: string;
  location?: string;
  image_url?: string;
  registration_number?: string;
  payment_status?: string | null;
  payment_method?: string | null;
  transaction_id?: string | null;
  refund_id?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface Review {
  review_id: number;
  vehicle_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const TOKEN_KEY = 'rentride_token';
export const USER_KEY = 'rentride_user';

export function formatINR(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDateShort(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysBetween(start: string, end: string): number {
  if (!start || !end || end <= start) return 0;
  const s = new Date(`${start}T00:00:00Z`).getTime();
  const e = new Date(`${end}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((e - s) / 86400000));
}

export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params } = options;
  let url = `/api${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    const str = qs.toString();
    if (str) url += `?${str}`;
  }

  const headers: Record<string, string> = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data as T;
}

export function fileToCompressedDataUrl(file: File, maxWidth = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
