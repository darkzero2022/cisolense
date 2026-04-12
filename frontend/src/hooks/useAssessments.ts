import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Assessment } from "@/types";

export const useAssessments = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["assessments", clientOrgId],
    queryFn: async () => {
      const params = clientOrgId ? `?clientOrgId=${clientOrgId}` : "";
      const { data } = await api.get<{ assessments: Assessment[] }>(`/assessments${params}`);
      return data.assessments;
    },
  });

export const useAssessment = (id: string) =>
  useQuery({ queryKey: ["assessment", id], queryFn: async () => { const { data } = await api.get<{ assessment: Assessment }>(`/assessments/${id}`); return data.assessment; }, enabled: !!id });

export const useStartAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { clientOrgId: string; frameworkId: string }) => api.post<{ assessment: Assessment }>("/assessments", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assessments"] }),
  });
};

export const useSaveAnswer = (assessmentId: string) =>
  useMutation({ mutationFn: (payload: { questionId: string; controlId: string; value: number; note?: string }) => api.post(`/assessments/${assessmentId}/answer`, payload) });

export const useCompleteAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<{ assessment: Assessment; overallScore: number }>(`/assessments/${id}/complete`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assessments"] }); qc.invalidateQueries({ queryKey: ["actions"] }); },
  });
};

export const useAnalyzeAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; force?: boolean }) =>
      api.post(`/assessments/${payload.id}/analyze${payload.force ? "?force=true" : ""}`),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: ["assessment", payload.id] });
      qc.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
};
