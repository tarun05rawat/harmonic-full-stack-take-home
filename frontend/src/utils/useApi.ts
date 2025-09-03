import { useEffect, useState, DependencyList } from "react";

const useApi = <T>(
  apiFunction: () => Promise<T>,
  deps: DependencyList = []
) => {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiFunction()
      .then((response) => {
        setData(response);
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, deps);

  return { data, loading, error };
};

export default useApi;
