import { isAxiosError } from 'axios';

export function extractErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { message?: string | string[] };
    if (typeof data.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }
    if (Array.isArray(data.message) && data.message.length > 0) {
      return data.message.join(', ');
    }
  }
  if (error instanceof Error && error.message && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}
