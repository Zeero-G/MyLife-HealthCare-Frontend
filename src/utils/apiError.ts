/** Normalize FastAPI / backend error `detail` for display. */
export function formatApiErrorDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: string }).msg);
        }
        return typeof item === 'string' ? item : JSON.stringify(item);
      })
      .join(' ');
  }
  if (detail && typeof detail === 'object' && 'msg' in detail) {
    return String((detail as { msg: string }).msg);
  }
  return 'Request failed';
}

export const SIGNED_URL_HINT =
  'This download link is temporary and may have expired. Close and reopen the record to refresh the link.';

export const AI_PERMISSION_MESSAGE =
  'You do not have permission to view this AI result.';
