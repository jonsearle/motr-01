export interface GarageSettings {
  id: string;
  auto_sms_enabled: boolean;
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  description: string | null;
  date: string;
  time: string;
  created_at: string;
}

export interface CreateBookingInput {
  name: string;
  phone: string;
  service_type: string;
  description?: string;
  date: string;
  time: string;
}
