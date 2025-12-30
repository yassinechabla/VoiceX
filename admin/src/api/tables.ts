import client from './client';

export interface Table {
  _id: string;
  restaurantId: string;
  name: string;
  capacity: number;
  zone?: string;
  isJoinable: boolean;
  createdAt: string;
  updatedAt: string;
}

export const tablesApi = {
  getAll: async (): Promise<Table[]> => {
    const response = await client.get<Table[]>('/api/admin/tables');
    return response.data;
  },
  
  create: async (data: { name: string; capacity: number; zone?: string; isJoinable?: boolean }): Promise<Table> => {
    const response = await client.post<Table>('/api/admin/tables', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<Table>): Promise<Table> => {
    const response = await client.put<Table>(`/api/admin/tables/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await client.delete(`/api/admin/tables/${id}`);
  },
};

