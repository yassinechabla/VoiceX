import client from './client';

export interface Reservation {
  _id: string;
  restaurantId: string;
  status: 'HOLD' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  customerName: string;
  customerPhone: string;
  partySize: number;
  startAt: string;
  endAt: string;
  tablesAssigned: any[];
  notes?: string;
  source: 'VOICE' | 'ADMIN';
  callSid?: string;
  language?: 'FR' | 'EN';
  createdAt: string;
  updatedAt: string;
}

export const reservationsApi = {
  getAll: async (params?: { date?: string; status?: string; startDate?: string; endDate?: string }): Promise<Reservation[]> => {
    const response = await client.get<Reservation[]>('/api/admin/reservations', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<Reservation> => {
    const response = await client.get<Reservation>(`/api/admin/reservations/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: Reservation['status']): Promise<Reservation> => {
    const response = await client.patch<Reservation>(`/api/admin/reservations/${id}`, { status });
    return response.data;
  },
  
  create: async (data: {
    startAt: string;
    partySize: number;
    customerName: string;
    customerPhone: string;
    notes?: string;
  }): Promise<Reservation> => {
    const response = await client.post<Reservation>('/api/admin/reservations', data);
    return response.data;
  },
};

