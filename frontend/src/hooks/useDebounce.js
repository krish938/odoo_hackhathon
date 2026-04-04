import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (default 300ms).
 * Returns the debounced value — only updates after the user stops typing.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
