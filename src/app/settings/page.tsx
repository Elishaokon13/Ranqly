"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Eye,
  ShieldCheck,
  Wallet,
  Twitter,
  Github,
  BookOpen,
  Smartphone,
  Laptop,
  Tablet,
  Trash2,
  Download,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Avatar,
  Card,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Checkbox,
  Separator,
} from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { cn } from "@/lib/utils";

const sessions = [
  { device: "MacBook Pro", icon: Laptop, location: "SF, CA", lastActive: "Just now", current: true },
  { device: "iPhone 13", icon: Smartphone, location: "SF, CA", lastActive: "2h ago", current: false },
  { device: "iPad", icon: Tablet, location: "LA, CA", lastActive: "3d ago", current: false },
];

export default function SettingsPage() {
  return (
    <RequireAuth>
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-text-primary font-display mb-8">
          Account Settings
        </h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="h-3.5 w-3.5" /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="h-3.5 w-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Privacy
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card padding="lg" className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Profile Information
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar size="lg" fallback="AC" />
                  <div>
                    <Button variant="secondary" size="sm">Change Avatar</Button>
                    <p className="mt-1 text-xs text-text-disabled">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Input id="s-name" label="Display Name" placeholder="Your name" defaultValue="Alex Chen" />
                  <Textarea id="s-bio" label="Bio" placeholder="About you..." maxLength={150} charCount={42} defaultValue="Web3 creator and DeFi enthusiast. Building the future." />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Connected Wallets
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-4 w-4 text-primary-400" />
                      <div>
                        <p className="font-mono text-sm text-text-primary">0x1234...5678</p>
                        <p className="text-xs text-text-tertiary">Primary wallet</p>
                      </div>
                    </div>
                    <Badge variant="primary" size="sm">Primary</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-3">
                  + Add Another Wallet
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Connected Social Accounts
                </h3>
                <div className="space-y-2">
                  {[
                    { icon: Twitter, name: "Twitter", handle: "@alexchen", connected: true },
                    { icon: Github, name: "GitHub", handle: "alexchen", connected: true },
                    { icon: BookOpen, name: "Medium", handle: null, connected: false },
                  ].map((social) => (
                    <div key={social.name} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
                      <div className="flex items-center gap-3">
                        <social.icon className={cn("h-4 w-4", social.connected ? "text-success" : "text-text-disabled")} />
                        <div>
                          <p className="text-sm text-text-primary">{social.name}</p>
                          {social.handle && <p className="text-xs text-text-tertiary">{social.handle}</p>}
                        </div>
                      </div>
                      <Button variant={social.connected ? "ghost" : "secondary"} size="sm">
                        {social.connected ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card padding="lg" className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  <Checkbox id="n-contest" label="Contest updates" description="When contests you entered change phase" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="n-rank" label="Rank changes" description="When your rank moves +/- 5 positions" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="n-comments" label="New comments on my entries" checked={false} onCheckedChange={() => {}} />
                  <Checkbox id="n-voting" label="Voting reminders" description="When voting opens in your contests" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="n-digest" label="Weekly digest" checked={false} onCheckedChange={() => {}} />
                  <Checkbox id="n-marketing" label="Marketing emails" checked={false} onCheckedChange={() => {}} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Push Notifications (Browser)
                </h3>
                <div className="space-y-3">
                  <Checkbox id="p-rank" label="Real-time rank changes" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="p-phase" label="Contest phase transitions" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="p-new" label="New contests matching my interests" checked={false} onCheckedChange={() => {}} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card padding="lg" className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Profile Visibility
                </h3>
                <div className="space-y-3">
                  <Checkbox id="pr-public" label="Public profile" description="Anyone can see your profile" checked={true} onCheckedChange={() => {}} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Show on Profile
                </h3>
                <div className="space-y-3">
                  <Checkbox id="pr-subs" label="My submissions" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="pr-history" label="Contest history" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="pr-earnings" label="Earnings" checked={false} onCheckedChange={() => {}} />
                  <Checkbox id="pr-winrate" label="Win rate" checked={true} onCheckedChange={() => {}} />
                  <Checkbox id="pr-votes" label="Votes cast" checked={false} onCheckedChange={() => {}} />
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Data Sharing
                </h3>
                <div className="space-y-3">
                  <Checkbox id="pr-research" label="Share anonymized data for research" checked={false} onCheckedChange={() => {}} />
                  <Checkbox id="pr-contact" label="Allow organizers to contact me" checked={false} onCheckedChange={() => {}} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Privacy Settings</Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card padding="lg" className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-success" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">2FA Enabled</p>
                      <p className="text-xs text-text-tertiary">via Authenticator App</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary" size="sm">Regenerate Backup Codes</Button>
                  <Button variant="ghost" size="sm">Disable 2FA</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4">
                  Active Sessions
                </h3>
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.device} className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
                      <div className="flex items-center gap-3">
                        <session.icon className="h-4 w-4 text-text-tertiary" />
                        <div>
                          <p className="text-sm text-text-primary">{session.device}</p>
                          <p className="text-xs text-text-tertiary">{session.location} · {session.lastActive}</p>
                        </div>
                      </div>
                      {session.current ? (
                        <Badge variant="primary" size="sm">Current</Badge>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <LogOut className="h-3.5 w-3.5" /> Logout
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-3">
                  <LogOut className="h-3.5 w-3.5" /> Logout All Other Sessions
                </Button>
              </div>

              <Separator />

              <div>
                <h3 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-error" />
                  Danger Zone
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-border-subtle bg-bg-tertiary px-4 py-3">
                    <div>
                      <p className="text-sm text-text-primary">Download My Data</p>
                      <p className="text-xs text-text-tertiary">GDPR data export</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-error/30 bg-error/5 px-4 py-3">
                    <div>
                      <p className="text-sm text-text-primary">Delete Account</p>
                      <p className="text-xs text-text-tertiary">Permanently delete your account and data</p>
                    </div>
                    <Button variant="danger" size="sm">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
    </RequireAuth>
  );
}
