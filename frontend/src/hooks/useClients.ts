import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ClientOrg } from "@/types";

export const useClients = () =>
  useQuery({ queryKey: ["clients"], queryFn: async () => { const { data } = await api.get<{ orgs: ClientOrg[] }>("/clients"); return data.orgs; } });

export const useClient = (id: string) =>
  useQuery({ queryKey: ["clients", id], queryFn: async () => { const { data } = await api.get<{ org: ClientOrg }>(`/clients/${id}`); return data.org; }, enabled: !!id });

export const useCreateClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ClientOrg> & { frameworkIds?: string[] }) => api.post("/clients", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
};
