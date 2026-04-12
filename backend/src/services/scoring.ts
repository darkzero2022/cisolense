const MATURITY_PCT: Record<number, number> = { 0: 0, 1: 33, 2: 67, 3: 100 };

export interface AnswerInput { value: number; domainCode: string; domainName: string; }

export function computeDomainScores(answers: AnswerInput[]): Record<string, { name: string; score: number }> {
  const grouped: Record<string, { name: string; values: number[] }> = {};
  for (const a of answers) {
    if (!grouped[a.domainCode]) grouped[a.domainCode] = { name: a.domainName, values: [] };
    grouped[a.domainCode].values.push(MATURITY_PCT[a.value] ?? 0);
  }
  const result: Record<string, { name: string; score: number }> = {};
  for (const [code, { name, values }] of Object.entries(grouped)) {
    result[code] = { name, score: Math.round(values.reduce((a, b) => a + b, 0) / values.length) };
  }
  return result;
}

export function computeOverallScore(domainScores: Record<string, { score: number }>): number {
  const scores = Object.values(domainScores).map((d) => d.score);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Priority matrix: effort (LOW=1, MEDIUM=2, HIGH=3) × impact (HIGH=3, MEDIUM=2, LOW=1)
export function computePriority(effort: string, impact: string): number {
  const e = effort === "LOW" ? 1 : effort === "MEDIUM" ? 2 : 3;
  const i = impact === "HIGH" ? 3 : impact === "MEDIUM" ? 2 : 1;
  return Math.round((e + (4 - i)) / 2); // 1 = highest priority
}
