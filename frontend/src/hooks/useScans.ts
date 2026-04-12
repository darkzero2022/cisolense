import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Scan, ScanFinding } from "@/types";

export const useScans = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["scans", clientOrgId],
    queryFn: async () => {
      const params = clientOrgId ? `?clientOrgId=${clientOrgId}` : "";
      const { data } = await api.get<{ scans: Scan[] }>(`/scans${params}`);
      return data.scans;
    },
    enabled: Boolean(clientOrgId),
  });

export const useScan = (scanId?: string) =>
  useQuery({
    queryKey: ["scans", scanId],
    queryFn: async () => {
      const { data } = await api.get<{ scan: Scan & { findings: ScanFinding[] } }>(`/scans/${scanId}`);
      return data.scan;
    },
    enabled: Boolean(scanId),
  });

export const useCreateScan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { clientOrgId: string; target: string; scanType: "basic" | "full" }) =>
      api.post<{ scan: Scan }>("/scans", payload),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: ["scans", payload.clientOrgId] });
    },
  });
};
