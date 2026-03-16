"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Progress,
  Spinner,
  Separator,
  Avatar,
  AvatarStack,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  EmptyState,
} from "@/components/ui";
import { TooltipProvider, Tooltip } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [radioValue, setRadioValue] = useState("creator");
  const [checked, setChecked] = useState(false);
  const [textValue, setTextValue] = useState("");

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-text-primary font-display mb-2">
            Ranqly Component Library
          </h1>
          <p className="text-text-secondary text-lg">
            Phase 1 — Core UI components built on Radix UI + Tailwind CSS. Custom icons (Spec §3) and animation tokens (Spec §4).
          </p>
        </div>

        {/* Custom Icons — Spec §3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Custom Icons
          </h2>
          <p className="text-text-secondary mb-4">
            Stroke 2px, round cap/join, currentColor. Sizes: xs (16px), sm (20px), md (24px), lg (32px), xl (48px), 2xl (64px).
          </p>
          <div className="mb-6 flex flex-wrap items-center gap-6">
            {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Icon name="trophy" size={s} className="text-primary-400" />
                <span className="text-xs text-text-tertiary">{s}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
            {(["home", "search", "dashboard", "trophy", "fire", "clock", "voting-pass", "contest", "judge", "leaderboard", "shield", "wallet", "arrow-right", "check", "close"] as IconName[]).map((name) => (
              <div key={name} className="flex flex-col items-center gap-1 rounded-lg border border-border-subtle bg-bg-tertiary p-3">
                <Icon name={name} size="md" className="text-text-primary" />
                <span className="text-[10px] text-text-tertiary truncate w-full text-center">{name}</span>
              </div>
            ))}
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Buttons
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="success">Success</Button>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button loading>Loading...</Button>
            <Button disabled>Disabled</Button>
            <Button variant="primary">
              <Icon name="log-in" size="sm" />
              Sign in
            </Button>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Inputs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Inputs
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="name"
              label="Display Name"
              placeholder="Enter your name..."
              hint="This will be shown publicly"
            />
            <Input
              id="email"
              label="Email Address"
              placeholder="you@example.com"
              error="Please enter a valid email"
            />
            <Input
              id="url"
              label="Content URL"
              placeholder="https://..."
              type="url"
            />
            <Input
              id="disabled"
              label="Disabled Input"
              placeholder="Can't edit this"
              disabled
            />
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Textarea */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Textarea
          </h2>
          <div className="max-w-lg">
            <Textarea
              id="description"
              label="Description"
              placeholder="Tell us about your work..."
              maxLength={500}
              charCount={textValue.length}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              hint="Optional but recommended"
            />
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Select */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Select
          </h2>
          <div className="max-w-xs">
            <Select label="Category" placeholder="Choose a category...">
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="thread">Thread</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="tutorial">Tutorial</SelectItem>
              <SelectItem value="design">Design</SelectItem>
            </Select>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Checkbox & Radio */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Checkbox & Radio
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              <Checkbox
                id="original"
                label="This is my original work"
                description="I confirm I created this content"
                checked={checked}
                onCheckedChange={(c) => setChecked(c as boolean)}
              />
              <Checkbox
                id="rules"
                label="I've read the contest rules"
                checked={true}
                onCheckedChange={() => {}}
              />
              <Checkbox
                id="disabled"
                label="Disabled checkbox"
                disabled
              />
            </div>
            <RadioGroup
              label="What brings you to Ranqly?"
              value={radioValue}
              onValueChange={setRadioValue}
            >
              <RadioGroupItem
                value="creator"
                label="I'm a Creator"
                description="Earn through contests"
              />
              <RadioGroupItem
                value="organizer"
                label="I'm an Organizer"
                description="Launch contests"
              />
              <RadioGroupItem
                value="exploring"
                label="Just exploring"
              />
            </RadioGroup>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Badges
          </h2>
          <div className="flex flex-wrap gap-3 mb-4">
            <Badge>Default</Badge>
            <Badge variant="primary">Active</Badge>
            <Badge variant="success" dot>Completed</Badge>
            <Badge variant="warning" dot>Pending</Badge>
            <Badge variant="error" dot>Disqualified</Badge>
            <Badge variant="info">Phase D</Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="hot" size="sm">
              <Icon name="fire" size="xs" /> HOT
            </Badge>
            <Badge variant="warning" size="sm">
              <Icon name="clock" size="xs" /> ENDING SOON
            </Badge>
            <Badge variant="primary" size="lg">Content</Badge>
            <Badge variant="success" size="lg">
              <Icon name="trophy" size="sm" /> Winner
            </Badge>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Cards
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>A simple card with default padding and styling.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-tertiary">Card content goes here.</p>
              </CardContent>
            </Card>

            <Card hoverable>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Hoverable Card</CardTitle>
                  <Badge variant="primary" size="sm">Active</Badge>
                </div>
                <CardDescription>Hover for glow effect and lift animation.</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={67} showValue label="245 Submissions" />
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="ml-auto">
                  View Contest →
                </Button>
              </CardFooter>
            </Card>

            <Card padding="lg" className="bg-bg-tertiary">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20">
                  <Icon name="star" size="lg" className="text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">$2M USDC</p>
                  <p className="text-xs text-text-tertiary">Prize Pool</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary">
                Top 100 creators • Arithmetic split
              </p>
            </Card>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Progress */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Progress
          </h2>
          <div className="space-y-4 max-w-lg">
            <Progress value={75} showValue label="Contest Progress" />
            <Progress value={45} variant="success" showValue label="Voting" size="lg" />
            <Progress value={90} variant="warning" showValue label="Deadline" size="sm" />
            <Progress value={20} variant="error" showValue label="Disputed" />
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Tabs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Tabs
          </h2>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card>
                <p className="text-sm text-text-secondary">
                  This is the overview tab content. It shows the contest description, requirements, and judging criteria.
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="leaderboard">
              <Card>
                <p className="text-sm text-text-secondary">
                  Leaderboard content with rankings will appear here.
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="submissions">
              <Card>
                <p className="text-sm text-text-secondary">
                  Grid of all submissions will appear here.
                </p>
              </Card>
            </TabsContent>
            <TabsContent value="rules">
              <Card>
                <p className="text-sm text-text-secondary">
                  Full contest rules document will appear here.
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <Separator className="mb-12" />

        {/* Avatars */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Avatars
          </h2>
          <div className="flex items-center gap-6 mb-4">
            <Avatar size="sm" alt="Alice" />
            <Avatar size="md" alt="Bob Smith" />
            <Avatar size="lg" alt="Carol" />
            <Avatar size="xl" fallback="R" />
          </div>
          <div>
            <p className="text-xs text-text-tertiary mb-2">Avatar Stack (Social Proof)</p>
            <AvatarStack
              avatars={[
                { alt: "Alice" },
                { alt: "Bob" },
                { alt: "Carol" },
                { alt: "Dave" },
                { alt: "Eve" },
                { alt: "Frank" },
                { alt: "Grace" },
              ]}
              max={5}
            />
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Spinners */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Spinners
          </h2>
          <div className="flex items-center gap-8">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" label="Loading..." />
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Tooltip */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Tooltips
          </h2>
          <div className="flex gap-4">
            <Tooltip content="View contest details">
              <Button variant="secondary" size="sm">Hover me</Button>
            </Tooltip>
            <Tooltip content="Your current rank in the leaderboard" side="right">
              <Badge variant="primary">Rank #23</Badge>
            </Tooltip>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Modal */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Modal
          </h2>
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal open={modalOpen} onOpenChange={setModalOpen}>
            <ModalHeader>
              <ModalTitle>Connect Your Wallet</ModalTitle>
              <ModalDescription>Choose your preferred wallet</ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-2">
                {["MetaMask", "Rainbow", "Coinbase Wallet", "WalletConnect"].map(
                  (wallet) => (
                    <button
                      key={wallet}
                      className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3 text-sm font-medium text-text-primary transition-all hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-md"
                    >
                      <div className="h-6 w-6 rounded-md bg-bg-elevated" />
                      {wallet}
                    </button>
                  )
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <p className="text-xs text-text-tertiary">
                New to crypto?{" "}
                <a href="#" className="text-primary-400 hover:underline">
                  Learn More
                </a>
              </p>
            </ModalFooter>
          </Modal>
        </section>

        <Separator className="mb-12" />

        {/* Empty State */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text-primary mb-6 font-display">
            Empty State
          </h2>
          <EmptyState
            icon={<Icon name="contest" size="xl" className="text-text-tertiary" />}
            title="No contests found"
            description="Try adjusting your filters or explore different categories"
            action={
              <Button variant="secondary" size="sm">
                <Icon name="search" size="sm" />
                Reset Filters
              </Button>
            }
          />
        </section>
      </div>
    </TooltipProvider>
  );
}
