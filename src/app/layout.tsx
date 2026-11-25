import type { Metadata } from "next";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "./globals.css";
import { loadRegistry } from "@/server/registry";
import { buildTreeDto } from "@/server/registry/build";
import { resolveModuleStatus } from "@/server/content/lessons";
import { AppShell } from "@/ui/components/AppShell";

export const metadata: Metadata = {
  title: {
    default: "PATLAS — Probabilistic Atlas",
    template: "%s · PATLAS",
  },
  description:
    "A visual-first atlas of probabilistic models: an explorable taxonomy, reproducible mathematics and runnable reference code.",
  applicationName: "PATLAS",
};

const THEME_SCRIPT = `(function(){try{var stored=localStorage.getItem("patlas-theme");var theme=(stored==="light"||stored==="dark")?stored:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(error){document.documentElement.dataset.theme="light";}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const registry = await loadRegistry();
  const tree = buildTreeDto(registry, resolveModuleStatus);

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script id="patlas-theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        <AppShell tree={tree}>{children}</AppShell>
      </body>
    </html>
  );
}
