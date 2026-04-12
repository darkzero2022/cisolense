import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EvidenceFile } from "@/types";

export const useEvidence = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["evidence", clientOrgId],
    queryFn: async () => {
      const params = clientOrgId ? `?clientOrgId=${clientOrgId}` : "";
      const { data } = await api.get<{ files: EvidenceFile[] }>(`/evidence${params}`);
      return data.files;
    },
    enabled: true,
  });

export const useInvalidateEvidence = (clientOrgId?: string) => {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["evidence", clientOrgId] });
};
