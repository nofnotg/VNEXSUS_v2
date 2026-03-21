import {
  eventBundleSchema,
  unresolvedBundleSlotsSchema,
  type CandidateSummary,
  type EventAtomResponseContract,
  type EventBundleInput,
  type UnresolvedBundleSlots
} from "@vnexus/shared";
import { buildHospitalAliasKey } from "../entities/hospital-normalization";

function uniqueNonNull(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)).map((value) => value.trim()).filter(Boolean))];
}

function chooseRepresentative(values: Array<string | null | undefined>) {
  const uniqueValues = uniqueNonNull(values);

  if (uniqueValues.length === 0) {
    return { value: null, conflicting: false };
  }

  if (uniqueValues.length === 1) {
    return { value: uniqueValues[0] ?? null, conflicting: false };
  }

  return { value: null, conflicting: true };
}

function mergeSummary(atoms: EventAtomResponseContract[]): CandidateSummary {
  return {
    hospitals: uniqueNonNull(atoms.map((atom) => atom.primaryHospital)),
    departments: uniqueNonNull(atoms.map((atom) => atom.primaryDepartment)),
    diagnoses: uniqueNonNull(atoms.map((atom) => atom.primaryDiagnosis)),
    tests: uniqueNonNull(atoms.map((atom) => atom.primaryTest)),
    treatments: uniqueNonNull(atoms.map((atom) => atom.primaryTreatment)),
    procedures: uniqueNonNull(atoms.map((atom) => atom.primaryProcedure)),
    surgeries: uniqueNonNull(atoms.map((atom) => atom.primarySurgery)),
    admissions: uniqueNonNull(
      atoms
        .filter((atom) => atom.admissionStatus === "admitted" || atom.admissionStatus === "both")
        .map((atom) => (atom.admissionStatus === "both" ? "admitted" : atom.admissionStatus))
    ),
    discharges: uniqueNonNull(
      atoms
        .filter((atom) => atom.admissionStatus === "discharged" || atom.admissionStatus === "both")
        .map((atom) => (atom.admissionStatus === "both" ? "discharged" : atom.admissionStatus))
    ),
    pathologies: uniqueNonNull(atoms.map((atom) => atom.pathologySummary)),
    medications: uniqueNonNull(atoms.map((atom) => atom.medicationSummary)),
    symptoms: uniqueNonNull(atoms.map((atom) => atom.symptomSummary))
  };
}

function isHardSeparateType(type: EventAtomResponseContract["eventTypeCandidate"]) {
  return ["surgery", "procedure", "admission", "discharge", "mixed", "unknown"].includes(type);
}

function areCompatibleTypes(
  left: EventAtomResponseContract["eventTypeCandidate"],
  right: EventAtomResponseContract["eventTypeCandidate"]
) {
  if (left === right) {
    return true;
  }

  if (isHardSeparateType(left) || isHardSeparateType(right)) {
    return false;
  }

  const softTypes = ["outpatient", "exam", "treatment", "pathology", "followup"];
  return softTypes.includes(left) && softTypes.includes(right);
}

function hospitalsCompatible(bundle: EventAtomResponseContract[], atom: EventAtomResponseContract) {
  const bundleHospitalKeys = uniqueNonNull(bundle.map((item) => buildHospitalAliasKey(item.primaryHospital ?? "")));
  const atomHospitalKey = buildHospitalAliasKey(atom.primaryHospital ?? "");

  if (bundleHospitalKeys.length === 0 || !atomHospitalKey) {
    return bundleHospitalKeys.length <= 1;
  }

  return bundleHospitalKeys.includes(atomHospitalKey);
}

function canJoinBundle(bundle: EventAtomResponseContract[], atom: EventAtomResponseContract) {
  const bundleTail = bundle.at(-1);
  if (!bundleTail) {
    return false;
  }

  const sameDate = bundleTail.canonicalDate === atom.canonicalDate;
  const sameFile = bundleTail.fileOrder === atom.fileOrder;
  const nearbyPage = Math.abs(bundleTail.pageOrder - atom.pageOrder) <= 1;
  const nearbyBlock = Math.abs(bundleTail.anchorBlockIndex - atom.anchorBlockIndex) <= 8;
  const typeCompatible = areCompatibleTypes(bundleTail.eventTypeCandidate, atom.eventTypeCandidate);

  if (!sameDate || !sameFile || !nearbyPage || !nearbyBlock || !typeCompatible) {
    return false;
  }

  return hospitalsCompatible(bundle, atom);
}

