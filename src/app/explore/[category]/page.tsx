import { redirect, notFound } from "next/navigation";

const VALID_CATEGORIES = ["content", "design", "dev", "research", "other"] as const;

interface PageProps {
  params: Promise<{ category: string }>;
}

export default async function CategoryLandingPage({ params }: PageProps) {
  const { category } = await params;
  const slug = category.toLowerCase();

  if (!VALID_CATEGORIES.includes(slug as (typeof VALID_CATEGORIES)[number])) {
    notFound();
  }

  redirect(`/explore?category=${slug}`);
}
