import {
  consumerSummaryJsonSchema,
  type ConsumerSummaryJson,
  type ConsumerTimelineItem,
  type EventBundleResponseContract
} from "@vnexus/shared";

function unique(values: string[]) {
  return [...new Set(values)];
}

export function buildConsumerStructuredOutput(
  caseId: string,
  bundles: EventBundleResponseContract[],
  generatedAt = new Date().toISOString()
): ConsumerSummaryJson {
  const sortedBundles = [...bundles].sort((a, b) => {
    if (a.canonicalDate !== b.canonicalDate) return a.canonicalDate.localeCompare(b.canonicalDate);
    if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
    return a.pageOrder - b.pageOrder;
  });

  const timelineSummary: ConsumerTimelineItem[] = sortedBundles.map((bundle) => ({
    canonicalDate: bundle.canonicalDate,
    hospital: bundle.primaryHospital ?? null,
    diagnosis: bundle.representativeDiagnosis ?? null,
    test: bundle.representativeTest ?? null,
    treatment: bundle.representativeTreatment ?? null,
    surgery: bundle.representativeSurgery ?? null,
    admissionStatus: bundle.admissionStatus ?? null,
    reviewFlag: bundle.requiresReview
  }));

  const hospitalSummary = unique(
    sortedBundles
      .map((bundle) => bundle.primaryHospital)
      .filter((hospital): hospital is string => Boolean(hospital))
  );

  const riskSignals = unique(
    sortedBundles.flatMap((bundle) => {
      const signals: string[] = [];
      if (bundle.requiresReview) signals.push("review_required_bundle");
      if (bundle.representativeSurgery || bundle.bundleTypeCandidate === "surgery") signals.push("surgery_bundle_detected");
      if (bundle.admissionStatus) signals.push("admission_or_discharge_bundle_detected");
      if (bundle.bundleTypeCandidate === "mixed" || bundle.bundleTypeCandidate === "unknown") {
        signals.push("mixed_or_unknown_bundle_detected");
      }
      return signals;
    })
  );

  const checkPoints = unique(
    sortedBundles.flatMap((bundle) => {
      const points: ConsumerSummaryJson["checkPoints"] = [];
      if (bundle.requiresReview) points.push("review_required_bundle_exists");
      if (bundle.representativeSurgery || bundle.bundleTypeCandidate === "surgery") points.push("surgery_history_detected");
      if (bundle.admissionStatus) points.push("admission_history_detected");
      if (bundle.bundleTypeCandidate === "mixed" || bundle.bundleTypeCandidate === "unknown") {
        points.push("mixed_bundle_detected");
      }
      return points;
    })
  );

  const recommendedNextActions = unique(
    sortedBundles.flatMap((bundle) => {
      const actions: ConsumerSummaryJson["recommendedNextActions"] = [];
      if (bundle.requiresReview) {
        actions.push("review_original_documents", "manual_review_recommended");
      }
      if (bundle.primaryHospital) {
        actions.push("check_hospital_history");
      }
      if (bundle.representativeSurgery || bundle.bundleTypeCandidate === "surgery") {
        actions.push("check_surgery_records");
      }
      return actions;
    })
  );

  return consumerSummaryJsonSchema.parse({
    caseId,
    generatedAt,
    timelineSummary,
    hospitalSummary,
    riskSignals,
    checkPoints,
    recommendedNextActions,
    requiresReview: sortedBundles.some((bundle) => bundle.requiresReview)
  });
}
