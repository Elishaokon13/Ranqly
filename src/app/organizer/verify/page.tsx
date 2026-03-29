"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";

const STEPS = [
  { step: 1, title: "Organization details" },
  { step: 2, title: "Verification documents" },
  { step: 3, title: "Review & submit" },
];

export default function OrganizerVerifyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [orgUrl, setOrgUrl] = useState("");

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
            Organizer verification
          </h1>
          <p className="mt-2 text-text-secondary">
            Verify your organization to create and manage contests.
          </p>
        </motion.div>

        <div className="mb-6 flex items-center gap-2 border-b border-border-subtle pb-4">
          {STEPS.map(({ step, title }) => (
            <div
              key={step}
              className="flex items-center gap-1.5 text-sm"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  currentStep >= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-bg-tertiary text-text-tertiary"
                }`}
              >
                {step}
              </span>
              <span className="hidden sm:inline text-text-secondary">{title}</span>
              {step < 3 && <span className="ml-1 text-border-subtle">/</span>}
            </div>
          ))}
        </div>

        <Card padding="lg">
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <>
                <Input
                  label="Organization name"
                  placeholder="Your org or brand name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
                <Input
                  label="Website or social"
                  placeholder="https://..."
                  value={orgUrl}
                  onChange={(e) => setOrgUrl(e.target.value)}
                />
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => setCurrentStep(2)}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Cancel</Link>
                  </Button>
                </div>
              </>
            )}
            {currentStep === 2 && (
              <>
                <div>
                  <h3 className="font-display font-semibold text-text-primary">Verification documents</h3>
                  <p className="mt-1 text-sm text-text-tertiary">
                    Upload proof of your organization (e.g. incorporation doc, domain ownership, or official letterhead).
                  </p>
                </div>
                <div
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-subtle bg-bg-tertiary/30 p-8 text-center"
                >
                  <p className="text-sm font-medium text-text-primary">Drag files here or click to upload</p>
                  <p className="mt-1 text-xs text-text-tertiary">PDF, JPG, PNG up to 10MB each</p>
                  <Button variant="secondary" size="sm" className="mt-4">Choose files</Button>
                </div>
                <ul className="space-y-2 text-sm text-text-tertiary">
                  <li>• Certificate of incorporation or equivalent</li>
                  <li>• Proof of domain / brand ownership (optional)</li>
                </ul>
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
                <p className="text-sm text-text-secondary">
                  Review your application. Submitting will send it for review.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setCurrentStep(2)}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back
                  </Button>
                  <Button>Submit for verification</Button>
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Cancel</Link>
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
