"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Inbox,
} from "lucide-react";
import { ContestCard } from "@/components/contest";
import { Button, EmptyState, Select, SelectItem } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MOCK_CONTESTS,
  CATEGORY_LABELS,
} from "@/lib/mock-data";

const statusFilters: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "submission", label: "Submissions Open" },
  { value: "voting", label: "Community Voting" },
  { value: "judging", label: "Expert Judging" },
  { value: "scoring", label: "Scoring" },
  { value: "completed", label: "Completed" },
];

const categoryFilters: { value: string; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "content", label: "Content" },
  { value: "design", label: "Design" },
  { value: "dev", label: "Development" },
  { value: "research", label: "Research" },
];

const prizeFilters: { value: string; label: string; min: number }[] = [
  { value: "any", label: "Any Prize", min: 0 },
  { value: "1k", label: "$1K+", min: 1000 },
  { value: "10k", label: "$10K+", min: 10000 },
  { value: "100k", label: "$100K+", min: 100000 },
  { value: "1m", label: "$1M+", min: 1000000 },
];

export interface ExploreClientProps {
  initialSearch?: string;
  initialCategory?: string;
}

export function ExploreClient({
  initialSearch = "",
  initialCategory = "all",
}: ExploreClientProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(
    initialCategory && categoryFilters.some((f) => f.value === initialCategory)
      ? initialCategory
      : "all"
  );
  const [prizeFilter, setPrizeFilter] = useState("any");
  const [sortBy, setSortBy] = useState("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredContests = useMemo(() => {
    let results = [...MOCK_CONTESTS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.organizer.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      results = results.filter((c) => c.phase === statusFilter);
    }

    if (categoryFilter !== "all") {
      results = results.filter((c) => c.category === categoryFilter);
    }

    if (prizeFilter !== "any") {
      const min = prizeFilters.find((p) => p.value === prizeFilter)?.min ?? 0;
      results = results.filter((c) => c.prizeAmount >= min);
    }

    switch (sortBy) {
      case "ending":
        results.sort((a, b) => {
          if (a.daysRemaining === 0) return 1;
          if (b.daysRemaining === 0) return -1;
          return a.daysRemaining - b.daysRemaining;
        });
        break;
      case "prize":
        results.sort((a, b) => b.prizeAmount - a.prizeAmount);
        break;
      case "popular":
        results.sort((a, b) => b.submissionsCount - a.submissionsCount);
        break;
      default:
        results.sort((a, b) => b.daysRemaining - a.daysRemaining);
    }

    return results;
  }, [searchQuery, statusFilter, categoryFilter, prizeFilter, sortBy]);

  const hasActiveFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    prizeFilter !== "any" ||
    searchQuery !== "";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPrizeFilter("any");
    setSortBy("recent");
  };

  const pageTitle = searchQuery
    ? `Search results for "${searchQuery}"`
    : categoryFilter !== "all"
      ? `${CATEGORY_LABELS[categoryFilter as keyof typeof CATEGORY_LABELS]} contests`
      : "Explore Contests";

  const pageDescription =
    searchQuery || categoryFilter !== "all"
      ? `${filteredContests.length} contest${filteredContests.length !== 1 ? "s" : ""} found`
      : "Discover contests, submit your best work, and earn rewards.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-text-primary font-display">
          {pageTitle}
        </h1>
        <p className="mt-2 text-text-secondary">{pageDescription}</p>
      </motion.div>

      <motion.div
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            placeholder="Search contests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-(--input-height) w-full rounded-xl border border-border-subtle bg-bg-secondary pl-10 pr-4 text-sm text-text-primary",
              "placeholder:text-text-disabled",
              "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              "inline-flex h-(--input-height) items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors sm:hidden",
              filtersOpen
                ? "border-primary-500 bg-primary-500/10 text-primary-400"
                : "border-border-subtle bg-bg-secondary text-text-secondary hover:border-border-medium"
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] text-white">
                !
              </span>
            )}
          </button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="ending">Ending Soonest</SelectItem>
            <SelectItem value="prize">Highest Prize</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </Select>
        </div>
      </motion.div>

      <div className="flex gap-8">
        <motion.aside
          className={cn(
            "w-56 shrink-0 space-y-6",
            "hidden lg:block",
            filtersOpen &&
              "block! fixed inset-0 z-40 bg-bg-primary p-6 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0"
          )}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {filtersOpen && (
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
              <button onClick={() => setFiltersOpen(false)}>
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
          )}

          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-disabled">
              Status
            </h3>
            <div className="space-y-1">
              {statusFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    statusFilter === f.value
                      ? "bg-primary-500/10 font-medium text-primary-400"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-disabled">
              Category
            </h3>
            <div className="space-y-1">
              {categoryFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCategoryFilter(f.value)}
                  className={cn(
                    "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors",
                    categoryFilter === f.value
                      ? "bg-primary-500/10 font-medium text-primary-400"
                      : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-text-disabled">
              Prize Pool
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {prizeFilters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setPrizeFilter(f.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    prizeFilter === f.value
                      ? "border-primary-500 bg-primary-500/15 text-primary-300"
                      : "border-border-subtle text-text-tertiary hover:border-border-medium hover:text-text-secondary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="w-full">
              Reset Filters
            </Button>
          )}
        </motion.aside>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-text-tertiary">
              <span className="font-medium text-text-primary">
                {filteredContests.length}
              </span>{" "}
              contests found
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="hidden text-xs text-primary-400 hover:underline lg:inline"
              >
                Clear all filters
              </button>
            )}
          </div>

          {filteredContests.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredContests.map((contest, i) => (
                <motion.div
                  key={contest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <ContestCard contest={contest} />
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Inbox className="h-12 w-12" />}
              title="No contests found"
              description="Try adjusting your filters or search query"
              action={
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
