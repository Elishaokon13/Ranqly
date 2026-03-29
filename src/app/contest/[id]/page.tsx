import { notFound } from "next/navigation";
import { fetchContest } from "@/lib/api";
import { MOCK_CONTESTS } from "@/lib/mock-data";
import { ContestDetailContent } from "./ContestDetailContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContestDetailPage({ params }: PageProps) {
  const { id } = await params;
  let contest = await fetchContest(id);
  if (!contest) contest = MOCK_CONTESTS.find((c) => c.id === id) ?? null;
  if (!contest) notFound();
  return <ContestDetailContent contest={contest} />;
}
