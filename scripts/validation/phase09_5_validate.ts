import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type PilotCase = {
  caseName: string;
  sourceCaseIndex: number;
  reportTxtPath: string;
  sourceDocs: string[];
  coordinateReferencePath: string | null;
  mappingConfidence: "high" | "medium" | "low";
  manualConfirmed: boolean;
  hasCoordinateReference: boolean;
  estimatedPages: number;
  estimatedCost: number;
  finalDecision?: string;
  selectedFinal?: boolean;
};

type GoldenFile = {
  caseName: string;
  reportTxtPath: string;
  sourceDocs: string[];
  mappingConfidence: "high" | "medium" | "low";
  manualConfirmed: boolean;
  hasCoordinateReference: boolean;
  baselineSummary?: {
    reportDateSamples?: string[];
    sourceInstitutionNames?: string[];
  };
  reviewNotes?: string[];
};

type RuntimeArtifact = {
  caseName: string;
  track: "date" | "institution" | "bundle";
  runtimeSource: {
    method: string;
    generatedAt: string;
    investigatorUserEmail: string;
    caseId: string | null;
    jobId: string | null;
  };
  reportTxtPath: string;
  sourceDocs: string[];
  mappingConfidence: "high" | "medium" | "low";
  manualConfirmed: boolean;
  coordinateReferenceSupportAvailable: boolean;
  coordinateReferencePath: string | null;
  pipelineStageStatus: Record<string, boolean>;
  normalizedTimelineDateSummary: {
    dateCandidateDates: string[];
    windowDates: string[];
    atomDates: string[];
    bundleDates: string[];
    earliestDate: string | null;
    latestDate: string | null;
  };
  normalizedInstitutionSummary: {
    atomHospitals: string[];
    bundleHospitals: string[];
    combinedInstitutions: string[];
  };
  normalizedEventCoverageSummary: {
    uploadedDocumentCount: number;
    uploadedDocumentPageCount: number;
    ocrBlockCount: number;
    dateCandidateCount: number;
    windowCount: number;
    eventAtomCount: number;
    eventBundleCount: number;
    eventTypes: string[];
    bundleTypes: string[];
    reportSectionTitles: string[];
    narrativeSectionCount: number;
    pdfByteSize: number;
  };
  extractionWarnings: string[];
  parsingAmbiguityNotes: string[];
  failureTaxonomy: "Intake" | "OCR" | "Semantic" | null;
  actualOcrCost: number;
  actualLlmCost: number;
  timeoutLikeRuntimeFailureRecurred: boolean;
  dominantBlocker: string | null;
  dominantResidualGap: string;
  dominantBlockerImproved: boolean;
  previousBlockerRemainedUnchanged: boolean;
  newBlockerAppeared: string | null;
  relativeToPreviousLockedBaseline: "better" | "same" | "worse";
  notes: string[];
};

type CompareArtifact = {
  caseName: string;
  track: "date" | "institution" | "bundle";
  goldenFile: string;
  runtimeFile: string;
  comparisonStatus:
    | "phase09_5_improved_partial_match"
    | "phase09_5_unchanged_partial_match"
    | "phase09_5_regressed"
    | "phase09_5_failed"
    | "needs_human_review";
  previousLockedBaselinePhase: "phase06_5" | "phase07";
  timeoutFixStillHealthy: boolean;
  dominantResidualGap: string;
  dominantBlockerImproved: boolean;
  previousBlockerRemainedUnchanged: boolean;
  newBlockerAppeared: string | null;
  dateCompletenessSummary: {
    previousMissingDates: string[];
    postfixMissingDates: string[];
    previousExtraDates: string[];
    postfixExtraDates: string[];
  };
  institutionCompletenessSummary: {
    previousMissingInstitutions: string[];
    postfixMissingInstitutions: string[];
    previousExtraInstitutions: string[];
    postfixExtraInstitutions: string[];
  };
  bundleSummary: {
    previousBundleCount: number;
    postfixBundleCount: number;
  };
  remainingSemanticQualityGaps: string[];
  evidenceBackedNotes: string[];
  relativeToPreviousLockedBaseline: "better" | "same" | "worse";
  mediumConfidenceFromFrozenBaseline: boolean;
};

type Phase04RuntimeArtifact = {
  caseName: string;
  normalizedEventCoverageSummary: {
    eventBundleCount: number;
  };
};

type Phase04CompareArtifact = {
  caseName: string;
  dateCoverageComparison?: {
    missingDates: string[];
    extraDates: string[];
  };
  dateCompletenessSummary?: {
    previousMissingDates?: string[];
    postfixMissingDates?: string[];
    previousExtraDates?: string[];
    postfixExtraDates?: string[];
    phase4MissingDates?: string[];
    phase4ExtraDates?: string[];
  };
  institutionLinkageComparison?: {
    missingInstitutionsNormalized: string[];
    extraInstitutionsNormalized: string[];
  };
  institutionCompletenessSummary?: {
    previousMissingInstitutions?: string[];
    postfixMissingInstitutions?: string[];
    previousExtraInstitutions?: string[];
    postfixExtraInstitutions?: string[];
    phase4MissingInstitutions?: string[];
    phase4ExtraInstitutions?: string[];
  };
};

