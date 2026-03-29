"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button, Input, Textarea, Checkbox, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Contest } from "@/lib/contest-types";
import { isApiConfigured, getAuthToken, createSubmission } from "@/lib/api";

const schemaStep1 = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  workUrl: z
    .string()
    .min(1, "Link to your work is required")
    .url("Please enter a valid URL"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be at most 500 characters"),
});
const schema = schemaStep1.extend({
  acceptRules: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the contest rules" }),
});

type FormData = z.infer<typeof schema>;

interface SubmitEntryFormProps {
  contest: Contest;
}

const SUBMIT_STEPS = [
  { step: 1, label: "Entry details" },
  { step: 2, label: "Review & confirm" },
  { step: 3, label: "Sign & submit" },
] as const;

export function SubmitEntryForm({ contest }: SubmitEntryFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      workUrl: "",
      description: "",
      acceptRules: false,
    },
  });

  const title = watch("title");
  const workUrl = watch("workUrl");
  const description = watch("description");
  const acceptRules = watch("acceptRules");

  const onStep1Next = async () => {
    const ok = await trigger(["title", "workUrl", "description"]);
    if (ok) setStep(2);
  };

  const onSubmit = async (data: FormData) => {
    setStatus("submitting");
    setErrorMessage("");
    try {
      const contestBackendId = contest.backendId ?? contest.id;
      if (isApiConfigured() && getAuthToken() && contestBackendId) {
        const result = await createSubmission(contestBackendId, {
          title: data.title,
          workUrl: data.workUrl,
          description: data.description,
        });
        if (result) {
          setStatus("success");
          return;
        }
        setErrorMessage("Submission failed. You may need to sign in with a wallet.");
        setStatus("error");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  if (contest.phase !== "submission") {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="text-text-secondary">
            Submissions are closed for this contest. The contest is currently in
            the <strong className="text-text-primary">{contest.phase}</strong> phase.
          </p>
          <Button asChild>
            <Link href={`/contest/${contest.id}`}>Back to contest</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Entry submitted
          </h2>
          <p className="max-w-sm text-sm text-text-secondary">
            Your entry has been submitted. You can edit or withdraw it until the
            submission deadline.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={`/contest/${contest.id}`}>View contest</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/submissions">My submissions</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Step 3: Sign transaction
  if (step === 3 && status === "submitting") {
    return (
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Sign transaction
          </h2>
          <p className="max-w-sm text-sm text-text-secondary">
            Confirm the transaction in your wallet to submit your entry.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-4">
        {SUBMIT_STEPS.map(({ step: s, label }) => (
          <div
            key={s}
            className={cn(
              "flex items-center gap-1.5 text-sm",
              step >= s ? "text-primary" : "text-text-tertiary"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                step >= s ? "bg-primary text-primary-foreground" : "bg-bg-tertiary text-text-tertiary"
              )}
            >
              {s}
            </span>
            <span className="hidden sm:inline">{label}</span>
            {s < 3 && <span className="ml-1 text-border-subtle">/</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStep1Next();
          }}
          className="space-y-6"
        >
          <Input
            label="Entry title"
            placeholder="Give your entry a clear title"
            error={errors.title?.message}
            {...register("title")}
          />
          <Input
            label="Link to your work"
            type="url"
            placeholder="https://..."
            hint="URL to your article, video, design, or repository"
            error={errors.workUrl?.message}
            {...register("workUrl")}
          />
          <Textarea
            label="Description"
            placeholder="Describe your entry and how it meets the contest criteria..."
            maxLength={500}
            charCount={description?.length ?? 0}
            error={errors.description?.message}
            {...register("description")}
          />
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit">Next</Button>
            <Button variant="ghost" type="button" asChild>
              <Link href={`/contest/${contest.id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit((data) => { setStep(3); onSubmit(data); })} className="space-y-6">
          <div className="rounded-xl border border-border-subtle bg-bg-tertiary/50 p-4 space-y-3">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Review your entry</p>
            <p className="text-text-primary font-medium">{title || "—"}</p>
            <p className="text-sm text-text-secondary break-all">{workUrl || "—"}</p>
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{description || "—"}</p>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-tertiary/50 p-4">
            <Checkbox
              id="acceptRules"
              label="I accept the contest rules"
              description="I confirm this is original work, I have read the requirements, and I agree to the contest terms."
              checked={acceptRules}
              onCheckedChange={(checked) => setValue("acceptRules", !!checked)}
            />
            {errors.acceptRules && (
              <p className="mt-2 text-xs text-error" role="alert">
                {errors.acceptRules.message}
              </p>
            )}
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 rounded-xl border border-error/50 bg-error/10 px-4 py-3 text-sm text-error">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {errorMessage}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit" loading={status === "submitting"} disabled={status === "submitting"}>
              Sign & Submit
            </Button>
            <Button variant="ghost" type="button" asChild>
              <Link href={`/contest/${contest.id}`}>Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
