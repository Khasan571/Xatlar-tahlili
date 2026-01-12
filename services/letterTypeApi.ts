import { LetterType } from '../types';
import { apiRequest } from './api';

export const letterTypeApi = {
  async list(): Promise<LetterType[]> {
    return apiRequest<LetterType[]>('/letter-types');
  },
  async saveAll(types: LetterType[]): Promise<void> {
    await apiRequest('/letter-types', {
      method: 'PUT',
      body: JSON.stringify(types)
    });
  }
};
