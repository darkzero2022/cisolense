import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ExportJob } from "@/types";

export const useExportReport = () =>
  useMutation({
    mutationFn: async (assessmentId: string) => {
      const { data } = await api.post<{ jobId: string; status: string; fileName: string }>(
        "/exports",
        { assessmentId }
      );
      return data;
    },
  });

export const useExportJob = (jobId: string | null) =>
  useQuery<ExportJob>({
    queryKey: ["exports", jobId],
    queryFn: async () => {
      const { data } = await api.get<ExportJob>(`/exports/${jobId}`);
      return data;
    },
    enabled: Boolean(jobId),
    refetchInterval: (q) => {
      const job = q.state.data as ExportJob | undefined;
      return job?.status === "PENDING" ? 1500 : false;
    },
  });

export const downloadExport = (fileName: string) => {
  const baseUrl = import.meta.env.VITE_API_URL;
  const url = `${baseUrl}/exports/download/${fileName}`;
  window.open(url, "_blank");
};
