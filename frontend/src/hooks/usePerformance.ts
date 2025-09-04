import { useEffect, useRef } from "react";
import { API_CONFIG } from "../config/api";

// Performance monitoring utilities (dev only)
export const usePerformanceMonitor = (componentName: string) => {
  const renderStart = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    if (!API_CONFIG.IS_DEVELOPMENT) return;

    renderStart.current = performance.now();
    renderCount.current += 1;
  });

  useEffect(() => {
    if (!API_CONFIG.IS_DEVELOPMENT) return;

    const renderTime = performance.now() - renderStart.current;

    // Log slow renders that could affect 60fps
    if (renderTime > 16) {
      console.warn(
        `[Performance] ${componentName} render took ${renderTime.toFixed(
          2
        )}ms (render #${renderCount.current})`
      );
    }
  });

  return { renderCount: renderCount.current };
};

export const measureApiCall = async <T>(
  apiCall: () => Promise<T>,
  operationName: string
): Promise<T> => {
  if (!API_CONFIG.IS_DEVELOPMENT) {
    return apiCall();
  }

  const start = performance.now();

  try {
    const result = await apiCall();
    const duration = performance.now() - start;

    console.log(`[API Performance] ${operationName}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `[API Performance] ${operationName} failed after ${duration.toFixed(
        2
      )}ms:`,
      error
    );
    throw error;
  }
};
