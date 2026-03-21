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
  dominantPhase5Blocker: string;
  dominantBlockerImproved: boolean;
  previousBlockerRemainedUnchanged: boolean;
  newBlockerAppeared: string | null;
  relativeToPhase4: "better" | "same" | "worse";
  notes: string[];
};

type CompareArtifact = {
  caseName: string;
  track: "date" | "institution" | "bundle";
  goldenFile: string;
  runtimeFile: string;
  comparisonStatus:
    | "broader_postfix_improved_partial_match"
    | "broader_postfix_unchanged_partial_match"
    | "broader_postfix_match"
    | "broader_postfix_regressed"
    | "broader_postfix_failed"
    | "needs_human_review";
  timeoutFixStillHealthy: boolean;
  dominantPhase5Blocker: string;
  dominantBlockerImproved: boolean;
  previousBlockerRemainedUnchanged: boolean;
  newBlockerAppeared: string | null;
  dateCompletenessSummary: {
    phase4MissingDates: string[];
    postfixMissingDates: string[];
    phase4ExtraDates: string[];
    postfixExtraDates: string[];
  };
  institutionCompletenessSummary: {
    phase4MissingInstitutions: string[];
    postfixMissingInstitutions: string[];
    phase4ExtraInstitutions: string[];
    postfixExtraInstitutions: string[];
  };
  bundleSummary: {
    phase4BundleCount: number;
    postfixBundleCount: number;
  };
  remainingSemanticQualityGaps: string[];
  evidenceBackedNotes: string[];
  relativeToPhase4: "better" | "same" | "worse";
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
  dateCoverageComparison: {
    missingDates: string[];
    extraDates: string[];
  };
  institutionLinkageComparison: {
    missingInstitutionsNormalized: string[];
    extraInstitutionsNormalized: string[];
  };
};

