import { HierarchyNode } from '../types';
import { apiRequest } from './api';

export const hierarchyApi = {
  async get(): Promise<HierarchyNode[]> {
    return apiRequest<HierarchyNode[]>('/hierarchy');
  },
  async save(data: HierarchyNode[]): Promise<void> {
    await apiRequest('/hierarchy', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
};
