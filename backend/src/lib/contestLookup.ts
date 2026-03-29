import type { PrismaClient } from "@prisma/client";
import type { Contest } from "@prisma/client";

/** Resolve route param as either Prisma `id` (cuid) or `slug`. */
export async function findContestByIdOrSlug(
  prisma: PrismaClient,
  idOrSlug: string
): Promise<Contest | null> {
  return prisma.contest.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });
}
