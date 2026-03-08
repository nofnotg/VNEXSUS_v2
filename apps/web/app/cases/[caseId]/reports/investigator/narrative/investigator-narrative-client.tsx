"use client";

import React from "react";
import { useEffect, useState } from "react";
import type { InvestigatorNarrativeJson } from "@vnexus/shared";
import { getInvestigatorNarrative, NarrativeApiError } from "../../../../../../lib/client/narrative-api";
import { useLocale, useLocaleMessages } from "../../../../../../components/locale-provider";

type SessionResponse = {
  success: boolean;
  data?: {
    user?: {
      role?: string;
    };
  };
  error?: {
    code?: string;
    message?: string;
  };
};

type Props = {
  caseId: string;
};

async function getCurrentUserRole() {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });

  const json = (await response.json().catch(() => null)) as SessionResponse | null;

  if (!response.ok) {
    throw new NarrativeApiError(json?.error?.message ?? "Failed to verify session", response.status, json?.error?.code);
  }

  return json?.data?.user?.role ?? null;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ border: "1px dashed var(--border)", borderRadius: "16px", padding: "20px", color: "var(--muted)" }}>
      {message}
    </div>
  );
}

export function InvestigatorNarrativeClient({ caseId }: Props) {
  const { locale } = useLocale();
  const localeMessages = useLocaleMessages();
  const [narrative, setNarrative] = useState<InvestigatorNarrativeJson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const role = await getCurrentUserRole();
        if (role !== "investigator") {
          throw new NarrativeApiError("403 | Investigator role is required", 403, "FORBIDDEN");
        }

        const nextNarrative = await getInvestigatorNarrative(caseId, locale);
        if (!cancelled) {
          setNarrative(nextNarrative);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load investigator narrative");
          setNarrative(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [caseId, locale]);

  if (isLoading) {
    return <EmptyState message={localeMessages.uiLoadingInvestigatorNarrative} />;
  }

  if (error) {
    return <EmptyState message={error} />;
  }

  if (!narrative || narrative.sections.length === 0) {
    return <EmptyState message={localeMessages.uiNoInvestigatorNarrative} />;
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {narrative.sections.map((section) => (
        <article key={section.heading} style={{ border: "1px solid var(--border)", borderRadius: "20px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>{section.heading}</h2>
            <span style={{ color: section.requiresReview ? "#9a3412" : "var(--muted)" }}>
              {section.requiresReview ? localeMessages.uiManualReviewRequired : localeMessages.uiReviewed}
            </span>
          </div>
          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            {section.paragraphs.length > 0 ? (
              section.paragraphs.map((paragraph) => <p key={paragraph} style={{ margin: 0 }}>{paragraph}</p>)
            ) : (
              <p style={{ margin: 0, color: "var(--muted)" }}>{localeMessages.pdfNoParagraphs}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