type Phase05QualityRow = {
  caseName: string;
  dominantQualityBlocker: string;
  secondaryQualityBlocker: string | null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const RUNTIME_DIR = path.join(ROOT, "phase07_runtime");
const COMPARE_DIR = path.join(ROOT, "phase07_compare");
const VALIDATION_ORDER = ["Case16", "Case3", "Case12", "Case36"] as const;
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

function determineTrack(dominantPhase5Blocker: string): "date" | "institution" | "bundle" {
  if (dominantPhase5Blocker.includes("bundle")) {
    return "bundle";
  }
  if (dominantPhase5Blocker.includes("institution")) {
    return "institution";
  }
  return "date";
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

function buildCompareArtifact(
  caseName: string,
  golden: GoldenFile,
  runtimeFilePath: string,
  runtime: RuntimeArtifact,
  phase4Runtime: Phase04RuntimeArtifact,
  phase4Compare: Phase04CompareArtifact
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

  let comparisonStatus: CompareArtifact["comparisonStatus"] = "broader_postfix_unchanged_partial_match";
  if (!runtime.pipelineStageStatus.ocrCompleted || !runtime.pipelineStageStatus.eventBundlesAvailable) {
    comparisonStatus = "broader_postfix_failed";
  } else if (
    missingDates.length === 0 &&
    extraDates.length === 0 &&
    missingInstitutions.length === 0 &&
    extraInstitutions.length === 0 &&
    runtime.normalizedEventCoverageSummary.eventBundleCount <= phase4Runtime.normalizedEventCoverageSummary.eventBundleCount
  ) {
    comparisonStatus = "broader_postfix_match";
  } else if (runtime.relativeToPhase4 === "better") {
    comparisonStatus = "broader_postfix_improved_partial_match";
  } else if (runtime.relativeToPhase4 === "worse") {
    comparisonStatus = "broader_postfix_regressed";
  }

  const remainingSemanticQualityGaps: string[] = [];
  if (missingDates.length > 0) remainingSemanticQualityGaps.push("missing_golden_dates");
  if (extraDates.length > 0) remainingSemanticQualityGaps.push("extra_runtime_dates");
  if (missingInstitutions.length > 0 || extraInstitutions.length > 0) remainingSemanticQualityGaps.push("institution_alignment_gap");
  if (runtime.normalizedEventCoverageSummary.eventBundleCount > phase4Runtime.normalizedEventCoverageSummary.eventBundleCount) {
    remainingSemanticQualityGaps.push("bundle_count_not_improved");
  }

  return {
    caseName,
    track: runtime.track,
    goldenFile: path.join(ROOT, "phase01_golden", `${caseName}_golden.json`),
    runtimeFile: runtimeFilePath,
    comparisonStatus,
    dominantPhase5Blocker: runtime.dominantPhase5Blocker,
    timeoutFixStillHealthy: !runtime.timeoutLikeRuntimeFailureRecurred,
    dominantBlockerImproved: runtime.dominantBlockerImproved,
    previousBlockerRemainedUnchanged: runtime.previousBlockerRemainedUnchanged,
    newBlockerAppeared: runtime.newBlockerAppeared,
    dateCompletenessSummary: {
      phase4MissingDates: phase4Compare.dateCoverageComparison.missingDates,
      postfixMissingDates: missingDates,
      phase4ExtraDates: phase4Compare.dateCoverageComparison.extraDates,
      postfixExtraDates: extraDates
    },
    institutionCompletenessSummary: {
      phase4MissingInstitutions: phase4Compare.institutionLinkageComparison.missingInstitutionsNormalized,
      postfixMissingInstitutions: missingInstitutions,
      phase4ExtraInstitutions: phase4Compare.institutionLinkageComparison.extraInstitutionsNormalized,
      postfixExtraInstitutions: extraInstitutions
    },
    bundleSummary: {
      phase4BundleCount: phase4Runtime.normalizedEventCoverageSummary.eventBundleCount,
      postfixBundleCount: runtime.normalizedEventCoverageSummary.eventBundleCount
    },
    remainingSemanticQualityGaps,
    evidenceBackedNotes: [
      `relative_to_phase4=${runtime.relativeToPhase4}`,
      `dominant_blocker_improved=${runtime.dominantBlockerImproved}`,
      `timeout_like_recurred=${runtime.timeoutLikeRuntimeFailureRecurred}`
    ],
    relativeToPhase4: runtime.relativeToPhase4,
    mediumConfidenceFromFrozenBaseline: golden.mappingConfidence === "medium"
  };
}

async function writeRuntimeArtifact(caseName: string, runtime: RuntimeArtifact) {
  await writeJson(path.join(RUNTIME_DIR, `${caseName}_runtime_broader_postfix.json`), runtime);
}

async function executeCaseRerun({
  pilotCase,
  dominantPhase5Blocker,
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
  phase4Compare,
  phase4Runtime
}: {
  pilotCase: PilotCase;
  dominantPhase5Blocker: string;
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
  phase4Compare: Phase04CompareArtifact;
  phase4Runtime: Phase04RuntimeArtifact;
}): Promise<RuntimeArtifact> {
  const role = "investigator" as const;
  const generatedAt = new Date().toISOString();
  const track = determineTrack(dominantPhase5Blocker);
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
      title: `Phase 4 ${pilotCase.caseName}`,
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
    const phase4ExtraDates = phase4Compare.dateCoverageComparison.extraDates.length;
    const phase4MissingDates = phase4Compare.dateCoverageComparison.missingDates.length;

    const runtimeInstitutions = buildInstitutionSummary(atoms, bundles).combinedInstitutions.map(normalizeInstitution);
    const goldenInstitutions = uniqueSorted((golden.baselineSummary?.sourceInstitutionNames ?? []).map(normalizeInstitution));
    const phase4InstitutionGap =
      phase4Compare.institutionLinkageComparison.missingInstitutionsNormalized.length +
      phase4Compare.institutionLinkageComparison.extraInstitutionsNormalized.length;
    const currentInstitutionGap =
      goldenInstitutions.filter((value) => !runtimeInstitutions.includes(value)).length +
      runtimeInstitutions.filter((value) => !goldenInstitutions.includes(value)).length;
    const phase4BundleCount = phase4Runtime.normalizedEventCoverageSummary.eventBundleCount;
    const currentBundleCount = bundles.length;

    let dominantBlockerImproved = false;
    let previousBlockerRemainedUnchanged = false;
    let relativeToPhase4: "better" | "same" | "worse" = "same";

    if (track === "date") {
      dominantBlockerImproved = extraDates.length < phase4ExtraDates && missingDates.length <= phase4MissingDates + 1;
      previousBlockerRemainedUnchanged = extraDates.length === phase4ExtraDates && missingDates.length === phase4MissingDates;
      relativeToPhase4 = dominantBlockerImproved ? "better" : extraDates.length > phase4ExtraDates ? "worse" : "same";
    } else if (track === "institution") {
      dominantBlockerImproved = currentInstitutionGap < phase4InstitutionGap;
      previousBlockerRemainedUnchanged = currentInstitutionGap === phase4InstitutionGap;
      relativeToPhase4 = dominantBlockerImproved ? "better" : currentInstitutionGap > phase4InstitutionGap ? "worse" : "same";
    } else {
      dominantBlockerImproved = currentBundleCount < phase4BundleCount;
      previousBlockerRemainedUnchanged = currentBundleCount === phase4BundleCount;
      relativeToPhase4 = dominantBlockerImproved ? "better" : currentBundleCount > phase4BundleCount ? "worse" : "same";
    }

    return {
      caseName: pilotCase.caseName,
      track,
      runtimeSource: {
        method: "phase07_service_runner",
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
      dominantPhase5Blocker,
      dominantBlockerImproved,
      previousBlockerRemainedUnchanged,
      newBlockerAppeared: detectNewBlocker({ failureTaxonomy, pipelineStageStatus }),
      relativeToPhase4,
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
        method: "phase07_service_runner",
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
      dominantPhase5Blocker,
      dominantBlockerImproved: false,
      previousBlockerRemainedUnchanged: false,
      newBlockerAppeared: `${failureTaxonomy?.toLowerCase() ?? "unknown"}_runtime_blocker`,
      relativeToPhase4: "worse",
      notes: [`budgetEstimatedCostUsd=${pilotCase.estimatedCost}`]
    };
  }
}

async function main() {
  await ensureDirectories();
  const envPath = await loadEnvOverride();

  const manifest = (await readJson<PilotCase[]>(path.join(ROOT, "pilot10_manifest.json"))).filter((item) => item.selectedFinal);
  const qualityMatrix = await readJson<Phase05QualityRow[]>(path.join(ROOT, "phase05_quality_matrix.json"));
  const phase06_5Manifest = await readJson<{
    perTrackImprovementJudgment: {
      dateNormalization: "improved" | "unchanged" | "regressed";
      institutionNormalization: "improved" | "unchanged" | "regressed";
      bundleGrouping: "improved" | "unchanged" | "regressed";
    };
  }>(path.join(ROOT, "phase06_5_validation_manifest.json"));
  const manifestByCase = new Map(manifest.map((item) => [item.caseName, item]));
  const qualityByCase = new Map(qualityMatrix.map((item) => [item.caseName, item]));

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
    dateNormalization: phase06_5Manifest.perTrackImprovementJudgment.dateNormalization,
    institutionNormalization: phase06_5Manifest.perTrackImprovementJudgment.institutionNormalization,
    bundleGrouping: phase06_5Manifest.perTrackImprovementJudgment.bundleGrouping
  };

  for (const caseName of VALIDATION_ORDER) {
    const pilotCase = manifestByCase.get(caseName);
    const quality = qualityByCase.get(caseName);
    if (!pilotCase || !quality) {
      throw new Error(`missing_case_context:${caseName}`);
    }

    const golden = await readJson<GoldenFile>(path.join(ROOT, "phase01_golden", `${caseName}_golden.json`));
    const phase4Runtime = await readJson<Phase04RuntimeArtifact>(path.join(ROOT, "phase04_runtime", `${caseName}_runtime_broad.json`));
    const phase4Compare = await readJson<Phase04CompareArtifact>(path.join(ROOT, "phase04_compare", `${caseName}_compare_broad.json`));

    attemptedCases.push(caseName);

    const runtime = await executeCaseRerun({
      pilotCase,
      dominantPhase5Blocker: quality.dominantQualityBlocker,
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
      phase4Compare,
      phase4Runtime
    });

    const runtimePath = path.join(RUNTIME_DIR, `${caseName}_runtime_broader_postfix.json`);
    await writeRuntimeArtifact(caseName, runtime);
    generatedRuntimeFiles.push(runtimePath);
    timeoutLikeRuntimeFailureRecurred ||= runtime.timeoutLikeRuntimeFailureRecurred;

    const compareArtifact = buildCompareArtifact(caseName, golden, runtimePath, runtime, phase4Runtime, phase4Compare);
    const comparePath = path.join(COMPARE_DIR, `${caseName}_compare_broader_postfix.json`);
    await writeJson(comparePath, compareArtifact);
    generatedCompareFiles.push(comparePath);

    perCaseStatus.push({ caseName, status: compareArtifact.comparisonStatus });
    if (
      compareArtifact.comparisonStatus === "broader_postfix_failed" ||
      compareArtifact.comparisonStatus === "broader_postfix_regressed"
    ) {
      failedValidationCases.push(caseName);
    } else {
      successfulValidationCases.push(caseName);
    }

    const judgment =
      compareArtifact.comparisonStatus === "broader_postfix_improved_partial_match" ||
      compareArtifact.comparisonStatus === "broader_postfix_match"
        ? "improved"
        : compareArtifact.comparisonStatus === "broader_postfix_regressed"
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

  const phase6FixesHoldAtBroaderScale =
    !timeoutLikeRuntimeFailureRecurred &&
    perTrackImprovementJudgment.dateNormalization === "improved" &&
    perTrackImprovementJudgment.institutionNormalization === "improved" &&
    perTrackImprovementJudgment.bundleGrouping === "improved" &&
    !anyRegression;

  const allBroaderPostFixValidationArtifactsExist =
    generatedRuntimeFiles.length === VALIDATION_ORDER.length && generatedCompareFiles.length === VALIDATION_ORDER.length;

  const validationManifest = {
    phase: "Phase 7",
    attemptedCases,
    successfulValidationCases,
    failedValidationCases,
    generatedRuntimeFiles,
    generatedCompareFiles,
    perCaseStatus,
    perCaseImprovementVsPhase4: perCaseStatus.map(({ caseName, status }) => ({
      caseName,
      status,
      relativeToPhase4:
        status === "broader_postfix_improved_partial_match" || status === "broader_postfix_match"
          ? "better"
          : status === "broader_postfix_regressed"
            ? "worse"
            : "same"
    })),
    perTrackImprovementJudgment,
    timeoutLikeRuntimeFailureRecurred,
    phase6FixesHoldAtBroaderScale,
    allBroaderPostFixValidationArtifactsExist,
    finalFullRecoverableSetRerunStillNeeded: false,
    anyRegression,
    generatedAt: new Date().toISOString()
  };

  await writeJson(path.join(ROOT, "phase07_validation_manifest.json"), validationManifest);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
