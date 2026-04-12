import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { GapAnalysisItem, ComplianceMatrixRow, EvidenceCoverageItem } from "@/types";

export const useGapAnalysis = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["reports", "gap-analysis", clientOrgId],
    queryFn: async () => {
      const { data } = await api.get<{ items: GapAnalysisItem[] }>(
        `/reports/gap-analysis${clientOrgId ? `?clientOrgId=${clientOrgId}` : ""}`
      );
      return data.items;
    },
    enabled: Boolean(clientOrgId),
  });

export const useComplianceMatrix = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["reports", "compliance-matrix", clientOrgId],
    queryFn: async () => {
      const { data } = await api.get<{ matrix: ComplianceMatrixRow[] }>(
        `/reports/compliance-matrix${clientOrgId ? `?clientOrgId=${clientOrgId}` : ""}`
      );
      return data.matrix;
    },
    enabled: Boolean(clientOrgId),
  });

export const useEvidenceCoverage = (clientOrgId?: string) =>
  useQuery({
    queryKey: ["reports", "evidence-coverage", clientOrgId],
    queryFn: async () => {
      const { data } = await api.get<{ coverage: EvidenceCoverageItem[] }>(
        `/reports/evidence-coverage${clientOrgId ? `?clientOrgId=${clientOrgId}` : ""}`
      );
      return data.coverage;
    },
    enabled: Boolean(clientOrgId),
  });
