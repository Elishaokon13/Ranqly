import { ExploreClient } from "./ExploreClient";

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category =
    typeof params.category === "string" ? params.category : "all";

  return (
    <ExploreClient
      initialSearch={q}
      initialCategory={category === "all" ? undefined : category}
    />
  );
}
