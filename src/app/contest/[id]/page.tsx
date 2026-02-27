import { notFound } from "next/navigation";
import { MOCK_CONTESTS } from "@/lib/mock-data";
import { ContestDetailContent } from "./ContestDetailContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const contest = MOCK_CONTESTS.find((c) => c.id === id);
  if (!contest) notFound();
  return <ContestDetailContent contest={contest} />;
}
