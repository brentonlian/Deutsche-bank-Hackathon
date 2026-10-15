/** Next.js calls this once per server start. Tracing is optional and off without Langfuse keys. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerTracing } = await import("@/lib/ai/tracing");
  await registerTracing();
}
