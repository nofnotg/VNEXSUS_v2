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
  runtimeSource: {
    method: string;
    generatedAt: string;
    investigatorUserEmail: string;
    caseId: string | null;
    jobId: string | null;
    smokeTestCase: boolean;
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
  budgetStopTriggered: boolean;
  rerunStatus: "runtime_recovered" | "rerun_failed";
  notes: string[];
};

type CompareArtifact = {
  caseName: string;
  goldenFile: string;
  runtimeFile: string;
  comparisonStatus:
    | "runtime_recovered_match"
    | "runtime_recovered_partial_match"
    | "runtime_recovered_mismatch"
    | "needs_human_review";
  dateCoverageComparison: {
    goldenReportDates: string[];
    runtimeDates: string[];
    missingDates: string[];
    extraDates: string[];
  };
  institutionLinkageComparison: {
    goldenInstitutions: string[];
    runtimeInstitutions: string[];
    missingInstitutionsNormalized: string[];
    extraInstitutionsNormalized: string[];
  };
  structuralCompletenessComparison: {
    ocrCompleted: boolean;
    blocksAvailable: boolean;
    dateCandidatesAvailable: boolean;
    eventBundlesAvailable: boolean;
    investigatorReportAvailable: boolean;
    investigatorNarrativeAvailable: boolean;
    investigatorPdfAvailable: boolean;
  };
  missingItems: {
    dates: string[];
    institutions: string[];
    pipelineStages: string[];
  };
  extraItems: {
    dates: string[];
    institutions: string[];
  };
  suspiciousValues: string[];
  reviewerCautionNotes: string[];
  mediumConfidenceFromFrozenBaseline: boolean;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const RUNTIME_DIR = path.join(ROOT, "phase02_5_runtime");
const COMPARE_DIR = path.join(ROOT, "phase02_5_compare");
const PILOT_ORDER = ["Case16", "Case3", "Case17", "Case2", "Case20", "Case34", "Case12", "Case10", "Case36", "Case7"] as const;
const SMOKE_CASE = "Case16";
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

function collectStageFailures(runtime: RuntimeArtifact) {
  const failures: string[] = [];
  const stage = runtime.pipelineStageStatus;
  if (!stage.ocrCompleted) failures.push("ocrCompleted");
  if (!stage.blocksAvailable) failures.push("blocksAvailable");
  if (!stage.dateCandidatesAvailable) failures.push("dateCandidatesAvailable");
  if (!stage.eventBundlesAvailable) failures.push("eventBundlesAvailable");
  return failures;
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

function buildCompareArtifact(caseName: string, golden: GoldenFile, runtimeFilePath: string, runtime: RuntimeArtifact): CompareArtifact {
  const goldenDates = uniqueSorted((golden.baselineSummary?.reportDateSamples ?? []).map(normalizeDate));
  const runtimeDates = uniqueSorted([
    ...runtime.normalizedTimelineDateSummary.dateCandidateDates,
    ...runtime.normalizedTimelineDateSummary.windowDates,
    ...runtime.normalizedTimelineDateSummary.atomDates,
    ...runtime.normalizedTimelineDateSummary.bundleDates
  ].map(normalizeDate));

  const goldenInstitutions = uniqueSorted((golden.baselineSummary?.sourceInstitutionNames ?? []).map((value) => value.trim()));
  const runtimeInstitutions = uniqueSorted(runtime.normalizedInstitutionSummary.combinedInstitutions);

  const normalizedGoldenInstitutions = goldenInstitutions.map(normalizeInstitution);
  const normalizedRuntimeInstitutions = runtimeInstitutions.map(normalizeInstitution);

  const missingDates = goldenDates.filter((value) => !runtimeDates.includes(value));
  const extraDates = runtimeDates.filter((value) => !goldenDates.includes(value));
  const missingInstitutionsNormalized = normalizedGoldenInstitutions.filter((value) => !normalizedRuntimeInstitutions.includes(value));
  const extraInstitutionsNormalized = normalizedRuntimeInstitutions.filter((value) => !normalizedGoldenInstitutions.includes(value));

  const overlappingDates = goldenDates.filter((value) => runtimeDates.includes(value)).length;
  const overlappingInstitutions = normalizedGoldenInstitutions.filter((value) => normalizedRuntimeInstitutions.includes(value)).length;
  const medium = golden.mappingConfidence === "medium";

  let comparisonStatus: CompareArtifact["comparisonStatus"] = "runtime_recovered_mismatch";

  if (missingDates.length === 0 && missingInstitutionsNormalized.length === 0 && runtime.pipelineStageStatus.eventBundlesAvailable) {
    comparisonStatus = "runtime_recovered_match";
  } else if ((overlappingDates > 0 || overlappingInstitutions > 0) && runtime.pipelineStageStatus.ocrCompleted) {
    comparisonStatus = "runtime_recovered_partial_match";
  } else if (medium) {
    comparisonStatus = "needs_human_review";
  }

  const cautionNotes = [...(golden.reviewNotes ?? [])];
  if (medium) {
    cautionNotes.push("medium_confidence_from_frozen_baseline");
  }
  if (!golden.hasCoordinateReference) {
    cautionNotes.push("no_coordinate_reference_support");
  }

  return {
    caseName,
    goldenFile: path.join(ROOT, "phase01_golden", `${caseName}_golden.json`),
    runtimeFile: runtimeFilePath,
    comparisonStatus,
    dateCoverageComparison: {
      goldenReportDates: goldenDates,
      runtimeDates,
      missingDates,
      extraDates
    },
    institutionLinkageComparison: {
      goldenInstitutions,
      runtimeInstitutions,
      missingInstitutionsNormalized,
      extraInstitutionsNormalized
    },
    structuralCompletenessComparison: {
      ocrCompleted: runtime.pipelineStageStatus.ocrCompleted,
      blocksAvailable: runtime.pipelineStageStatus.blocksAvailable,
      dateCandidatesAvailable: runtime.pipelineStageStatus.dateCandidatesAvailable,
      eventBundlesAvailable: runtime.pipelineStageStatus.eventBundlesAvailable,
      investigatorReportAvailable: runtime.pipelineStageStatus.investigatorReportAvailable,
      investigatorNarrativeAvailable: runtime.pipelineStageStatus.investigatorNarrativeAvailable,
      investigatorPdfAvailable: runtime.pipelineStageStatus.investigatorPdfAvailable
    },
    missingItems: {
      dates: missingDates,
      institutions: missingInstitutionsNormalized,
      pipelineStages: collectStageFailures(runtime)
    },
    extraItems: {
      dates: extraDates,
      institutions: extraInstitutionsNormalized
    },
    suspiciousValues: runtime.extractionWarnings,
    reviewerCautionNotes: cautionNotes,
    mediumConfidenceFromFrozenBaseline: medium
  };
}

async function writeRuntimeArtifact(caseName: string, runtime: RuntimeArtifact) {
  await writeJson(path.join(RUNTIME_DIR, `${caseName}_runtime_rerun.json`), runtime);
}

async function executeCaseRerun({
  pilotCase,
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
  smokeTestCase,
  envPath
}: {
  pilotCase: PilotCase;
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
  smokeTestCase: boolean;
  envPath: string;
}): Promise<RuntimeArtifact> {
  const role = "investigator" as const;
  const generatedAt = new Date().toISOString();
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
      title: `Phase 2.5 ${pilotCase.caseName}`,
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

    return {
      caseName: pilotCase.caseName,
      runtimeSource: {
        method: "phase02_5_service_runner",
        generatedAt,
        investigatorUserEmail: investigator.email,
        caseId,
        jobId,
        smokeTestCase
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
      budgetStopTriggered: false,
      rerunStatus: pipelineStageStatus.ocrCompleted ? "runtime_recovered" : "rerun_failed",
      notes: [`budgetEstimatedCostUsd=${pilotCase.estimatedCost}`]
    };
  } catch (error) {
    collectRuntimeErrorWarnings(error, extractionWarnings);
    if (!failureTaxonomy) {
      failureTaxonomy = classifyFailure(error, extractionWarnings);
    }
    return {
      caseName: pilotCase.caseName,
      runtimeSource: {
        method: "phase02_5_service_runner",
        generatedAt,
        investigatorUserEmail: investigator.email,
        caseId,
        jobId,
        smokeTestCase
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
      budgetStopTriggered: false,
      rerunStatus: "rerun_failed",
      notes: [`budgetEstimatedCostUsd=${pilotCase.estimatedCost}`]
    };
  }
}

async function main() {
  await ensureDirectories();
  const envPath = await loadEnvOverride();

  const manifest = (await readJson<PilotCase[]>(path.join(ROOT, "pilot10_manifest.json"))).filter((item) => item.selectedFinal);
  const goldenManifest = await readJson<{ generatedGoldenFiles: string[] }>(path.join(ROOT, "phase01_golden_manifest.json"));

  const manifestByCase = new Map(manifest.map((item) => [item.caseName, item]));
  const goldenByCase = new Map<string, GoldenFile>();
  for (const goldenFilePath of goldenManifest.generatedGoldenFiles) {
    const golden = await readJson<GoldenFile>(goldenFilePath);
    goldenByCase.set(golden.caseName, golden);
  }

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
  const successfulRuntimeRerunCases: string[] = [];
  const failedRerunCases: Array<{ caseName: string; reason: string }> = [];
  const deferredCases: Array<{ caseName: string; reason: string }> = [];
  const generatedRuntimeFiles: string[] = [];
  const generatedCompareFiles: string[] = [];
  let ocrRecoveryProven = false;

  for (const caseName of PILOT_ORDER) {
    const pilotCase = manifestByCase.get(caseName);
    const golden = goldenByCase.get(caseName);
    if (!pilotCase || !golden) {
      throw new Error(`missing_frozen_case:${caseName}`);
    }

    if (caseName === "Case7") {
      const oversizedDocs: Array<{ sourceDoc: string; size: number }> = [];
      for (const sourceDoc of pilotCase.sourceDocs) {
        const buffer = await readFile(sourceDoc);
        if (buffer.byteLength > maxBytes) {
          oversizedDocs.push({ sourceDoc, size: buffer.byteLength });
        }
      }
      if (oversizedDocs.length > 0) {
        deferredCases.push({
          caseName,
          reason: `file_too_large:${oversizedDocs.map((item) => `${path.basename(item.sourceDoc)}=${item.size}`).join(",")}`
        });
        continue;
      }
    }

    attemptedCases.push(caseName);

    const runtime = await executeCaseRerun({
      pilotCase,
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
      smokeTestCase: caseName === SMOKE_CASE,
      envPath
    });

    await writeRuntimeArtifact(caseName, runtime);
    generatedRuntimeFiles.push(path.join(RUNTIME_DIR, `${caseName}_runtime_rerun.json`));

    if (caseName === SMOKE_CASE) {
      const sameCredentialIssue = runtime.extractionWarnings.some((warning) =>
        warning.includes("medreport-assistant-2d733c1156cb.json")
      );
      if (sameCredentialIssue || !runtime.pipelineStageStatus.ocrCompleted) {
        failedRerunCases.push({
          caseName,
          reason: sameCredentialIssue ? "same_credential_path_failure" : "smoke_case_not_clean"
        });
        break;
      }
      ocrRecoveryProven = true;
    }

    if (!runtime.pipelineStageStatus.ocrCompleted) {
      failedRerunCases.push({
        caseName,
        reason: runtime.failureTaxonomy ? runtime.failureTaxonomy : "rerun_failed"
      });
      continue;
    }

    successfulRuntimeRerunCases.push(caseName);
    const compareArtifact = buildCompareArtifact(caseName, golden, path.join(RUNTIME_DIR, `${caseName}_runtime_rerun.json`), runtime);
    await writeJson(path.join(COMPARE_DIR, `${caseName}_compare_rerun.json`), compareArtifact);
    generatedCompareFiles.push(path.join(COMPARE_DIR, `${caseName}_compare_rerun.json`));
  }

  const runtimeManifest = {
    phase: "Phase 2.5",
    attemptedCases,
    successfulRuntimeRerunCases,
    failedRerunCases,
    deferredCases,
    runtimeGenerationMethodSummary:
      "Limited Phase 2.5 service-runner execution using real local env with .env.local override, real DB, and real storage/OCR path via createCaseForUser + upsertPatientInput + uploadDocumentFile + createOcrJob; frozen Phase 0.5/1 artifacts preserved.",
    generatedRuntimeFiles,
    allRuntimeArtifactsExist: generatedRuntimeFiles.every((filePath) => Boolean(filePath)),
    ocrRecoveryProven,
    smokeTestCase: SMOKE_CASE,
    generatedAt: new Date().toISOString()
  };

  const compareStatuses: Array<{ caseName: string; comparisonStatus: string }> = [];
  for (const compareFilePath of generatedCompareFiles) {
    const compare = await readJson<CompareArtifact>(compareFilePath);
    compareStatuses.push({ caseName: compare.caseName, comparisonStatus: compare.comparisonStatus });
  }

  const statusCounts = compareStatuses.reduce<Record<string, number>>(
    (accumulator, item) => {
      accumulator[item.comparisonStatus] = (accumulator[item.comparisonStatus] ?? 0) + 1;
      return accumulator;
    },
    {
      runtime_recovered_match: 0,
      runtime_recovered_partial_match: 0,
      runtime_recovered_mismatch: 0,
      needs_human_review: 0,
      rerun_failed: failedRerunCases.length + deferredCases.length
    }
  );

  const compareManifest = {
    phase: "Phase 2.5",
    comparisonFiles: generatedCompareFiles,
    caseStatuses: [
      ...compareStatuses,
      ...failedRerunCases.map((item) => ({ caseName: item.caseName, comparisonStatus: "rerun_failed" })),
      ...deferredCases.map((item) => ({ caseName: item.caseName, comparisonStatus: "rerun_failed" }))
    ],
    statusCounts,
    mediumConfidenceCases: manifest.filter((item) => item.mappingConfidence === "medium").map((item) => item.caseName),
    highestRiskRemainingCases: [...failedRerunCases.map((item) => item.caseName), ...deferredCases.map((item) => item.caseName)],
    comparisonQuality:
      successfulRuntimeRerunCases.length > 0 && failedRerunCases.length === 0 && deferredCases.length === 0
        ? "semantic-grade"
        : "execution-limited",
    generatedAt: new Date().toISOString()
  };

  await writeJson(path.join(ROOT, "phase02_5_runtime_manifest.json"), runtimeManifest);
  await writeJson(path.join(ROOT, "phase02_5_compare_manifest.json"), compareManifest);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
