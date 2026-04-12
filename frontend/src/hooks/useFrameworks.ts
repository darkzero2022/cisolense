import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Framework } from "@/types";

export const useFrameworks = () =>
  useQuery({ queryKey: ["frameworks"], queryFn: async () => { const { data } = await api.get<{ frameworks: Framework[] }>("/frameworks"); return data.frameworks; } });

export const useFrameworkQuestions = (id: string) =>
  useQuery({ queryKey: ["framework-questions", id], queryFn: async () => { const { data } = await api.get(`/frameworks/${id}/questions`); return data.framework; }, enabled: !!id });
