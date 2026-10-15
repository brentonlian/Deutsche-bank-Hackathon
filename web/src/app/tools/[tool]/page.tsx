import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ToolView } from "@/components/tools/Tools";
import { TOOLS, isTool } from "@/lib/learning";

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ tool }));
}

async function Tool({ params }: { params: PageProps<"/tools/[tool]">["params"] }) {
  const { tool } = await params;
  if (!isTool(tool)) notFound();
  return <ToolView tool={tool} />;
}

export default function ToolPage({ params }: PageProps<"/tools/[tool]">) {
  return (
    <Suspense>
      <Tool params={params} />
    </Suspense>
  );
}
