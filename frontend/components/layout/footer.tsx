"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Instagram, Linkedin } from "lucide-react";

type IconProps = {
  className?: string;
};

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2H21l-6.02 6.88L22 22h-5.49l-4.3-7.95L5.26 22H2.5l6.44-7.36L2 2h5.63l3.88 7.3zm-.97 18h1.53L6.8 3.88H5.16z" />
    </svg>
  );
}

function BlueskyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6.335 4.697c2.153 1.618 4.47 4.897 5.665 7.37 1.194-2.473 3.511-5.752 5.665-7.37 1.553-1.166 4.07-2.068 4.07.804 0 .573-.329 4.813-.522 5.502-.67 2.392-3.111 3.001-5.283 2.631 3.797.647 4.763 2.79 2.677 4.933-3.961 4.068-5.69-1.02-6.133-2.324-.081-.237-.119-.348-.139-.348s-.058.111-.139.348c-.443 1.304-2.172 6.392-6.133 2.324-2.086-2.143-1.12-4.286 2.677-4.933-2.172.37-4.613-.239-5.283-2.631-.193-.689-.522-4.929-.522-5.502 0-2.872 2.517-1.97 4.07-.804Z" />
    </svg>
  );
}

const footerLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/feed/rss.xml", label: "RSS" },
  { href: "/llms.txt", label: "llms.txt" },
] as const;

const socialLinks = [
  {
    href: "https://github.com/nowbind",
    label: "GitHub",
    Icon: Github,
  },
  {
    href: "https://www.instagram.com/nowbind",
    label: "Instagram",
    Icon: Instagram,
  },
  {
    href: "https://www.linkedin.com/company/nowbind",
    label: "LinkedIn",
    Icon: Linkedin,
  },
  {
    href: "https://x.com/nowbind",
    label: "X",
    Icon: XIcon,
  },
  {
    href: "https://bsky.app/profile/nowbind.com",
    label: "Bluesky",
    Icon: BlueskyIcon,
  },
] as const;

const hiddenPrefixes = [
  "/post/",
  "/feed",
  "/dashboard",
  "/editor",
  "/api-keys",
  "/settings",
  "/stats",
  "/profile",
  "/reading-list",
  "/liked",
  "/notifications",
  "/import",
  "/login",
  "/callback",
] as const;

export function Footer() {
  const pathname = usePathname();

  if (
    pathname &&
    hiddenPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix)
    )
  ) {
    return null;
  }

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
        <div className="flex flex-col gap-4 text-center md:flex-row md:items-end md:justify-between md:text-left">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} NowBind
            </p>
            <p className="text-xs text-muted-foreground/70">
              Every post is human-readable and AI-agent-consumable.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  title={link.label}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <link.Icon className="h-4 w-4" />
                  <span className="sr-only">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
