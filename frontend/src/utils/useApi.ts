import { useEffect, useState, DependencyList, useRef } from "react";

const useApi = <T>(
  apiFunction: () => Promise<T>,
  deps: DependencyList = []
) => {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    console.log("useApi: Starting API call", deps);
    setLoading(true);
    setError(null);

    apiFunction()
      .then((response) => {
        console.log("useApi: Got response", response);
        if (isMounted.current) {
          setData(response);
        }
      })
      .catch((error) => {
        console.log("useApi: Got error", error);
        if (isMounted.current) {
          setError(
            error instanceof Error ? error.message : "An error occurred"
          );
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
};

export default useApi;
