import { useQuery } from "@tanstack/react-query";

export const useApi = (queryKey: string[], queryFn: () => Promise<any>) => {
  return useQuery({
    queryKey,
    queryFn,
    select: (response) => response.data,
  });
};