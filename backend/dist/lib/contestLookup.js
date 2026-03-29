"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findContestByIdOrSlug = findContestByIdOrSlug;
/** Resolve route param as either Prisma `id` (cuid) or `slug`. */
async function findContestByIdOrSlug(prisma, idOrSlug) {
    return prisma.contest.findFirst({
        where: {
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        },
    });
}