function inferAdmissionStatus(atoms: EventAtomResponseContract[]): EventBundleInput["admissionStatus"] {
  const statuses = new Set(
    atoms
      .map((atom) => atom.admissionStatus)
      .filter((value): value is "admitted" | "discharged" | "both" => value !== null)
      .flatMap((value) => (value === "both" ? ["admitted", "discharged"] : [value]))
  );

  if (statuses.has("admitted") && statuses.has("discharged")) {
    return "both";
  }

  if (statuses.has("admitted")) {
    return "admitted";
  }

  if (statuses.has("discharged")) {
    return "discharged";
  }

  return null;
}

function inferBundleType(atoms: EventAtomResponseContract[]): EventBundleInput["bundleTypeCandidate"] {
  const types = [...new Set(atoms.map((atom) => atom.eventTypeCandidate))];

  if (types.length === 0) return "unknown";
  if (types.includes("surgery")) return "surgery";
  if (types.includes("procedure")) return "procedure";
  if (types.includes("mixed")) return "mixed";
  if (types.includes("unknown")) return types.length === 1 ? "unknown" : "mixed";
  if (types.includes("admission") && types.includes("discharge")) return "mixed";
  if (types.includes("admission")) return "admission";
  if (types.includes("discharge")) return "discharge";
  if (types.includes("pathology")) return types.length === 1 ? "pathology" : "mixed";
  if (types.includes("exam")) return types.length === 1 ? "exam" : "mixed";
  if (types.includes("treatment")) return types.length === 1 ? "treatment" : "mixed";
  if (types.includes("outpatient")) return types.length === 1 ? "outpatient" : "mixed";
  if (types.includes("followup")) return types.length === 1 ? "outpatient" : "mixed";

  return "unknown";
}

function computeAmbiguityScore(params: {
  hospitalConflict: boolean;
  diagnosisConflict: boolean;
  mixedAtomTypes: boolean;
  weakGrouping: boolean;
  primaryHospital: string | null;
  representativeDiagnosis: string | null;
  bundleTypeCandidate: EventBundleInput["bundleTypeCandidate"];
}) {
  let score = 0.12;

  if (params.hospitalConflict) score += 0.24;
  if (params.diagnosisConflict) score += 0.2;
  if (params.mixedAtomTypes) score += 0.18;
  if (params.weakGrouping) score += 0.14;
  if (!params.primaryHospital) score += 0.1;
  if (!params.representativeDiagnosis) score += 0.08;
  if (params.bundleTypeCandidate === "mixed") score += 0.12;
  if (params.bundleTypeCandidate === "unknown") score += 0.16;

  return Math.min(1, Number(score.toFixed(2)));
}

function buildUnresolvedBundleSlots(params: {
  hospitalConflict: boolean;
  diagnosisConflict: boolean;
  mixedAtomTypes: boolean;
  weakGrouping: boolean;
  ambiguityScore: number;
  bundleTypeCandidate: EventBundleInput["bundleTypeCandidate"];
}) {
  const notes: string[] = [];

  if (params.hospitalConflict) notes.push("bundle hospital candidates conflict");
  if (params.diagnosisConflict) notes.push("bundle diagnosis candidates conflict");
  if (params.mixedAtomTypes) notes.push("bundle contains mixed provisional atom types");
  if (params.weakGrouping) notes.push("bundle grouping is weak or sparse");
  if (params.bundleTypeCandidate === "mixed" || params.bundleTypeCandidate === "unknown") {
    notes.push("bundleTypeCandidate needs review");
  }
  if (params.ambiguityScore >= 0.55) {
    notes.push("bundle ambiguity exceeds provisional threshold");
  }

  return unresolvedBundleSlotsSchema.parse({
    hospitalConflict: params.hospitalConflict,
    diagnosisConflict: params.diagnosisConflict,
    mixedAtomTypes: params.mixedAtomTypes,
    weakGrouping: params.weakGrouping,
    needsManualReview:
      params.hospitalConflict ||
      params.diagnosisConflict ||
      params.mixedAtomTypes ||
      params.weakGrouping ||
      params.bundleTypeCandidate === "mixed" ||
      params.bundleTypeCandidate === "unknown" ||
      params.ambiguityScore >= 0.55,
    notes
  });
}

