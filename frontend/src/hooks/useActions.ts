import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Action, ActionStatus } from "@/types";

export const useActions = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["actions", clientOrgId],
    queryFn: async () => {
      const params = clientOrgId ? `?clientOrgId=${clientOrgId}` : "";
      const { data } = await api.get<{ actions: Action[] }>(`/actions${params}`);
      return data.actions;
    },
  });

export const useUpdateActionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus }) => api.patch(`/actions/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actions"] }),
  });
};
