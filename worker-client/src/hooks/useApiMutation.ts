import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useApiMutation = (
  mutationFn: (payload: any) => Promise<any>,
  invalidateKey?: string // just pass the base key
) => {
const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateKey) {
        queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      }
    },
  });
};