"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input, Textarea, Checkbox, Card } from "@/components/ui";
import type { Contest } from "@/lib/mock-data";

const schema = z.object({
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
  acceptRules: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the contest rules" }),
});

type FormData = z.infer<typeof schema>;

interface SubmitEntryFormProps {
  contest: Contest;
}

export function SubmitEntryForm({ contest }: SubmitEntryFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const {
    register,
    handleSubmit,
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

  const acceptRules = watch("acceptRules");

  const onSubmit = async (data: FormData) => {
    setStatus("submitting");
    setErrorMessage("");
    try {
      // Mock submit: simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // In a real app: await api.submitEntry(contest.id, data);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card padding="lg" className="space-y-6">
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
          charCount={watch("description")?.length ?? 0}
          error={errors.description?.message}
          {...register("description")}
        />
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
          <Button type="submit" loading={status === "submitting"} disabled={status === "submitting"}>
            Submit entry
          </Button>
          <Button variant="ghost" type="button" asChild>
            <Link href={`/contest/${contest.id}`}>Cancel</Link>
          </Button>
        </div>
      </Card>
    </form>
  );
}
