import { authService } from './authService';

// Production'da frontend va backend bitta domendan ishlaydi
const isProduction = import.meta.env.PROD;
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (isProduction ? '/api' : `${window.location.protocol}//${window.location.hostname}:4000/api`);

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders(),
      ...(options.headers || {})
    },
    ...options
  });

  if (response.status === 401) {
    authService.clearAuth();
    window.location.reload();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
