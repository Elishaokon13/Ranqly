import { fetchContests } from "@/lib/api";
import { MOCK_CONTESTS } from "@/lib/mock-data";
import { ExploreClient } from "./ExploreClient";

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category =
    typeof params.category === "string" ? params.category : "all";

  let initialContests = MOCK_CONTESTS;
  try {
    const apiContests = await fetchContests({ limit: 100 });
    if (apiContests.length > 0) initialContests = apiContests;
  } catch {
    // use mock when API unavailable
  }

  return (
    <ExploreClient
      initialContests={initialContests}
      initialSearch={q}
      initialCategory={category === "all" ? undefined : category}
    />
  );
}
