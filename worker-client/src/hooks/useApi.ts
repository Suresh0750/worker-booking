import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios"

export const useApi = <T, S = T>(                    // ← add S generic
  queryKey: readonly unknown[],
  queryFn: () => Promise<AxiosResponse<T>>,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchOnWindowFocus?: boolean
    select?: (data: T) => S                          // ← add this
  }
) => {
  return useQuery<AxiosResponse<T>, Error, S>({      // ← T to S
    queryKey,
    queryFn,
    select: (response) => 
      options?.select 
        ? options.select(response.data)              // ← custom transform
        : response.data as unknown as S,             // ← default behavior
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    enabled: options?.enabled ?? true,
  })
}