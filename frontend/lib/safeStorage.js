// Safe storage utility that checks if storage is available
// Handles SSR and private browsing mode gracefully

export const getSafeStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a no-op storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  try {
    // Try to access sessionStorage
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return sessionStorage;
  } catch (e) {
    // Private browsing or storage full - return a no-op storage
    console.warn('sessionStorage not available, using in-memory storage:', e.message);
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
};

export const getSafeLocalStorage = () => {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a no-op storage
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }

  try {
    // Try to access localStorage
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return localStorage;
  } catch (e) {
    // Private browsing or storage full - return a no-op storage
    console.warn('localStorage not available, using in-memory storage:', e.message);
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
};
