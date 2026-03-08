"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Plus, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Avatar,
  Card,
  Separator,
} from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { cn } from "@/lib/utils";

const SKILL_OPTIONS = [
  "DeFi",
  "NFTs",
  "DAOs",
  "Security",
  "Smart Contracts",
  "Layer 2",
  "Content Writing",
  "Design",
  "Research",
  "Tutorial",
  "Video",
  "Data Analysis",
];

export default function ProfileSetupPage() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [medium, setMedium] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : prev.length < 5
        ? [...prev, skill]
        : prev
    );
  };

  return (
    <RequireAuth>
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-text-primary font-display">
            Set up your profile
          </h1>
          <p className="mt-2 text-text-secondary">
            Tell the community about yourself. You can always edit this later.
          </p>
        </div>

        <Card padding="lg">
          {/* Avatar */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar size="xl" fallback={displayName ? displayName[0].toUpperCase() : "?"} />
              <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-secondary bg-primary-500 text-white transition-colors hover:bg-primary-600">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-text-disabled">Click to upload avatar</p>
          </div>

          <div className="space-y-5">
            {/* Display Name */}
            <Input
              id="display-name"
              label="Display Name *"
              placeholder="Your public name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            {/* Bio */}
            <Textarea
              id="bio"
              label="Bio"
              placeholder="A short description about yourself..."
              maxLength={150}
              charCount={bio.length}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              hint="Max 150 characters"
            />

            {/* Skills Tags */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Skills{" "}
                <span className="font-normal text-text-tertiary">
                  (max 5)
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((skill) => {
                  const isSelected = skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                        isSelected
                          ? "border-primary-500 bg-primary-500/15 text-primary-300"
                          : "border-border-subtle bg-bg-tertiary text-text-tertiary hover:border-border-medium hover:text-text-secondary"
                      )}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Social Links */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-text-primary">
                Social Links
              </h3>
              <div className="space-y-3">
                <Input
                  id="twitter"
                  label="Twitter"
                  placeholder="@yourhandle"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                />
                <Input
                  id="github"
                  label="GitHub"
                  placeholder="yourhandle"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
                <Input
                  id="medium"
                  label="Medium"
                  placeholder="@yourhandle"
                  value={medium}
                  onChange={(e) => setMedium(e.target.value)}
                />
                <Input
                  id="linkedin"
                  label="LinkedIn"
                  placeholder="linkedin.com/in/yourname"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
                <Input
                  id="website"
                  label="Website"
                  placeholder="https://yoursite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Location */}
            <Input
              id="location"
              label="Location"
              placeholder="City, Country (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              hint="Optional"
            />
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Skip for Now</Link>
            </Button>
            <Button>
              Save & Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
    </RequireAuth>
  );
}
