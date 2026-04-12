import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-6";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

type ControlAnswer = {
  controlId: string;
  question: string;
  value: number;
};

const maturityLabel = (value: number): string => {
  if (value >= 3) return "Fully Implemented";
  if (value >= 2) return "Partially Implemented";
  if (value >= 1) return "Initial / Ad-hoc";
  return "Not Implemented";
};

const extractText = (response: Anthropic.Messages.Message): string => {
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
};

async function callClaude(system: string, prompt: string): Promise<string> {
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    temperature: 0.2,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const text = extractText(response);
  if (!text) throw new Error("Empty AI response");
  return text;
}

export async function generateDomainAnalysis(
  domainName: string,
  score: number,
  controlAnswers: ControlAnswer[],
  sector: string
): Promise<string> {
  const controlsContext = controlAnswers
    .map((c) => `- ${c.controlId}: ${maturityLabel(c.value)} (${c.value}/3) | ${c.question}`)
    .join("\n");

  const system = "You are a principal GRC consultant writing concise, board-appropriate compliance analysis.";
  const prompt = [
    `Sector: ${sector}`,
    `Domain: ${domainName}`,
    `Score: ${Math.round(score)}%`,
    "Control evidence:",
    controlsContext,
    "",
    "Write 2-3 sentences that:",
    "1) Explain maturity posture and key gap(s)",
    "2) Provide one practical top recommendation",
    "3) Use plain business language without jargon",
  ].join("\n");

  return callClaude(system, prompt);
}

export async function generateExecutiveSummary(
  orgName: string,
  sector: string,
  overallScore: number,
  domainAnalyses: Array<{ domain: string; score: number; analysis: string }>
): Promise<string> {
  const summaryContext = domainAnalyses
    .map((d) => `- ${d.domain} (${Math.round(d.score)}%): ${d.analysis}`)
    .join("\n");

  const system = "You are a CISO advisor producing concise executive compliance briefings for board members.";
  const prompt = [
    `Organization: ${orgName}`,
    `Sector: ${sector}`,
    `Overall score: ${Math.round(overallScore)}%`,
    "Domain analyses:",
    summaryContext,
    "",
    "Write 5-7 sentences including:",
    "- current posture",
    "- top 3 risks",
    "- top 3 quick wins",
    "Keep the tone action-oriented and board-ready.",
  ].join("\n");

  return callClaude(system, prompt);
}
