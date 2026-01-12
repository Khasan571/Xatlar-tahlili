import { StoredDocument } from '../types';
import { apiRequest } from './api';

interface PaginatedResponse {
  documents: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const normalize = (raw: any): StoredDocument => ({
  id: raw.id,
  timestamp: Number(raw.timestamp),
  fileName: raw.fileName || undefined,
  contentSnippet: raw.contentSnippet || '',
  fullContent: raw.fullContent || '',
  analysis: raw.analysis
});

export const documentApi = {
  async list(page: number = 1, limit: number = 100): Promise<{ documents: StoredDocument[]; pagination: PaginatedResponse['pagination'] }> {
    const data = await apiRequest<PaginatedResponse>(`/documents?page=${page}&limit=${limit}`);
    return {
      documents: data.documents.map(normalize),
      pagination: data.pagination
    };
  },
  async getAll(): Promise<StoredDocument[]> {
    // For backwards compatibility - fetches all documents
    const data = await apiRequest<PaginatedResponse>('/documents?limit=1000');
    return data.documents.map(normalize);
  },
  async create(doc: Omit<StoredDocument, 'id'> & { id?: string }): Promise<StoredDocument> {
    const saved = await apiRequest<StoredDocument>('/documents', {
      method: 'POST',
      body: JSON.stringify(doc)
    });
    return normalize(saved);
  },
  async delete(id: string): Promise<void> {
    await apiRequest(`/documents/${id}`, { method: 'DELETE' });
  }
};
