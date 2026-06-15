import type { CreateRemixError } from '../types';

export function formatCreateRemixError(error: CreateRemixError): string {
  if (error.type === 'network') {
    return 'Could not connect to the server. Please check your connection.';
  }

  if (error.type === 'timeout') {
    return 'Upload timed out. Please try again.';
  }

  return error.body.detail || `Server error (${error.status})`;
}
