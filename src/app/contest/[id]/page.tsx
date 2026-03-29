import { notFound } from "next/navigation";
import { fetchContest } from "@/lib/api";
import { ContestDetailContent } from "./ContestDetailContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContestDetailPage({ params }: PageProps) {
  const { id } = await params;
  const contest = await fetchContest(id);
  if (!contest) notFound();
  return <ContestDetailContent contest={contest} />;
}
