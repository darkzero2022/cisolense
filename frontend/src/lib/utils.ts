export const getScoreColor = (score: number): string => {
  if (score >= 75) return "var(--emerald)";
  if (score >= 50) return "var(--amber)";
  return "var(--red)";
};
export const getRiskLevel = (score: number): "green" | "amber" | "red" => {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
};
export const getRiskLabel = (score: number) => score >= 75 ? "Low Risk" : score >= 50 ? "Medium Risk" : "High Risk";
export const avgScore = (scores: Record<string, number>): number => {
  const vals = Object.values(scores);
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const validateEmail = (value: string): boolean => {
  const email = value.trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
