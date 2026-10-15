import { startObservation } from "@langfuse/tracing";
import type { LLMCallInfo, LLMProvider, LLMRequest } from "./provider";

/** Bump when the lesson prompt changes, so traces and evals can compare prompt versions. */
export const LESSON_PROMPT_VERSION = "lesson-v1";

export const tracingEnabled = (env: Record<string, string | undefined> = process.env) =>
  Boolean(env.LANGFUSE_PUBLIC_KEY && env.LANGFUSE_SECRET_KEY);

/**
 * Starts sending traces to Langfuse when its keys are set; otherwise does nothing. Called from
 * `src/instrumentation.ts` for the app and directly by scripts. Returns a flush for short-lived scripts.
 */
export async function registerTracing(): Promise<(() => Promise<void>) | null> {
  if (!tracingEnabled()) return null;
  const { NodeTracerProvider } = await import("@opentelemetry/sdk-trace-node");
  const { LangfuseSpanProcessor } = await import("@langfuse/otel");
  const provider = new NodeTracerProvider({ spanProcessors: [new LangfuseSpanProcessor()] });
  provider.register();
  return () => provider.forceFlush();
}

const counts = (u: LLMCallInfo["usage"]) =>
  Object.fromEntries(Object.entries(u ?? {}).filter((e): e is [string, number] => typeof e[1] === "number"));

/**
 * Calls the model and validates its output, recorded as one Langfuse generation: model, prompt
 * version, latency, tokens, whether a fallback model served it, schema pass or fail and the facts
 * cited. Without Langfuse keys no tracer is registered and the observation is a no-op.
 * Requests hold only region-pack facts and the topic, language and age group: no personal data.
 */
export async function generateValidated<T>(
  llm: LLMProvider,
  request: Omit<LLMRequest, "onInfo">,
  opts: {
    name: string;
    promptVersion: string;
    metadata?: Record<string, unknown>;
    parse: (text: string) => T;
    cited?: (result: T) => string[];
  },
): Promise<T> {
  const gen = startObservation(opts.name, { input: request, version: opts.promptVersion }, { asType: "generation" });
  const metadata: Record<string, unknown> = { provider: llm.name, ...opts.metadata };
  let info: LLMCallInfo | undefined;
  let text: string | undefined;
  try {
    text = await llm.generateJson({ ...request, onInfo: (i) => (info = i) });
    const result = opts.parse(text);
    metadata.schemaValid = true;
    if (opts.cited) metadata.factsCited = opts.cited(result);
    gen.update({ output: result });
    return result;
  } catch (err) {
    if (text !== undefined) metadata.schemaValid = false;
    gen.update({ output: text, level: "ERROR", statusMessage: String((err as Error)?.message ?? err) });
    throw err;
  } finally {
    if (info) Object.assign(metadata, { attempts: info.attempts, fallbackUsed: info.attempts > 1 });
    gen.update({ model: info?.model, usageDetails: counts(info?.usage), metadata });
    gen.end();
  }
}