type Phase08ConvergenceRow = {
  caseName: string;
  dominantResidualGap: string;
  secondaryResidualGap: string | null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const RUNTIME_DIR = path.join(ROOT, "phase09_5_runtime");
const COMPARE_DIR = path.join(ROOT, "phase09_5_compare");
const VALIDATION_ORDER = ["Case3", "Case10", "Case36", "Case16", "Case2", "Case34", "Case20"] as const;
const INVESTIGATOR_EMAIL = "charmorzr@gmail.com";

function normalizeDate(value: string) {
  const match = value.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!match) return value.trim();
  const [, year, month, day] = match;
  return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
}

function normalizeInstitution(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function uniqueSorted(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())).map((value) => value.trim()))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function parseDotenv(content: string) {
  const entries: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

async function loadEnvOverride() {
  const envPath = path.join(ROOT, ".env.local");
  const content = await readFile(envPath, "utf8");
  const parsed = parseDotenv(content);
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
  return envPath;
}

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".tif" || ext === ".tiff") return "image/tiff";
  return "application/octet-stream";
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

function toFile(buffer: Buffer, filePath: string) {
  return new File([buffer], path.basename(filePath), { type: getMimeType(filePath) });
}

function pathToImport(relativePath: string) {
  return `file:///${path.join(ROOT, relativePath).replace(/\\/g, "/")}`;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function ensureDirectories() {
  await mkdir(RUNTIME_DIR, { recursive: true });
  await mkdir(COMPARE_DIR, { recursive: true });
}

function buildDateSummary(
  dateCandidates: Array<{ normalizedDate: string | null }>,
  windows: Array<{ canonicalDate: string }>,
  atoms: Array<{ canonicalDate: string }>,
  bundles: Array<{ canonicalDate: string }>
) {
  const dateCandidateDates = uniqueSorted(dateCandidates.map((item) => item.normalizedDate ?? "").filter(Boolean));
  const windowDates = uniqueSorted(windows.map((item) => item.canonicalDate));
  const atomDates = uniqueSorted(atoms.map((item) => item.canonicalDate));
  const bundleDates = uniqueSorted(bundles.map((item) => item.canonicalDate));
  const combined = uniqueSorted([...dateCandidateDates, ...windowDates, ...atomDates, ...bundleDates]);
  return {
    dateCandidateDates,
    windowDates,
    atomDates,
    bundleDates,
    earliestDate: combined[0] ?? null,
    latestDate: combined.at(-1) ?? null
  };
}

function buildInstitutionSummary(
  atoms: Array<{ primaryHospital: string | null }>,
  bundles: Array<{ primaryHospital: string | null }>
) {
  const atomHospitals = uniqueSorted(atoms.map((item) => item.primaryHospital ?? ""));
  const bundleHospitals = uniqueSorted(bundles.map((item) => item.primaryHospital ?? ""));
  return {
    atomHospitals,
    bundleHospitals,
    combinedInstitutions: uniqueSorted([...atomHospitals, ...bundleHospitals])
  };
}

function collectRuntimeErrorWarnings(error: unknown, warnings: string[]) {
  const anyError = error as { message?: string; details?: Record<string, unknown> };
  if (anyError?.message) {
    warnings.push(`runtime_error:${anyError.message}`);
  }
  const detail = anyError?.details?.detail;
  if (typeof detail === "string") {
    warnings.push(`runtime_error_detail:${detail}`);
  }
}

function hasSemanticTimeoutSymptom(warnings: string[], error?: unknown) {
  const anyError = error as { message?: string; details?: Record<string, unknown> } | undefined;
  const combined = `${warnings.join(" ")} ${anyError?.message ?? ""} ${String(anyError?.details?.detail ?? "")}`.toLowerCase();
  return (
    combined.includes("transaction api error") ||
    combined.includes("transaction not found") ||
    combined.includes("closed transaction") ||
    combined.includes("transaction already closed") ||
    combined.includes("timeout")
  );
}

function classifyFailure(error: unknown, warnings: string[]): RuntimeArtifact["failureTaxonomy"] {
  const anyError = error as { message?: string; details?: Record<string, unknown> };
  const message = `${anyError?.message ?? ""} ${String(anyError?.details?.detail ?? "")}`.toLowerCase();
  const warningText = warnings.join(" ").toLowerCase();

  if (message.includes("file too large") || warningText.includes("file too large")) {
    return "Intake";
  }
  if (message.includes("google vision") || warningText.includes("google vision") || message.includes("enoent") || warningText.includes("enoent")) {
    return "OCR";
  }
  if (message.includes("date") || warningText.includes("date")) {
    return "Semantic";
  }

  return "OCR";
}

function throwObjectError(message: string, taxonomy: "Intake" | "OCR" | "Semantic", details: Record<string, unknown>): never {
  const error = new Error(message) as Error & { details?: Record<string, unknown>; taxonomy?: string };
  error.details = details;
  error.taxonomy = taxonomy;
  throw error;
}

function determineTrack(caseName: string): "date" | "institution" | "bundle" {
  if (caseName === "Case20") {
    return "bundle";
  }
  if (caseName === "Case16" || caseName === "Case2" || caseName === "Case34") {
    return "institution";
  }
  return "date";
}

function getPreviousLockedBaselinePhase(caseName: string): "phase06_5" | "phase07" {
  if (caseName === "Case3" || caseName === "Case16" || caseName === "Case36") {
    return "phase07";
  }

  return "phase06_5";
}

function detectNewBlocker(runtime: Pick<RuntimeArtifact, "failureTaxonomy" | "pipelineStageStatus">) {
  if (runtime.failureTaxonomy === "OCR" || runtime.failureTaxonomy === "Intake") {
    return `${runtime.failureTaxonomy.toLowerCase()}_runtime_blocker`;
  }
  if (!runtime.pipelineStageStatus.eventBundlesAvailable) {
    return "bundle_generation_incomplete";
  }
  if (!runtime.pipelineStageStatus.investigatorReportAvailable) {
    return "report_generation_incomplete";
  }
  return null;
}

function getPreviousMissingDates(compare: Phase04CompareArtifact) {
  return (
    compare.dateCoverageComparison?.missingDates ??
    compare.dateCompletenessSummary?.postfixMissingDates ??
    compare.dateCompletenessSummary?.previousMissingDates ??
    compare.dateCompletenessSummary?.phase4MissingDates ??
    []
  );
}

function getPreviousExtraDates(compare: Phase04CompareArtifact) {
  return (
    compare.dateCoverageComparison?.extraDates ??
    compare.dateCompletenessSummary?.postfixExtraDates ??
    compare.dateCompletenessSummary?.previousExtraDates ??
    compare.dateCompletenessSummary?.phase4ExtraDates ??
    []
  );
}

function getPreviousMissingInstitutions(compare: Phase04CompareArtifact) {
  return (
    compare.institutionLinkageComparison?.missingInstitutionsNormalized ??
    compare.institutionCompletenessSummary?.postfixMissingInstitutions ??
    compare.institutionCompletenessSummary?.previousMissingInstitutions ??
    compare.institutionCompletenessSummary?.phase4MissingInstitutions ??
    []
  );
}

function getPreviousExtraInstitutions(compare: Phase04CompareArtifact) {
  return (
    compare.institutionLinkageComparison?.extraInstitutionsNormalized ??
    compare.institutionCompletenessSummary?.postfixExtraInstitutions ??
    compare.institutionCompletenessSummary?.previousExtraInstitutions ??
    compare.institutionCompletenessSummary?.phase4ExtraInstitutions ??
    []
  );
}

function buildCompareArtifact(
  caseName: string,
  golden: GoldenFile,
  runtimeFilePath: string,
  runtime: RuntimeArtifact,
  previousRuntime: Phase04RuntimeArtifact,
  previousCompare: Phase04CompareArtifact,
  previousLockedBaselinePhase: "phase06_5" | "phase07"
): CompareArtifact {
  const goldenDates = uniqueSorted((golden.baselineSummary?.reportDateSamples ?? []).map(normalizeDate));
  const runtimeDates = uniqueSorted([
    ...runtime.normalizedTimelineDateSummary.dateCandidateDates,
    ...runtime.normalizedTimelineDateSummary.windowDates,
    ...runtime.normalizedTimelineDateSummary.atomDates,
    ...runtime.normalizedTimelineDateSummary.bundleDates
  ].map(normalizeDate));
  const missingDates = goldenDates.filter((value) => !runtimeDates.includes(value));
  const extraDates = runtimeDates.filter((value) => !goldenDates.includes(value));

  const goldenInstitutions = uniqueSorted((golden.baselineSummary?.sourceInstitutionNames ?? []).map((value) => value.trim()));
  const runtimeInstitutions = uniqueSorted(runtime.normalizedInstitutionSummary.combinedInstitutions);
  const normalizedGoldenInstitutions = goldenInstitutions.map(normalizeInstitution);
  const normalizedRuntimeInstitutions = runtimeInstitutions.map(normalizeInstitution);
  const missingInstitutions = normalizedGoldenInstitutions.filter((value) => !normalizedRuntimeInstitutions.includes(value));
  const extraInstitutions = normalizedRuntimeInstitutions.filter((value) => !normalizedGoldenInstitutions.includes(value));

  let comparisonStatus: CompareArtifact["comparisonStatus"] = "phase09_5_unchanged_partial_match";
  if (!runtime.pipelineStageStatus.ocrCompleted || !runtime.pipelineStageStatus.eventBundlesAvailable) {
    comparisonStatus = "phase09_5_failed";
  } else if (runtime.relativeToPreviousLockedBaseline === "better") {
    comparisonStatus = "phase09_5_improved_partial_match";
  } else if (runtime.relativeToPreviousLockedBaseline === "worse") {
    comparisonStatus = "phase09_5_regressed";
  }

  const remainingSemanticQualityGaps: string[] = [];
  if (missingDates.length > 0) remainingSemanticQualityGaps.push("missing_golden_dates");
  if (extraDates.length > 0) remainingSemanticQualityGaps.push("extra_runtime_dates");
  if (missingInstitutions.length > 0 || extraInstitutions.length > 0) remainingSemanticQualityGaps.push("institution_alignment_gap");
  if (runtime.normalizedEventCoverageSummary.eventBundleCount > previousRuntime.normalizedEventCoverageSummary.eventBundleCount) {
    remainingSemanticQualityGaps.push("bundle_count_not_improved");
  }

  return {
    caseName,
    track: runtime.track,
    goldenFile: path.join(ROOT, "phase01_golden", `${caseName}_golden.json`),
    runtimeFile: runtimeFilePath,
    comparisonStatus,
    previousLockedBaselinePhase,
    timeoutFixStillHealthy: !runtime.timeoutLikeRuntimeFailureRecurred,
    dominantResidualGap: runtime.dominantResidualGap,
    dominantBlockerImproved: runtime.dominantBlockerImproved,
    previousBlockerRemainedUnchanged: runtime.previousBlockerRemainedUnchanged,
    newBlockerAppeared: runtime.newBlockerAppeared,
    dateCompletenessSummary: {
      previousMissingDates: getPreviousMissingDates(previousCompare),
      postfixMissingDates: missingDates,
      previousExtraDates: getPreviousExtraDates(previousCompare),
      postfixExtraDates: extraDates
    },
    institutionCompletenessSummary: {
      previousMissingInstitutions: getPreviousMissingInstitutions(previousCompare),
      postfixMissingInstitutions: missingInstitutions,
      previousExtraInstitutions: getPreviousExtraInstitutions(previousCompare),
      postfixExtraInstitutions: extraInstitutions
    },
    bundleSummary: {
      previousBundleCount: previousRuntime.normalizedEventCoverageSummary.eventBundleCount,
      postfixBundleCount: runtime.normalizedEventCoverageSummary.eventBundleCount
    },
    remainingSemanticQualityGaps,
    evidenceBackedNotes: [
      `relative_to_previous_locked_baseline=${runtime.relativeToPreviousLockedBaseline}`,
      `dominant_blocker_improved=${runtime.dominantBlockerImproved}`,
      `timeout_like_recurred=${runtime.timeoutLikeRuntimeFailureRecurred}`
    ],
    relativeToPreviousLockedBaseline: runtime.relativeToPreviousLockedBaseline,
    mediumConfidenceFromFrozenBaseline: golden.mappingConfidence === "medium"
  };
}

async function writeRuntimeArtifact(caseName: string, runtime: RuntimeArtifact) {
  await writeJson(path.join(RUNTIME_DIR, `${caseName}_runtime_postfix.json`), runtime);
}

async function executeCaseRerun({
  pilotCase,
  dominantResidualGap,
  investigator,
  createCaseForUser,
  upsertPatientInput,
  uploadDocumentFile,
  createOcrJob,
  getInvestigatorReport,
  getInvestigatorNarrative,
  exportInvestigatorNarrativePdf,
  prisma,
  maxBytes,
  envPath,
  previousCompare,
  previousRuntime
}: {
  pilotCase: PilotCase;
  dominantResidualGap: string;
  investigator: { id: string; email: string };
  createCaseForUser: typeof import("../../apps/web/lib/server/services/case-service").createCaseForUser;
  upsertPatientInput: typeof import("../../apps/web/lib/server/services/case-service").upsertPatientInput;
  uploadDocumentFile: typeof import("../../apps/web/lib/server/services/upload-service").uploadDocumentFile;
  createOcrJob: typeof import("../../apps/web/lib/server/services/job-service").createOcrJob;
  getInvestigatorReport: typeof import("../../apps/web/lib/server/services/investigator-report-service").getInvestigatorReport;
  getInvestigatorNarrative: typeof import("../../apps/web/lib/server/services/investigator-narrative-service").getInvestigatorNarrative;
  exportInvestigatorNarrativePdf: typeof import("../../apps/web/lib/server/services/investigator-report-export-service").exportInvestigatorNarrativePdf;
  prisma: typeof import("../../apps/web/lib/prisma").prisma;
  maxBytes: number;
  envPath: string;
  previousCompare: Phase04CompareArtifact;
  previousRuntime: Phase04RuntimeArtifact;
}): Promise<RuntimeArtifact> {
  const role = "investigator" as const;
  const generatedAt = new Date().toISOString();
  const track = determineTrack(pilotCase.caseName);
  const pipelineStageStatus = {
    caseCreated: false,
    patientInputSaved: false,
    uploadCompleted: false,
    ocrJobCreated: false,
    ocrCompleted: false,
    blocksAvailable: false,
    dateCandidatesAvailable: false,
    windowsAvailable: false,
    eventAtomsAvailable: false,
    eventBundlesAvailable: false,
    structuredOutputAvailable: false,
    investigatorReportAvailable: false,
    investigatorNarrativeAvailable: false,
    investigatorPdfAvailable: false
  };

  const extractionWarnings: string[] = [];
  const parsingAmbiguityNotes: string[] = [`env_override_source:${envPath}`];
  let caseId: string | null = null;
  let jobId: string | null = null;
  let failureTaxonomy: RuntimeArtifact["failureTaxonomy"] = null;
  let pdfByteSize = 0;
  let reportSectionTitles: string[] = [];
  let narrativeSectionCount = 0;

  try {
    const created = await createCaseForUser(investigator.id, {
      title: `Phase 9.5 ${pilotCase.caseName}`,
      audience: "investigator"
    });
    caseId = created.id;
    pipelineStageStatus.caseCreated = true;

    await upsertPatientInput(caseId, investigator.id, role, {
      patientName: pilotCase.caseName,
      insuranceJoinDate: "2010-01-01",
      insuranceCompany: null,
      productType: null,
      notes: null
    });
    pipelineStageStatus.patientInputSaved = true;

    const uploadedDocumentIds: string[] = [];
    for (const sourceDoc of pilotCase.sourceDocs) {
      const buffer = await readFile(sourceDoc);
      if (buffer.byteLength > maxBytes) {
        throwObjectError("File too large", "Intake", {
          size: buffer.byteLength,
          maxBytes,
          sourceDoc
        });
      }
      const uploaded = await uploadDocumentFile(caseId, investigator.id, role, toFile(buffer, sourceDoc));
      uploadedDocumentIds.push(uploaded.documentId);
    }
    pipelineStageStatus.uploadCompleted = true;

    try {
      const jobResult = await createOcrJob(caseId, investigator.id, role, {
        sourceDocumentIds: uploadedDocumentIds,
        enqueueReason: "manual"
      });
      jobId = jobResult.jobId;
      pipelineStageStatus.ocrJobCreated = true;
      pipelineStageStatus.ocrCompleted = jobResult.status === "completed";
    } catch (error) {
      const latestJob = await prisma.analysisJob.findFirst({
        where: { caseId, jobType: "ocr" },
        orderBy: [{ createdAt: "desc" }]
      });
      if (latestJob) {
        jobId = latestJob.id;
        pipelineStageStatus.ocrJobCreated = true;
        pipelineStageStatus.ocrCompleted = latestJob.status === "completed";
        if (latestJob.errorMessage) {
          extractionWarnings.push(`ocr_job_failed:${latestJob.errorMessage}`);
        }
      }
      collectRuntimeErrorWarnings(error, extractionWarnings);
      failureTaxonomy = classifyFailure(error, extractionWarnings);
    }

    const [sourceDocuments, ocrBlocks, dateCandidates, windows, atoms, bundles] = await Promise.all([
      prisma.sourceDocument.findMany({ where: { caseId }, orderBy: { fileOrder: "asc" } }),
      prisma.ocrBlock.findMany({ where: { caseId }, orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }] }),
      prisma.dateCandidate.findMany({ where: { caseId }, orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { blockIndex: "asc" }] }),
      prisma.dateCenteredWindow.findMany({ where: { caseId }, orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { anchorBlockIndex: "asc" }] }),
      prisma.eventAtom.findMany({ where: { caseId }, orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { anchorBlockIndex: "asc" }] }),
      prisma.eventBundle.findMany({ where: { caseId }, orderBy: [{ fileOrder: "asc" }, { pageOrder: "asc" }, { canonicalDate: "asc" }, { createdAt: "asc" }] })
    ]);

    pipelineStageStatus.blocksAvailable = ocrBlocks.length > 0;
    pipelineStageStatus.dateCandidatesAvailable = dateCandidates.length > 0;
    pipelineStageStatus.windowsAvailable = windows.length > 0;
    pipelineStageStatus.eventAtomsAvailable = atoms.length > 0;
    pipelineStageStatus.eventBundlesAvailable = bundles.length > 0;
    pipelineStageStatus.structuredOutputAvailable = bundles.length > 0;

    if (dateCandidates.length === 0) {
      extractionWarnings.push("no_date_candidates");
    }

    try {
      const investigatorReport = await getInvestigatorReport(caseId, investigator.id, role);
      reportSectionTitles = investigatorReport.sections.map((section) => section.heading);
      pipelineStageStatus.investigatorReportAvailable = true;
    } catch (error) {
      collectRuntimeErrorWarnings(error, extractionWarnings);
    }

    try {
      const investigatorNarrative = await getInvestigatorNarrative(caseId, investigator.id, role, "ko");
      narrativeSectionCount = investigatorNarrative.sections.length;
      pipelineStageStatus.investigatorNarrativeAvailable = true;
    } catch (error) {
      collectRuntimeErrorWarnings(error, extractionWarnings);
    }

    try {
      const pdf = await exportInvestigatorNarrativePdf(caseId, investigator.id, role, "ko");
      pdfByteSize = pdf.buffer.byteLength;
      pipelineStageStatus.investigatorPdfAvailable = pdf.buffer.byteLength > 0;
    } catch (error) {
      collectRuntimeErrorWarnings(error, extractionWarnings);
    }

    if (!failureTaxonomy && !pipelineStageStatus.ocrCompleted) {
      failureTaxonomy = "OCR";
    }
    if (!failureTaxonomy && pipelineStageStatus.ocrCompleted && !pipelineStageStatus.dateCandidatesAvailable) {
      failureTaxonomy = "Semantic";
    }

    const runtimeDates = uniqueSorted([
      ...dateCandidates.map((item) => item.normalizedDate),
      ...windows.map((item) => item.canonicalDate),
      ...atoms.map((item) => item.canonicalDate),
      ...bundles.map((item) => item.canonicalDate)
    ].filter(Boolean).map(normalizeDate));
    const golden = await readJson<GoldenFile>(path.join(ROOT, "phase01_golden", `${pilotCase.caseName}_golden.json`));
    const goldenDates = uniqueSorted((golden.baselineSummary?.reportDateSamples ?? []).map(normalizeDate));
    const missingDates = goldenDates.filter((value) => !runtimeDates.includes(value));
    const extraDates = runtimeDates.filter((value) => !goldenDates.includes(value));
    const previousExtraDates = getPreviousExtraDates(previousCompare).length;
    const previousMissingDates = getPreviousMissingDates(previousCompare).length;

    const runtimeInstitutions = buildInstitutionSummary(atoms, bundles).combinedInstitutions.map(normalizeInstitution);
    const goldenInstitutions = uniqueSorted((golden.baselineSummary?.sourceInstitutionNames ?? []).map(normalizeInstitution));
    const previousInstitutionGap =
      getPreviousMissingInstitutions(previousCompare).length + getPreviousExtraInstitutions(previousCompare).length;
    const currentInstitutionGap =
      goldenInstitutions.filter((value) => !runtimeInstitutions.includes(value)).length +
      runtimeInstitutions.filter((value) => !goldenInstitutions.includes(value)).length;
    const previousBundleCount = previousRuntime.normalizedEventCoverageSummary.eventBundleCount;
    const currentBundleCount = bundles.length;

    let dominantBlockerImproved = false;
    let previousBlockerRemainedUnchanged = false;
    let relativeToPreviousLockedBaseline: "better" | "same" | "worse" = "same";

    if (track === "date") {
      const previousTotalGap = previousExtraDates + previousMissingDates;
      const currentTotalGap = extraDates.length + missingDates.length;
      dominantBlockerImproved = currentTotalGap < previousTotalGap && missingDates.length <= previousMissingDates + 1;
      previousBlockerRemainedUnchanged = extraDates.length === previousExtraDates && missingDates.length === previousMissingDates;
      relativeToPreviousLockedBaseline =
        dominantBlockerImproved ? "better" : currentTotalGap > previousTotalGap ? "worse" : "same";
    } else if (track === "institution") {
      dominantBlockerImproved = currentInstitutionGap < previousInstitutionGap;
      previousBlockerRemainedUnchanged = currentInstitutionGap === previousInstitutionGap;
      relativeToPreviousLockedBaseline =
        dominantBlockerImproved ? "better" : currentInstitutionGap > previousInstitutionGap ? "worse" : "same";
    } else {
      dominantBlockerImproved = currentBundleCount < previousBundleCount;
      previousBlockerRemainedUnchanged = currentBundleCount === previousBundleCount;
      relativeToPreviousLockedBaseline =
        dominantBlockerImproved ? "better" : currentBundleCount > previousBundleCount ? "worse" : "same";
    }

    return {
      caseName: pilotCase.caseName,
      track,
      runtimeSource: {
        method: "phase09_5_service_runner",
        generatedAt,
        investigatorUserEmail: investigator.email,
        caseId,
        jobId
      },
      reportTxtPath: pilotCase.reportTxtPath,
      sourceDocs: pilotCase.sourceDocs,
      mappingConfidence: pilotCase.mappingConfidence,
      manualConfirmed: pilotCase.manualConfirmed,
      coordinateReferenceSupportAvailable: pilotCase.hasCoordinateReference,
      coordinateReferencePath: pilotCase.coordinateReferencePath,
      pipelineStageStatus,
      normalizedTimelineDateSummary: buildDateSummary(dateCandidates, windows, atoms, bundles),
      normalizedInstitutionSummary: buildInstitutionSummary(atoms, bundles),
      normalizedEventCoverageSummary: {
        uploadedDocumentCount: sourceDocuments.length,
        uploadedDocumentPageCount: sourceDocuments.reduce((sum, document) => sum + document.pageCount, 0),
        ocrBlockCount: ocrBlocks.length,
        dateCandidateCount: dateCandidates.length,
        windowCount: windows.length,
        eventAtomCount: atoms.length,
        eventBundleCount: bundles.length,
        eventTypes: uniqueSorted(atoms.map((atom) => atom.eventTypeCandidate)),
        bundleTypes: uniqueSorted(bundles.map((bundle) => bundle.bundleTypeCandidate)),
        reportSectionTitles,
        narrativeSectionCount,
        pdfByteSize
      },
      extractionWarnings: uniqueSorted(extractionWarnings),
      parsingAmbiguityNotes,
      failureTaxonomy,
      actualOcrCost: pilotCase.estimatedCost,
      actualLlmCost: 0,
      timeoutLikeRuntimeFailureRecurred: hasSemanticTimeoutSymptom(extractionWarnings),
      dominantBlocker: pipelineStageStatus.ocrCompleted ? null : "runtime_generation_incomplete",
      dominantResidualGap,
      dominantBlockerImproved,
      previousBlockerRemainedUnchanged,
      newBlockerAppeared: detectNewBlocker({ failureTaxonomy, pipelineStageStatus }),
      relativeToPreviousLockedBaseline,
      notes: [`budgetEstimatedCostUsd=${pilotCase.estimatedCost}`]
    };
  } catch (error) {
    collectRuntimeErrorWarnings(error, extractionWarnings);
    if (!failureTaxonomy) {
      failureTaxonomy = classifyFailure(error, extractionWarnings);
    }
    return {
      caseName: pilotCase.caseName,
      track,
      runtimeSource: {
        method: "phase09_5_service_runner",
        generatedAt,
        investigatorUserEmail: investigator.email,
        caseId,
        jobId
      },
      reportTxtPath: pilotCase.reportTxtPath,
      sourceDocs: pilotCase.sourceDocs,
      mappingConfidence: pilotCase.mappingConfidence,
      manualConfirmed: pilotCase.manualConfirmed,
      coordinateReferenceSupportAvailable: pilotCase.hasCoordinateReference,
      coordinateReferencePath: pilotCase.coordinateReferencePath,
      pipelineStageStatus,
      normalizedTimelineDateSummary: {
        dateCandidateDates: [],
        windowDates: [],
        atomDates: [],
        bundleDates: [],
        earliestDate: null,
        latestDate: null
      },
      normalizedInstitutionSummary: {
        atomHospitals: [],
        bundleHospitals: [],
        combinedInstitutions: []
      },
      normalizedEventCoverageSummary: {
        uploadedDocumentCount: 0,
        uploadedDocumentPageCount: 0,
        ocrBlockCount: 0,
        dateCandidateCount: 0,
        windowCount: 0,
        eventAtomCount: 0,
        eventBundleCount: 0,
        eventTypes: [],
        bundleTypes: [],
        reportSectionTitles: [],
        narrativeSectionCount: 0,
        pdfByteSize: 0
      },
      extractionWarnings: uniqueSorted(extractionWarnings),
      parsingAmbiguityNotes,
      failureTaxonomy,
      actualOcrCost: pilotCase.estimatedCost,
      actualLlmCost: 0,
      timeoutLikeRuntimeFailureRecurred: hasSemanticTimeoutSymptom(extractionWarnings, error),
      dominantBlocker:
        failureTaxonomy === "Semantic"
          ? "semantic_transaction_timeout_cluster"
          : failureTaxonomy === "Intake"
            ? "intake_blocker"
            : failureTaxonomy === "OCR"
              ? "ocr_runtime_blocker"
              : "unknown_runtime_blocker",
      dominantResidualGap,
      dominantBlockerImproved: false,
      previousBlockerRemainedUnchanged: false,
      newBlockerAppeared: `${failureTaxonomy?.toLowerCase() ?? "unknown"}_runtime_blocker`,
      relativeToPreviousLockedBaseline: "worse",
      notes: [`budgetEstimatedCostUsd=${pilotCase.estimatedCost}`]
    };
  }
}

