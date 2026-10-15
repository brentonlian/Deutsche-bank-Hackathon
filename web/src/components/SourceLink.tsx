"use client";

import { ExternalLink } from "lucide-react";
import { useApp } from "./AppState";

/** "Source ↗ · verified <date>" link to the official page behind a fact or product. */
export function SourceLink({ href, date, label, className = "" }: { href?: string; date?: string; label?: string; className?: string }) {
  const { t } = useApp();
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 text-sm text-ink-2 underline hover:text-ink ${className}`}>
      {label ? `${label}: ` : ""}
      {t("game.source")} <ExternalLink aria-hidden="true" size={13} />
      {date && <span> · {t("game.verified", { date })}</span>}
    </a>
  );
}
