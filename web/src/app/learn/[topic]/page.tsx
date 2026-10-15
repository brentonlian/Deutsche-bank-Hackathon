import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LessonView } from "@/components/learn/LessonView";
import { TOPICS, isTopic } from "@/lib/lessons";

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ topic }));
}

async function Topic({ params }: { params: PageProps<"/learn/[topic]">["params"] }) {
  const { topic } = await params;
  if (!isTopic(topic)) notFound();
  return <LessonView topic={topic} />;
}

export default function TopicPage({ params }: PageProps<"/learn/[topic]">) {
  return (
    <Suspense>
      <Topic params={params} />
    </Suspense>
  );
}
