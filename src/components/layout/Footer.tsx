import Link from "next/link";
import { Twitter, Github, MessageCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { RanqlyLogo } from "./RanqlyLogo";

const footerLinks = {
  product: [
    { href: "/explore", label: "Explore Contests" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/leaderboard", label: "Leaderboard" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/blog", label: "Blog" },
    { href: "/careers", label: "Careers" },
    { href: "/transparency", label: "Transparency" },
  ],
  resources: [
    { href: "/docs", label: "Documentation" },
    { href: "/help", label: "Help Center" },
    { href: "/api", label: "API" },
    { href: "/status", label: "System Status" },
  ],
};

const socialLinks = [
  { href: "https://twitter.com/ranqly", label: "Twitter", icon: Twitter },
  { href: "https://github.com/ranqly", label: "GitHub", icon: Github },
  { href: "https://discord.gg/ranqly", label: "Discord", icon: MessageCircle },
  { href: "https://ranqly.com", label: "Website", icon: Globe },
];

const legalLinks = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-subtle bg-bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Top Section: Logo + Link Columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <RanqlyLogo href="/" size="md" className="text-text-primary" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
              The fair content layer for Web3. Transparent scoring, community
              voting, and expert judging — all verifiable on-chain.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                    "bg-bg-tertiary text-text-tertiary",
                    "transition-colors hover:bg-bg-elevated hover:text-text-primary"
                  )}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary">Product</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-tertiary transition-colors hover:text-text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section: Legal + Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border-subtle pt-8 sm:flex-row">
          <p className="text-xs text-text-disabled">
            &copy; {new Date().getFullYear()} Ranqly. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-text-disabled transition-colors hover:text-text-tertiary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
