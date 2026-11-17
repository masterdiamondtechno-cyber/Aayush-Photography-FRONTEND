import { useEffect } from 'react';

const LOGIN_RESPONSE_STORAGE_KEY = 'lastSuccessfulLoginResponse';

export function clearStoredLoginResponse() {
  sessionStorage.removeItem(LOGIN_RESPONSE_STORAGE_KEY);
}

export function storeLoginResponse(response) {
  sessionStorage.setItem(LOGIN_RESPONSE_STORAGE_KEY, JSON.stringify(response));
}

export function useLoginRedirectLogger(pageLabel) {
  useEffect(() => {
    const storedResponse = sessionStorage.getItem(LOGIN_RESPONSE_STORAGE_KEY);

    if (!storedResponse) {
      return;
    }

    try {
      const parsedResponse = JSON.parse(storedResponse);
      console.log(`[Login Redirect] ${pageLabel}`, parsedResponse);
    } catch (error) {
      console.error('[Login Redirect] Failed to parse stored login response.', error);
      console.log(`[Login Redirect] ${pageLabel}`, storedResponse);
    } finally {
      clearStoredLoginResponse();
    }
  }, [pageLabel]);
}