async function main() {
  await ensureDirectories();
  const envPath = await loadEnvOverride();

  const manifest = (await readJson<PilotCase[]>(path.join(ROOT, "pilot10_manifest.json"))).filter((item) => item.selectedFinal);
  const convergenceMatrix = await readJson<Phase08ConvergenceRow[]>(path.join(ROOT, "phase08_convergence_matrix.json"));
  const manifestByCase = new Map(manifest.map((item) => [item.caseName, item]));
  const convergenceByCase = new Map(convergenceMatrix.map((item) => [item.caseName, item]));

  const [
    { createCaseForUser, upsertPatientInput },
    { uploadDocumentFile },
    { createOcrJob },
    { getInvestigatorReport },
    { getInvestigatorNarrative },
    { exportInvestigatorNarrativePdf },
    { prisma },
    { loadAppEnv }
  ] = await Promise.all([
    import(pathToImport("apps/web/lib/server/services/case-service.ts")),
    import(pathToImport("apps/web/lib/server/services/upload-service.ts")),
    import(pathToImport("apps/web/lib/server/services/job-service.ts")),
    import(pathToImport("apps/web/lib/server/services/investigator-report-service.ts")),
    import(pathToImport("apps/web/lib/server/services/investigator-narrative-service.ts")),
    import(pathToImport("apps/web/lib/server/services/investigator-report-export-service.ts")),
    import(pathToImport("apps/web/lib/prisma.ts")),
    import(pathToImport("packages/shared/src/env/load-env.ts"))
  ]);

  const envResult = loadAppEnv();
  if (!envResult.ok) {
    throw new Error(`env_not_ready:${envResult.issues.join(";")}`);
  }
  const maxBytes = envResult.data.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024;

  const investigator = await prisma.user.findFirst({
    where: {
      email: INVESTIGATOR_EMAIL,
      role: "investigator",
      status: "active"
    }
  });

  if (!investigator) {
    throw new Error(`investigator_user_not_found:${INVESTIGATOR_EMAIL}`);
  }

  const attemptedCases: string[] = [];
  const successfulValidationCases: string[] = [];
  const failedValidationCases: string[] = [];
  const generatedRuntimeFiles: string[] = [];
  const generatedCompareFiles: string[] = [];
  const perCaseStatus: Array<{ caseName: string; status: CompareArtifact["comparisonStatus"] }> = [];
  let timeoutLikeRuntimeFailureRecurred = false;
  let anyRegression = false;
  const perTrackImprovementJudgment = {
    dateNormalization: "unchanged" as "improved" | "unchanged" | "regressed",
    institutionNormalization: "unchanged" as "improved" | "unchanged" | "regressed",
    bundleGrouping: "unchanged" as "improved" | "unchanged" | "regressed"
  };

  for (const caseName of VALIDATION_ORDER) {
    const pilotCase = manifestByCase.get(caseName);
    const convergence = convergenceByCase.get(caseName);
    if (!pilotCase || !convergence) {
      throw new Error(`missing_case_context:${caseName}`);
    }

    const golden = await readJson<GoldenFile>(path.join(ROOT, "phase01_golden", `${caseName}_golden.json`));
    const previousLockedBaselinePhase = getPreviousLockedBaselinePhase(caseName);
    const previousRuntime = await readJson<Phase04RuntimeArtifact>(
      path.join(
        ROOT,
        previousLockedBaselinePhase === "phase07" ? "phase07_runtime" : "phase06_5_runtime",
        `${caseName}_${previousLockedBaselinePhase === "phase07" ? "runtime_broader_postfix" : "runtime_postfix"}.json`
      )
    );
    const previousCompare = await readJson<Phase04CompareArtifact>(
      path.join(
        ROOT,
        previousLockedBaselinePhase === "phase07" ? "phase07_compare" : "phase06_5_compare",
        `${caseName}_${previousLockedBaselinePhase === "phase07" ? "compare_broader_postfix" : "compare_postfix"}.json`
      )
    );

    attemptedCases.push(caseName);

    const runtime = await executeCaseRerun({
      pilotCase,
      dominantResidualGap: convergence.dominantResidualGap,
      investigator,
      createCaseForUser,
      upsertPatientInput,
      uploadDocumentFile,
      createOcrJob,
      getInvestigatorReport,
      getInvestigatorNarrative,
      exportInvestigatorNarrativePdf,
      prisma,
      maxBytes,
      envPath,
      previousCompare,
      previousRuntime
    });

    const runtimePath = path.join(RUNTIME_DIR, `${caseName}_runtime_postfix.json`);
    await writeRuntimeArtifact(caseName, runtime);
    generatedRuntimeFiles.push(runtimePath);
    timeoutLikeRuntimeFailureRecurred ||= runtime.timeoutLikeRuntimeFailureRecurred;

    const compareArtifact = buildCompareArtifact(
      caseName,
      golden,
      runtimePath,
      runtime,
      previousRuntime,
      previousCompare,
      previousLockedBaselinePhase
    );
    const comparePath = path.join(COMPARE_DIR, `${caseName}_compare_postfix.json`);
    await writeJson(comparePath, compareArtifact);
    generatedCompareFiles.push(comparePath);

    perCaseStatus.push({ caseName, status: compareArtifact.comparisonStatus });
    if (compareArtifact.comparisonStatus === "phase09_5_failed" || compareArtifact.comparisonStatus === "phase09_5_regressed") {
      failedValidationCases.push(caseName);
    } else {
      successfulValidationCases.push(caseName);
    }

    const judgment =
      compareArtifact.comparisonStatus === "phase09_5_improved_partial_match"
        ? "improved"
        : compareArtifact.comparisonStatus === "phase09_5_regressed"
          ? "regressed"
          : "unchanged";

    if (runtime.track === "date") {
      if (judgment === "regressed") perTrackImprovementJudgment.dateNormalization = "regressed";
      else if (judgment === "improved" && perTrackImprovementJudgment.dateNormalization !== "regressed") {
        perTrackImprovementJudgment.dateNormalization = "improved";
      }
    } else if (runtime.track === "institution") {
      if (judgment === "regressed") perTrackImprovementJudgment.institutionNormalization = "regressed";
      else if (judgment === "improved" && perTrackImprovementJudgment.institutionNormalization !== "regressed") {
        perTrackImprovementJudgment.institutionNormalization = "improved";
      }
    } else {
      perTrackImprovementJudgment.bundleGrouping = judgment;
    }

    anyRegression ||= judgment === "regressed";
  }

  const broaderPostFixRerunRecommended =
    !timeoutLikeRuntimeFailureRecurred &&
    perTrackImprovementJudgment.dateNormalization === "improved" &&
    perTrackImprovementJudgment.institutionNormalization === "improved" &&
    perTrackImprovementJudgment.bundleGrouping === "improved" &&
    !anyRegression;

  const validationManifest = {
    phase: "Phase 9.5",
    attemptedCases,
    successfulValidationCases,
    failedValidationCases,
    perCaseStatus,
    perTrackImprovementJudgment,
    timeoutLikeRuntimeFailureRecurred,
    broaderPostFixRerunRecommended,
    anyRegression,
    generatedRuntimeFiles,
    generatedCompareFiles,
    generatedAt: new Date().toISOString()
  };

  await writeJson(path.join(ROOT, "phase09_5_validation_manifest.json"), validationManifest);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
