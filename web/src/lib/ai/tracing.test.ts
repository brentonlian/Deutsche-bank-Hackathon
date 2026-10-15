import { InMemorySpanExporter, NodeTracerProvider, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { LLMProvider } from "./provider";
import { generateValidated } from "./tracing";

const exporter = new InMemorySpanExporter();
beforeAll(() => new NodeTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] }).register());
afterEach(() => exporter.reset());

/** A provider whose first model is "out of quota", so the second one serves the call. */
const fallbackProvider = (text: string): LLMProvider => ({
  name: "fake",
  async generateJson({ onInfo }) {
    onInfo?.({ model: "fake-lite", attempts: 2, usage: { input: 120, output: 40 } });
    return text;
  },
});

const parse = (text: string) => {
  const v = JSON.parse(text) as { factsUsed?: string[] };
  if (!Array.isArray(v.factsUsed)) throw new Error("factsUsed missing");
  return v as { factsUsed: string[] };
};

const attrs = () => exporter.getFinishedSpans()[0]?.attributes ?? {};

describe("generateValidated tracing", () => {
  it("records model, fallback, tokens, prompt version and cited facts", async () => {
    const out = await generateValidated(fallbackProvider('{"factsUsed":["inflation"]}'), { system: "s", prompt: "p" }, {
      name: "lesson",
      promptVersion: "lesson-v1",
      parse,
      cited: (r) => r.factsUsed,
    });
    expect(out.factsUsed).toEqual(["inflation"]);
    expect(attrs()).toMatchObject({
      "langfuse.observation.type": "generation",
      "langfuse.version": "lesson-v1",
      "langfuse.observation.model.name": "fake-lite",
      "langfuse.observation.usage_details": JSON.stringify({ input: 120, output: 40 }),
      "langfuse.observation.metadata.schemaValid": "true",
      "langfuse.observation.metadata.factsCited": JSON.stringify(["inflation"]),
      "langfuse.observation.metadata.fallbackUsed": "true",
    });
  });

  it("marks the generation as an error when the output fails the schema", async () => {
    const call = generateValidated(fallbackProvider('{"title":"no facts"}'), { system: "s", prompt: "p" }, { name: "lesson", promptVersion: "lesson-v1", parse });
    await expect(call).rejects.toThrow("factsUsed missing");
    expect(attrs()).toMatchObject({
      "langfuse.observation.level": "ERROR",
      "langfuse.observation.metadata.schemaValid": "false",
    });
  });
});
