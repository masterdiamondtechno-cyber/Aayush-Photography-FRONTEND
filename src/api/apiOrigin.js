 const DEV_API_ORIGIN = 'http://localhost:8080/';
const PROD_API_ORIGIN =
  typeof window !== 'undefined' ? window.location.origin : '';

const normalizeOrigin = (origin = '') => origin.replace(/\/+$/, '');
export const API_ORIGIN = normalizeOrigin(
  import.meta.env.VITE_API_ORIGIN ??
  (import.meta.env.DEV ? DEV_API_ORIGIN : PROD_API_ORIGIN)
);

export const withApiOrigin = (path) => `${API_ORIGIN}${path}`;