export function buildProvisionalEventBundles(
  atoms: EventAtomResponseContract[],
  ambiguityThreshold = 0.55
): EventBundleInput[] {
  const sortedAtoms = [...atoms].sort((a, b) => {
    if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
    if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
    if (a.canonicalDate !== b.canonicalDate) return a.canonicalDate.localeCompare(b.canonicalDate);
    return a.anchorBlockIndex - b.anchorBlockIndex;
  });

  const groups: EventAtomResponseContract[][] = [];

  for (const atom of sortedAtoms) {
    const targetGroup = groups.find((group) => canJoinBundle(group, atom));

    if (targetGroup) {
      targetGroup.push(atom);
    } else {
      groups.push([atom]);
    }
  }

  return groups.map((group) => {
    const head = group[0];
    if (!head) {
      throw new Error("Expected non-empty bundle group");
    }

    const primaryHospital = chooseRepresentative(group.map((atom) => atom.primaryHospital));
    const representativeDiagnosis = chooseRepresentative(group.map((atom) => atom.primaryDiagnosis));
    const representativeTest = chooseRepresentative(group.map((atom) => atom.primaryTest));
    const representativeTreatment = chooseRepresentative(group.map((atom) => atom.primaryTreatment));
    const representativeProcedure = chooseRepresentative(group.map((atom) => atom.primaryProcedure));
    const representativeSurgery = chooseRepresentative(group.map((atom) => atom.primarySurgery));
    const typeSet = [...new Set(group.map((atom) => atom.eventTypeCandidate))];
    const mixedAtomTypes = typeSet.length > 1;
    const weakGrouping = group.length > 1 && (!primaryHospital.value || new Set(group.map((atom) => atom.pageOrder)).size > 1);
    const bundleTypeCandidate = inferBundleType(group);
    const ambiguityScore = computeAmbiguityScore({
      hospitalConflict: primaryHospital.conflicting,
      diagnosisConflict: representativeDiagnosis.conflicting,
      mixedAtomTypes,
      weakGrouping,
      primaryHospital: primaryHospital.value,
      representativeDiagnosis: representativeDiagnosis.value,
      bundleTypeCandidate
    });

    const unresolvedBundleSlotsJson: UnresolvedBundleSlots = buildUnresolvedBundleSlots({
      hospitalConflict: primaryHospital.conflicting,
      diagnosisConflict: representativeDiagnosis.conflicting,
      mixedAtomTypes,
      weakGrouping,
      ambiguityScore,
      bundleTypeCandidate
    });

    return eventBundleSchema.parse({
      caseId: head.caseId,
      canonicalDate: head.canonicalDate,
      fileOrder: Math.min(...group.map((atom) => atom.fileOrder)),
      pageOrder: Math.min(...group.map((atom) => atom.pageOrder)),
      primaryHospital: primaryHospital.value,
      bundleTypeCandidate,
      representativeDiagnosis: representativeDiagnosis.value,
      representativeTest: representativeTest.value,
      representativeTreatment: representativeTreatment.value,
      representativeProcedure: representativeProcedure.value,
      representativeSurgery: representativeSurgery.value,
      admissionStatus: inferAdmissionStatus(group),
      ambiguityScore,
      requiresReview:
        primaryHospital.conflicting ||
        representativeDiagnosis.conflicting ||
        mixedAtomTypes ||
        ambiguityScore >= ambiguityThreshold ||
        bundleTypeCandidate === "mixed" ||
        bundleTypeCandidate === "unknown",
      unresolvedBundleSlotsJson,
      atomIdsJson: group.map((atom) => atom.id),
      candidateSnapshotJson: mergeSummary(group)
    });
  });
}
