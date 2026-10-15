import { GoogleGenAI } from "@google/genai";

/**
 * Provider-agnostic LLM access. The app only ever asks for JSON text back, so swapping
 * Gemini for a local Ollama model (or Vertex AI in production) is a config change.
 */
export interface LLMProvider {
  readonly name: string;
  generateJson(request: { system: string; prompt: string }): Promise<string>;
}

/** Quota exhausted or model overloaded: worth trying the next model. */
const isQuotaError = (err: unknown) => /429|503|quota|RESOURCE_EXHAUSTED|UNAVAILABLE|high demand/i.test(String((err as Error)?.message ?? err));

/** Tries each model in order; when one runs out of quota the next one takes over. */
class GeminiProvider implements LLMProvider {
  readonly name: string;
  private client: GoogleGenAI;
  constructor(apiKey: string, private models: string[]) {
    this.client = new GoogleGenAI({ apiKey });
    this.name = `gemini:${models.join("|")}`;
  }
  async generateJson({ system, prompt }: { system: string; prompt: string }) {
    let lastError: unknown;
    for (const model of this.models) {
      try {
        const res = await this.client.models.generateContent({
          model,
          contents: prompt,
          config: { systemInstruction: system, responseMimeType: "application/json", temperature: 0.3 },
        });
        if (!res.text) throw new Error("Gemini returned no text");
        return res.text;
      } catch (err) {
        lastError = err;
        if (!isQuotaError(err)) throw err;
      }
    }
    throw lastError;
  }
}

class OllamaProvider implements LLMProvider {
  readonly name: string;
  constructor(private baseUrl: string, private model: string) {
    this.name = `ollama:${model}`;
  }
  async generateJson({ system, prompt }: { system: string; prompt: string }) {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama error ${res.status}`);
    const data = (await res.json()) as { message?: { content?: string } };
    if (!data.message?.content) throw new Error("Ollama returned no content");
    return data.message.content;
  }
}

class OpenAIProvider implements LLMProvider {
  readonly name: string;
  constructor(private apiKey: string, private model: string) {
    this.name = `openai:${model}`;
  }
  async generateJson({ system, prompt }: { system: string; prompt: string }) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("OpenAI returned no content");
    return text;
  }
}

/** Returns the configured provider, or null when none is configured (the app then serves cached content only). */
export function getProvider(env: Record<string, string | undefined> = process.env): LLMProvider | null {
  switch (env.LLM_PROVIDER ?? "gemini") {
    case "gemini":
      return env.GEMINI_API_KEY
        ? new GeminiProvider(env.GEMINI_API_KEY, (env.GEMINI_MODELS ?? "gemini-2.5-flash,gemini-2.5-flash-lite").split(","))
        : null;
    case "ollama":
      return new OllamaProvider(env.OLLAMA_BASE_URL ?? "http://localhost:11434", env.OLLAMA_MODEL ?? "qwen2.5:32b");
    case "openai":
      return env.OPENAI_API_KEY ? new OpenAIProvider(env.OPENAI_API_KEY, env.OPENAI_MODEL ?? "gpt-4o-mini") : null;
    default:
      return null;
  }
}

/** Models sometimes wrap JSON in a code fence; strip it before parsing. */
export function parseJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  return JSON.parse(cleaned) as T;
}
