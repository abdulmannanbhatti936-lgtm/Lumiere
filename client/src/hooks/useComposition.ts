import { useEffect, useRef } from 'react';

export function usePersistFn<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn);

  useEffect(() => {
    ref.current = fn;
  }, [fn]);

  return ((...args) => ref.current(...args)) as T;
}
