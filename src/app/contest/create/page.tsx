"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button, Card, CardContent, Input, Textarea } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";

const WIZARD_STEPS = [
  { step: 1, title: "Basics" },
  { step: 2, title: "Prize & distribution" },
  { step: 3, title: "Timeline" },
  { step: 4, title: "Scoring" },
  { step: 5, title: "Judges & rules" },
];

export default function CreateContestPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <RequireAuth>
      <div className="mx-auto max-w-content px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Create contest
          </h1>
          <p className="mt-2 text-text-secondary">
            Set up your contest in a few steps.
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
          {WIZARD_STEPS.map(({ step, title: t }) => (
            <div key={step} className="flex items-center gap-1.5 text-sm">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-bg-tertiary text-text-tertiary"
                }`}
              >
                {step}
              </span>
              <span className="text-text-secondary">{t}</span>
              {step < 5 && <span className="ml-1 text-border-subtle">/</span>}
            </div>
          ))}
        </div>

        <Card padding="lg">
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <>
                <Input
                  label="Contest title"
                  placeholder="e.g. Best DeFi Tutorial 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Textarea
                  label="Description"
                  placeholder="What is this contest about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                />
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => setCurrentStep(2)}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard/organizer">Cancel</Link>
                  </Button>
                </div>
              </>
            )}
            {currentStep === 2 && (
              <>
                <Input label="Prize pool (total)" type="text" placeholder="e.g. 50000" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Currency" placeholder="USDC" />
                  <Input label="Number of winners" type="number" placeholder="50" />
                </div>
                <div>
                  <label className="text-sm font-medium text-text-primary">Distribution</label>
                  <select className="mt-2 w-full rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 text-sm">
                    <option>Arithmetic (equal steps)</option>
                    <option>Top-heavy</option>
                    <option>Custom</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(1)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setCurrentStep(3)}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
            {currentStep === 3 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Submission start" type="date" />
                  <Input label="Submission end" type="date" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Voting start" type="date" />
                  <Input label="Voting end" type="date" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Judging start" type="date" />
                  <Input label="Finalization deadline" type="date" />
                </div>
                <p className="text-xs text-text-tertiary">Phases will run in order; dates must not overlap incorrectly.</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setCurrentStep(4)}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
            {currentStep === 4 && (
              <>
                <div>
                  <label className="text-sm font-medium text-text-primary">Algorithm weight</label>
                  <input type="range" min="20" max="60" defaultValue="40" className="mt-2 w-full accent-primary-500" />
                  <p className="mt-1 text-xs text-text-tertiary">Default 40% algorithm, 30% community, 30% judges.</p>
                </div>
                <Input label="Custom criteria (optional)" placeholder="e.g. Originality, clarity, depth" />
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(3)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={() => setCurrentStep(5)}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
            {currentStep === 5 && (
              <>
                <div>
                  <label className="text-sm font-medium text-text-primary">Judge emails (one per line)</label>
                  <textarea className="mt-2 w-full rounded-xl border border-border-subtle bg-bg-secondary px-4 py-3 text-sm min-h-[100px]" placeholder="judge1@example.com\njudge2@example.com" />
                </div>
                <Textarea label="Contest rules" placeholder="Eligibility, submission requirements, and any other rules..." maxLength={2000} />
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(4)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button>Create contest</Button>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard/organizer">Cancel</Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-text-tertiary">
          <Link href="/dashboard/organizer" className="text-primary-400 hover:underline">
            Organizer dashboard
          </Link>
        </p>
      </div>
    </RequireAuth>
  );
}
