"use client";

import { motion } from "framer-motion";
import { User, Bell, Eye, ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ApiSessionGate } from "@/components/auth/ApiSessionGate";
import { SettingsProfilePanel } from "@/components/settings/SettingsProfilePanel";
import {
  SettingsNotificationsPanel,
  SettingsPrivacyPanel,
  SettingsSecurityPanel,
} from "@/components/settings/SettingsPrefsPanels";

export default function SettingsPage() {
  return (
    <RequireAuth>
    <ApiSessionGate>
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold text-text-primary font-display mb-8">
          Account Settings
        </h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6 w-full max-w-full pb-0.5">
            <TabsTrigger value="profile" className="gap-1.5" aria-label="Profile">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5" aria-label="Notifications">
              <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5" aria-label="Privacy">
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5" aria-label="Security">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <SettingsProfilePanel />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <SettingsNotificationsPanel />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <SettingsPrivacyPanel />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <SettingsSecurityPanel />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
    </ApiSessionGate>
    </RequireAuth>
  );
}
