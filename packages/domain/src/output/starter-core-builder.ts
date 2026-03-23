import {
  starterCoreResultSchema,
  type EventBundleResponseContract,
  type StarterCoreEventType,
  type StarterCoreResult
} from "@vnexus/shared";

type StarterSourceDocument = {
  id: string;
  originalFileName: string;
  fileOrder: number;
  pageCount: number;
};

type BuildStarterCoreResultParams = {
  caseId: string;
  insuranceJoinDate?: string | null;
  sourceDocuments: StarterSourceDocument[];
  bundles: EventBundleResponseContract[];
  analysisTimestamp?: string;
};

const MANDATORY_WARNINGS = [
  "This app does not provide a final medical diagnosis.",
  "This app does not determine claim approval or denial.",
  "Source quality or missing documents can affect the analysis result."
];

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))];
}

function mapStarterEventType(bundle: EventBundleResponseContract): StarterCoreEventType {
  if (bundle.representativeSurgery || bundle.bundleTypeCandidate === "surgery") {
    return "surgery";
  }

  if (
    bundle.admissionStatus ||
    bundle.bundleTypeCandidate === "admission" ||
    bundle.bundleTypeCandidate === "discharge"
  ) {
    return "admission";
  }

  if (bundle.bundleTypeCandidate === "pathology") {
    return "pathology";
  }

  if (bundle.bundleTypeCandidate === "exam") {
    return "exam";
  }

  if (bundle.bundleTypeCandidate === "treatment") {
    return "treatment";
  }

  if (bundle.bundleTypeCandidate === "procedure") {
    return "procedure";
  }

  if (bundle.bundleTypeCandidate === "outpatient") {
    return "outpatient";
  }

  return "unknown";
}

function buildTimelineSummary(bundle: EventBundleResponseContract) {
  const parts = [
    bundle.representativeDiagnosis,
    bundle.representativeTest,
    bundle.representativeTreatment,
    bundle.representativeProcedure,
    bundle.representativeSurgery,
    bundle.admissionStatus ? `Admission status: ${bundle.admissionStatus}` : null,
    bundle.candidateSnapshotJson.pathologies[0] ?? null
  ].filter((value): value is string => Boolean(value?.trim()));

  return parts.join(" / ") || "Medical event requires source review.";
}

function buildSourceQualityWarnings(bundles: EventBundleResponseContract[], sourceDocuments: StarterSourceDocument[]) {
  const warnings: string[] = [];

  if (sourceDocuments.length === 0) {
    warnings.push("No source documents are attached to this case yet.");
  }

  if (bundles.length === 0) {
    warnings.push("No medical event timeline could be assembled from the current source set.");
  }

  if (bundles.some((bundle) => bundle.requiresReview)) {
    warnings.push("Some medical events require manual review because evidence is weak or unresolved.");
  }

  if (
    bundles.some(
      (bundle) =>
        bundle.bundleTypeCandidate === "mixed" ||
        bundle.bundleTypeCandidate === "unknown" ||
        bundle.unresolvedBundleSlotsJson.weakGrouping
    )
  ) {
    warnings.push("Part of the timeline includes mixed or weakly grouped evidence that should be checked against the original document.");
  }

  return warnings;
}

function deriveOverallConfidence(bundles: EventBundleResponseContract[]) {
  if (bundles.length === 0) {
    return "low" as const;
  }

  const reviewNeededCount = bundles.filter((bundle) => bundle.requiresReview).length;
  const averageAmbiguity =
    bundles.reduce((sum, bundle) => sum + bundle.ambiguityScore, 0) / bundles.length;

  if (reviewNeededCount === 0 && averageAmbiguity < 0.3) {
    return "high" as const;
  }

  if (reviewNeededCount / bundles.length <= 0.5 && averageAmbiguity < 0.65) {
    return "medium" as const;
  }

  return "low" as const;
}

export function buildStarterCoreResult({
  caseId,
  insuranceJoinDate,
  sourceDocuments,
  bundles,
  analysisTimestamp = new Date().toISOString()
}: BuildStarterCoreResultParams): StarterCoreResult {
  const sortedBundles = [...bundles].sort((a, b) => {
    if (a.canonicalDate !== b.canonicalDate) return a.canonicalDate.localeCompare(b.canonicalDate);
    if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
    return a.pageOrder - b.pageOrder;
  });

  const hospitalsMentioned = unique([
    ...sourceDocuments.map((document) => document.originalFileName.match(/([A-Za-z0-9가-힣]+병원|[A-Za-z0-9가-힣]+의원)/)?.[0] ?? null),
    ...sortedBundles.map((bundle) => bundle.primaryHospital),
    ...sortedBundles.flatMap((bundle) => bundle.candidateSnapshotJson.hospitals)
  ]);

  const sourceQualityWarnings = buildSourceQualityWarnings(sortedBundles, sourceDocuments);
  const unresolvedCount = sortedBundles.filter(
    (bundle) => bundle.unresolvedBundleSlotsJson.needsManualReview || bundle.unresolvedBundleSlotsJson.notes.length > 0
  ).length;

  return starterCoreResultSchema.parse({
    caseBasicInfo: {
      caseId,
      insuranceJoinDateAvailable: Boolean(insuranceJoinDate),
      analysisTimestamp,
      activeTier: "starter"
    },
    documentInventorySummary: {
      totalDocuments: sourceDocuments.length,
      totalPages: sourceDocuments.reduce((sum, document) => sum + document.pageCount, 0),
      hospitalsMentioned,
      ...(sortedBundles.length > 0
        ? {
            dateRange: {
              earliestEventDate: sortedBundles[0]?.canonicalDate,
              latestEventDate: sortedBundles.at(-1)?.canonicalDate
            }
          }
        : {}),
      sourceQualityNotices: sourceQualityWarnings
    },
    medicalEventTimeline: sortedBundles.map((bundle) => ({
      eventBundleId: bundle.id,
      canonicalDate: bundle.canonicalDate,
      hospital: bundle.primaryHospital ?? null,
      eventType: mapStarterEventType(bundle),
      shortSummary: buildTimelineSummary(bundle),
      reviewNeeded: bundle.requiresReview,
      representativeEvidenceEntryPoint: {
        entryType: "event_bundle",
        eventBundleId: bundle.id,
        fileOrder: bundle.fileOrder,
        pageOrder: bundle.pageOrder
      }
    })),
    warningSummary: {
      overallConfidence: deriveOverallConfidence(sortedBundles),
      reviewNeededCount: sortedBundles.filter((bundle) => bundle.requiresReview).length,
      unresolvedCount,
      sourceQualityWarnings,
      mandatoryWarnings: MANDATORY_WARNINGS
    }
  });
}
