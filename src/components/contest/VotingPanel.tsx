"use client";

import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Info,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { ContestEntry } from "@/lib/mock-data";

const MAX_UPVOTES = 5;
const MAX_DOWNVOTES = 2;

type VoteValue = "up" | "down" | null;

interface VotingPanelProps {
  contestId: string;
  entries: ContestEntry[];
}

export function VotingPanel({ contestId, entries }: VotingPanelProps) {
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hasPoI, setHasPoI] = useState(false);
  const [poiModalOpen, setPoiModalOpen] = useState(false);
  const [poiMinting, setPoiMinting] = useState(false);

  const upCount = Object.values(votes).filter((v) => v === "up").length;
  const downCount = Object.values(votes).filter((v) => v === "down").length;
  const upRemaining = MAX_UPVOTES - upCount;
  const downRemaining = MAX_DOWNVOTES - downCount;
  const hasVotes = upCount > 0 || downCount > 0;

  const setVote = (entryId: string, newValue: VoteValue) => {
    setVotes((prev) => {
      const current = prev[entryId];
      const next = { ...prev };
      const upCountPrev = Object.values(prev).filter((v) => v === "up").length;
      const downCountPrev = Object.values(prev).filter((v) => v === "down").length;
      const upRemainingPrev = MAX_UPVOTES - upCountPrev;
      const downRemainingPrev = MAX_DOWNVOTES - downCountPrev;

      if (newValue === "up") {
        if (current === "up") {
          next[entryId] = null;
          return next;
        }
        if (current !== "down" && upRemainingPrev <= 0) return prev;
        next[entryId] = "up";
      } else if (newValue === "down") {
        if (current === "down") {
          next[entryId] = null;
          return next;
        }
        if (current !== "up" && downRemainingPrev <= 0) return prev;
        next[entryId] = "down";
      }
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Mock: in real app would submit to chain/API
  };

  const handleMintPoI = async () => {
    setPoiMinting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setHasPoI(true);
    setPoiMinting(false);
    setPoiModalOpen(false);
  };

  if (submitted) {
    return (
      <Card padding="lg">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-display text-xl font-semibold text-text-primary">
            Votes submitted
          </h3>
          <p className="max-w-sm text-sm text-text-secondary">
            Your votes have been recorded. They will be revealed when the voting period ends.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* PoI eligibility banner */}
      {!hasPoI ? (
        <div className="flex flex-col gap-3 rounded-xl border border-primary-500/40 bg-primary-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" />
            <div>
              <p className="text-sm font-medium text-primary-200">
                Voting requires a Proof-of-Impact (PoI) NFT
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Mint a PoI NFT to unlock your 5 upvotes and 2 downvotes for this contest.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setPoiModalOpen(true)} className="shrink-0">
            <Sparkles className="mr-1.5 h-4 w-4" />
            Mint PoI NFT
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          You're eligible to vote. Use your 5 upvotes and 2 downvotes below.
        </div>
      )}

      <Modal open={poiModalOpen} onOpenChange={setPoiModalOpen}>
        <ModalHeader>
          <ModalTitle>Proof-of-Impact (PoI) NFT</ModalTitle>
          <ModalDescription>
            Your PoI NFT proves you're a real community member and unlocks voting in Ranqly contests.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-text-secondary">
            One PoI NFT per wallet. You get <strong className="text-text-primary">5 upvotes</strong> and{" "}
            <strong className="text-text-primary">2 downvotes</strong> per contest. Mint cost is approximately $0.70 (gas + protocol fee).
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setPoiModalOpen(false)}>
            Cancel
          </Button>
          <Button loading={poiMinting} onClick={handleMintPoI}>
            {poiMinting ? "Minting…" : "Mint PoI NFT"}
          </Button>
        </ModalFooter>
      </Modal>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3">
        <p className="text-sm text-text-secondary">
          You have <strong className="text-primary-400">{upRemaining}</strong> upvotes and{" "}
          <strong className="text-text-primary">{downRemaining}</strong> downvotes remaining.
        </p>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!hasVotes}
        >
          Submit my votes
        </Button>
      </div>

      <ul className="space-y-3">
        {entries.map((entry) => {
          const vote = votes[entry.id];
          return (
            <li key={entry.id}>
              <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-text-primary">
                    {entry.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-text-tertiary">
                    {entry.description}
                  </p>
                  <p className="mt-1 text-xs text-text-disabled">{entry.author}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant={vote === "up" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setVote(entry.id, vote === "up" ? null : "up")}
                    disabled={vote !== "up" && upRemaining <= 0}
                    className={cn(
                      vote === "up" && "ring-2 ring-primary-400 ring-offset-2 ring-offset-bg-secondary"
                    )}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Up
                  </Button>
                  <Button
                    variant={vote === "down" ? "danger" : "ghost"}
                    size="sm"
                    onClick={() => setVote(entry.id, vote === "down" ? null : "down")}
                    disabled={vote !== "down" && downRemaining <= 0}
                    className={cn(
                      vote === "down" &&
                        "ring-2 ring-error ring-offset-2 ring-offset-bg-secondary"
                    )}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Down
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={entry.workUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
