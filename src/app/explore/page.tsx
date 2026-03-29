import { fetchContests } from "@/lib/api";
import { ExploreClient } from "./ExploreClient";

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category =
    typeof params.category === "string" ? params.category : "all";

  let initialContests: Awaited<ReturnType<typeof fetchContests>> = [];
  try {
    initialContests = await fetchContests({ limit: 100 });
  } catch {
    initialContests = [];
  }

  return (
    <ExploreClient
      initialContests={initialContests}
      initialSearch={q}
      initialCategory={category === "all" ? undefined : category}
    />
  );
}
