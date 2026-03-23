import {
  starterDiseaseClusterItemSchema,
  type EventBundleResponseContract,
  type StarterDiseaseClusterItem,
  type StarterDiseaseClusterType
} from "@vnexus/shared";

const CLUSTER_TYPES: StarterDiseaseClusterType[] = [
  "cancer",
  "heart",
  "brain_cerebrovascular",
  "surgery",
  "hospitalization",
  "chronic_or_other_important"
];

const CANCER_KEYWORDS = [
  "암",
  "cancer",
  "carcinoma",
  "adenocarcinoma",
  "neoplasm",
  "malign",
  "lymphoma",
  "leukemia",
  "sarcoma",
  "종양"
];

const HEART_KEYWORDS = [
  "심장",
  "심근",
  "협심증",
  "부정맥",
  "심부전",
  "관상동맥",
  "card",
  "coronary",
  "myocard",
  "heart"
];

const BRAIN_KEYWORDS = [
  "뇌",
  "뇌경색",
  "뇌출혈",
  "뇌혈관",
  "stroke",
  "cerebr",
  "brain",
  "infarct",
  "hemorrhage",
  "tia"
];

const CHRONIC_KEYWORDS = [
  "고혈압",
  "당뇨",
  "hypertension",
  "diabetes",
  "asthma",
  "copd",
  "chronic",
  "만성",
  "신장",
  "kidney",
  "간염",
  "liver"
];

function normalizeTerms(bundle: EventBundleResponseContract) {
  return [
    bundle.representativeDiagnosis,
    bundle.representativeTest,
    bundle.representativeTreatment,
    bundle.representativeProcedure,
    bundle.representativeSurgery,
    ...bundle.candidateSnapshotJson.diagnoses,
    ...bundle.candidateSnapshotJson.tests,
    ...bundle.candidateSnapshotJson.treatments,
    ...bundle.candidateSnapshotJson.procedures,
    ...bundle.candidateSnapshotJson.surgeries,
    ...bundle.candidateSnapshotJson.pathologies,
    ...bundle.candidateSnapshotJson.symptoms
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.toLowerCase());
}

function hasKeywordMatch(bundle: EventBundleResponseContract, keywords: string[]) {
  const terms = normalizeTerms(bundle);
  return terms.some((term) => keywords.some((keyword) => term.includes(keyword)));
}

function matchesCluster(clusterType: StarterDiseaseClusterType, bundle: EventBundleResponseContract) {
  if (clusterType === "cancer") {
    return hasKeywordMatch(bundle, CANCER_KEYWORDS);
  }

  if (clusterType === "heart") {
    return hasKeywordMatch(bundle, HEART_KEYWORDS);
  }

  if (clusterType === "brain_cerebrovascular") {
    return hasKeywordMatch(bundle, BRAIN_KEYWORDS);
  }

  if (clusterType === "surgery") {
    return Boolean(bundle.representativeSurgery) || bundle.bundleTypeCandidate === "surgery";
  }

  if (clusterType === "hospitalization") {
    return (
      Boolean(bundle.admissionStatus) ||
      bundle.bundleTypeCandidate === "admission" ||
      bundle.bundleTypeCandidate === "discharge" ||
      bundle.candidateSnapshotJson.admissions.length > 0 ||
      bundle.candidateSnapshotJson.discharges.length > 0
    );
  }

  if (clusterType === "chronic_or_other_important") {
    return hasKeywordMatch(bundle, CHRONIC_KEYWORDS);
  }

  return false;
}

function isReviewOnlyBundle(bundle: EventBundleResponseContract) {
  return (
    bundle.requiresReview ||
    bundle.bundleTypeCandidate === "mixed" ||
    bundle.bundleTypeCandidate === "unknown" ||
    bundle.unresolvedBundleSlotsJson.needsManualReview
  );
}

function buildOverview(
  clusterType: StarterDiseaseClusterType,
  status: StarterDiseaseClusterItem["status"]
) {
  const labels: Record<StarterDiseaseClusterType, string> = {
    cancer: "Cancer-related findings",
    heart: "Heart-related findings",
    brain_cerebrovascular: "Brain or cerebrovascular findings",
    surgery: "Surgery history",
    hospitalization: "Hospitalization history",
    chronic_or_other_important: "Chronic or other important findings"
  };

  const label = labels[clusterType];

  if (status === "present") {
    return `${label} appear in the current case timeline.`;
  }

  if (status === "review_needed") {
    return `${label} may be present, but the current evidence still needs review.`;
  }

  return `No clear ${label.toLowerCase()} were found in the current Starter evidence set.`;
}

export function buildStarterDiseaseClusters(
  bundles: EventBundleResponseContract[]
): StarterDiseaseClusterItem[] {
  return CLUSTER_TYPES.map((clusterType) => {
    const matchedBundles = bundles.filter((bundle) => matchesCluster(clusterType, bundle));
    const supportedBundles = matchedBundles.filter((bundle) => !isReviewOnlyBundle(bundle));
    const reviewBundles = matchedBundles.filter((bundle) => isReviewOnlyBundle(bundle));
    const representativeBundle = supportedBundles[0] ?? reviewBundles[0] ?? null;

    const status: StarterDiseaseClusterItem["status"] =
      supportedBundles.length > 0 ? "present" : reviewBundles.length > 0 ? "review_needed" : "not_found";

    return starterDiseaseClusterItemSchema.parse({
      clusterType,
      status,
      overview: buildOverview(clusterType, status),
      relatedEventIds: matchedBundles.map((bundle) => bundle.id),
      representativeEvidenceEntryPoint: representativeBundle
        ? {
            entryType: "event_bundle",
            eventBundleId: representativeBundle.id,
            fileOrder: representativeBundle.fileOrder,
            pageOrder: representativeBundle.pageOrder
          }
        : null
    });
  });
}
