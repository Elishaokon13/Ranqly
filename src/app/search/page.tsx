import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  if (q) {
    redirect(`/explore?q=${encodeURIComponent(q)}`);
  }

  redirect("/explore");
}
