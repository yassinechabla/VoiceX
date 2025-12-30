import client from './client';

export interface Restaurant {
  _id: string;
  name: string;
  timezone: string;
  phoneNumber: string;
  slotMinutes: number;
  avgDurationMin: number;
  bufferMin: number;
  openingHours: Array<{
    dayOfWeek: number;
    open: string;
    close: string;
    closed?: boolean;
  }>;
}

export const restaurantApi = {
  get: async (): Promise<Restaurant> => {
    const response = await client.get<Restaurant>('/api/admin/restaurant');
    return response.data;
  },
  
  update: async (data: Partial<Restaurant>): Promise<Restaurant> => {
    const response = await client.put<Restaurant>('/api/admin/restaurant', data);
    return response.data;
  },
};

