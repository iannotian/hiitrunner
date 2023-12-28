import { useCallback, useRef } from "react";

interface DebounceFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
}

export const useDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): DebounceFunction<T> => {
  const callbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFunc = useCallback(
    (...args: Parameters<T>) => {
      if (callbackRef.current !== null) {
        clearTimeout(callbackRef.current);
      }
      callbackRef.current = setTimeout(() => func(...args), delay);
    },
    [func, delay]
  );

  return debouncedFunc;
};
