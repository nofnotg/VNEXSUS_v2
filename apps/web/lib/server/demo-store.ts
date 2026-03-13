import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  caseAnalyticsSchema,
  caseAnalyticsTrendSchema,
  caseDetailSchema,
  caseEventSchema,
  caseListJsonSchema,
  normalizeLocaleCode,
  type CaseAnalytics,
  type CaseAnalyticsFilter,
  type CaseAnalyticsPreset,
  type CaseAnalyticsTrend,
  type CaseDetail,
  type CaseEvent,
  type LocaleCode
} from "@vnexus/shared";

const DEMO_ROOT = path.join(process.cwd(), ".demo");
const DEMO_STATE_PATH = path.join(DEMO_ROOT, "state.json");
const DEMO_CASE_ID = "demo-case-1";
const DEMO_OWNER_ID = "demo-user";

type DemoDocument = {
  documentId: string;
  originalFileName: string;
  mimeType: string;
  pageCount: number;
  fileOrder: number;
  uploadedAt: string;
  storagePath: string;
  publicUrl: string;
  status: "uploaded" | "ocr_ready";
};

type DemoJob = {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
};

type DemoCase = {
  caseId: string;
  title: string;
  audience: "consumer" | "investigator";
  status: "draft" | "uploaded" | "processing" | "ready" | "review_required";
  createdAt: string;
  updatedAt: string;
  hospitalName: string | null;
  documents: DemoDocument[];
  events: CaseEvent[];
  bundles: Array<{
    id: string;
    caseId: string;
    canonicalDate: string;
    fileOrder: number;
    pageOrder: number;
    primaryHospital: string | null;
    bundleTypeCandidate:
      | "outpatient"
      | "exam"
      | "treatment"
      | "procedure"
      | "surgery"
      | "admission"
      | "discharge"
      | "pathology"
      | "mixed"
      | "unknown";
    representativeDiagnosis: string | null;
    representativeTest: string | null;
    representativeTreatment: string | null;
    representativeProcedure: string | null;
    representativeSurgery: string | null;
    admissionStatus: "admitted" | "discharged" | "both" | null;
    ambiguityScore: number;
    requiresReview: boolean;
    unresolvedBundleSlotsJson: {
      hospitalConflict: boolean;
      diagnosisConflict: boolean;
      mixedAtomTypes: boolean;
      weakGrouping: boolean;
      needsManualReview: boolean;
      notes: string[];
    };
    atomIdsJson: string[];
    candidateSnapshotJson: {
      hospitals: string[];
      departments: string[];
      diagnoses: string[];
      tests: string[];
      treatments: string[];
      procedures: string[];
      surgeries: string[];
      admissions: string[];
      discharges: string[];
      pathologies: string[];
      medications: string[];
      symptoms: string[];
    };
    createdAt: string;
  }>;
  latestOcrJob: DemoJob | null;
};

type DemoState = {
  users: Array<{
    userId: string;
    email: string;
    locale: LocaleCode;
    theme: "light" | "dark";
    presets: CaseAnalyticsPreset[];
  }>;
  cases: DemoCase[];
};

function createInitialState(): DemoState {
  const now = new Date().toISOString();

  return {
    users: [
      {
        userId: DEMO_OWNER_ID,
        email: "demo-investigator@vnexus.local",
        locale: "en",
        theme: "light",
        presets: []
      }
    ],
    cases: [
      {
        caseId: DEMO_CASE_ID,
        title: "Demo medical timeline case",
        audience: "investigator",
        status: "draft",
        createdAt: now,
        updatedAt: now,
        hospitalName: null,
        documents: [],
        events: [],
        bundles: [],
        latestOcrJob: null
      }
    ]
  };
}

async function ensureDemoState() {
  await mkdir(DEMO_ROOT, { recursive: true });

  try {
    await readFile(DEMO_STATE_PATH, "utf8");
  } catch {
    await writeFile(DEMO_STATE_PATH, JSON.stringify(createInitialState(), null, 2), "utf8");
  }
}

async function readDemoState() {
  await ensureDemoState();
  const content = await readFile(DEMO_STATE_PATH, "utf8");
  return JSON.parse(content) as DemoState;
}

async function writeDemoState(state: DemoState) {
  await ensureDemoState();
  await writeFile(DEMO_STATE_PATH, JSON.stringify(state, null, 2), "utf8");
}

async function updateDemoState<T>(updater: (state: DemoState) => T | Promise<T>) {
  const state = await readDemoState();
  const result = await updater(state);
  await writeDemoState(state);
  return result;
}

function getOrCreateUser(state: DemoState, userId: string, email: string) {
  let user = state.users.find((item) => item.userId === userId);
  if (!user) {
    user = {
      userId,
      email,
      locale: "en",
      theme: "light",
      presets: []
    };
    state.users.push(user);
  }

  return user;
}

function getDemoCase(state: DemoState, caseId: string) {
  const targetCase = state.cases.find((item) => item.caseId === caseId);
  if (!targetCase) {
    throw new Error(`Demo case not found: ${caseId}`);
  }

  return targetCase;
}

function withDefaultCaseAccess() {
  return DEMO_CASE_ID;
}

function buildMockEvents(caseId: string, document: DemoDocument): CaseEvent[] {
  const createdAt = new Date().toISOString();

  return [
    caseEventSchema.parse({
      eventId: `${document.documentId}-event-1`,
      type: "visit",
      date: "2024-03-14",
      hospital: "VNEXUS Demo Medical Center",
      details: "Outpatient visit for abdominal pain and follow-up review.",
      confirmed: true,
      requiresReview: false,
      editedAt: createdAt,
      editHistory: [],
      metadata: {
        fileOrder: document.fileOrder,
        pageOrder: 1,
        anchorBlockIndex: 0,
        eventBundleId: `${document.documentId}-bundle-1`,
        sourceFileId: document.documentId,
        sourcePageId: `${document.documentId}-page-1`
      }
    }),
    caseEventSchema.parse({
      eventId: `${document.documentId}-event-2`,
      type: "exam",
      date: "2024-03-21",
      hospital: "VNEXUS Demo Medical Center",
      details: "CT exam noted inflammatory changes and recommended repeat review.",
      confirmed: false,
      requiresReview: true,
      editedAt: createdAt,
      editHistory: [],
      metadata: {
        fileOrder: document.fileOrder,
        pageOrder: 1,
        anchorBlockIndex: 1,
        eventBundleId: `${document.documentId}-bundle-2`,
        sourceFileId: document.documentId,
        sourcePageId: `${document.documentId}-page-1`
      }
    })
  ];
}

function buildMockBundles(caseId: string, events: CaseEvent[]) {
  return events.map((event, index) => ({
    id: event.metadata?.eventBundleId ?? `${caseId}-bundle-${index + 1}`,
    caseId,
    canonicalDate: event.date,
    fileOrder: event.metadata?.fileOrder ?? index + 1,
    pageOrder: event.metadata?.pageOrder ?? 1,
    primaryHospital: event.hospital,
    bundleTypeCandidate: (event.type === "exam" ? "exam" : "outpatient") as
      | "outpatient"
      | "exam"
      | "treatment"
      | "procedure"
      | "surgery"
      | "admission"
      | "discharge"
      | "pathology"
      | "mixed"
      | "unknown",
    representativeDiagnosis: event.type === "visit" ? "Abdominal pain" : null,
    representativeTest: event.type === "exam" ? "CT" : null,
    representativeTreatment: null,
    representativeProcedure: null,
    representativeSurgery: null,
    admissionStatus: null,
    ambiguityScore: event.confirmed ? 0.12 : 0.42,
    requiresReview: event.requiresReview,
    unresolvedBundleSlotsJson: {
      hospitalConflict: false,
      diagnosisConflict: false,
      mixedAtomTypes: false,
      weakGrouping: event.requiresReview,
      needsManualReview: event.requiresReview,
      notes: event.requiresReview ? ["Mock OCR flagged this item for review."] : []
    },
    atomIdsJson: [event.eventId],
    candidateSnapshotJson: {
      hospitals: [event.hospital],
      departments: [],
      diagnoses: event.type === "visit" ? ["Abdominal pain"] : [],
      tests: event.type === "exam" ? ["CT"] : [],
      treatments: [],
      procedures: [],
      surgeries: [],
      admissions: [],
      discharges: [],
      pathologies: [],
      medications: [],
      symptoms: []
    },
    createdAt: event.editedAt ?? new Date().toISOString()
  }));
}

function matchesFilter(event: CaseEvent, filter?: CaseAnalyticsFilter) {
  if (!filter) {
    return true;
  }

  if (filter.startDate && event.date < filter.startDate) {
    return false;
  }

  if (filter.endDate && event.date > filter.endDate) {
    return false;
  }

  if (filter.eventTypes?.length && !filter.eventTypes.includes(event.type)) {
    return false;
  }

  if (filter.hospitals?.length && !filter.hospitals.includes(event.hospital)) {
    return false;
  }

  return true;
}

function bucketDate(date: string, interval: CaseAnalyticsTrend["interval"]) {
  const value = new Date(`${date}T00:00:00.000Z`);

  if (interval === "monthly") {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-01`;
  }

  if (interval === "weekly") {
    const weekday = value.getUTCDay() || 7;
    value.setUTCDate(value.getUTCDate() - weekday + 1);
    return value.toISOString().slice(0, 10);
  }

  return date;
}

export async function listDemoCases() {
  const state = await readDemoState();
  return caseListJsonSchema.parse({
    items: state.cases.map((item) => ({
      caseId: item.caseId,
      hospitalName: item.hospitalName,
      uploadDate: item.documents[0]?.uploadedAt ?? item.createdAt,
      status: item.status,
      audience: item.audience,
      hasReport: item.bundles.length > 0,
      hasNarrative: item.bundles.length > 0,
      hasPdf: item.bundles.length > 0
    }))
  });
}

export async function getDemoCaseDetail(caseId: string) {
  const state = await readDemoState();
  const item = getDemoCase(state, caseId);
  return caseDetailSchema.parse({
    caseId: item.caseId,
    hospitalName: item.hospitalName,
    events: item.events
  });
}

export async function listDemoDocuments(caseId: string) {
  const state = await readDemoState();
  return getDemoCase(state, caseId).documents;
}

export async function getDemoBundles(caseId: string) {
  const state = await readDemoState();
  return getDemoCase(state, caseId).bundles;
}

export async function getDemoLatestOcrJob(caseId: string) {
  const state = await readDemoState();
  return getDemoCase(state, caseId).latestOcrJob;
}

export async function addDemoDocument(input: {
  caseId: string;
  originalFileName: string;
  mimeType: string;
  pageCount: number;
  storagePath: string;
  publicUrl: string;
}) {
  return updateDemoState((state) => {
    const targetCase = getDemoCase(state, input.caseId);
    const now = new Date().toISOString();
    const document: DemoDocument = {
      documentId: `demo-doc-${targetCase.documents.length + 1}`,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      pageCount: input.pageCount,
      fileOrder: targetCase.documents.length + 1,
      uploadedAt: now,
      storagePath: input.storagePath,
      publicUrl: input.publicUrl,
      status: "uploaded"
    };

    targetCase.documents.push(document);
    targetCase.status = "uploaded";
    targetCase.updatedAt = now;

    return document;
  });
}

export async function runDemoOcrPipeline(caseId: string) {
  return updateDemoState((state) => {
    const targetCase = getDemoCase(state, caseId);
    const latestDocument = targetCase.documents.at(-1);

    if (!latestDocument) {
      throw new Error("No uploaded document is available for mock OCR");
    }

    const now = new Date().toISOString();
    const events = buildMockEvents(caseId, latestDocument);
    const bundles = buildMockBundles(caseId, events);

    latestDocument.status = "ocr_ready";
    targetCase.events = events;
    targetCase.bundles = bundles;
    targetCase.hospitalName = bundles[0]?.primaryHospital ?? targetCase.hospitalName;
    targetCase.status = events.some((event) => event.requiresReview) ? "review_required" : "ready";
    targetCase.updatedAt = now;
    targetCase.latestOcrJob = {
      jobId: `demo-job-${Date.now()}`,
      status: "completed",
      createdAt: now,
      completedAt: now
    };

    return targetCase.latestOcrJob;
  });
}

export async function updateDemoEventConfirmation(caseId: string, eventId: string, confirmed: boolean) {
  return updateDemoState((state) => {
    const targetCase = getDemoCase(state, caseId);
    const event = targetCase.events.find((item) => item.eventId === eventId);

    if (!event) {
      throw new Error("Demo event not found");
    }

    event.confirmed = confirmed;
    event.editedAt = new Date().toISOString();
  });
}

export async function updateDemoEventDetails(caseId: string, nextEvent: CaseEvent) {
  return updateDemoState((state) => {
    const targetCase = getDemoCase(state, caseId);
    const eventIndex = targetCase.events.findIndex((item) => item.eventId === nextEvent.eventId);

    if (eventIndex < 0) {
      throw new Error("Demo event not found");
    }

    targetCase.events[eventIndex] = nextEvent;
    const bundle = targetCase.bundles.find((item) => item.id === nextEvent.metadata?.eventBundleId);
    if (bundle) {
      bundle.canonicalDate = nextEvent.date;
      bundle.primaryHospital = nextEvent.hospital;
      bundle.requiresReview = nextEvent.requiresReview;
    }

    targetCase.updatedAt = new Date().toISOString();
  });
}

export async function getDemoUserPreferences(userId: string, email = "demo@vnexus.local") {
  const state = await readDemoState();
  const user = getOrCreateUser(state, userId, email);
  await writeDemoState(state);
  return {
    locale: user.locale,
    theme: user.theme
  };
}

export async function updateDemoUserPreferences(
  userId: string,
  email: string,
  prefs: { locale?: LocaleCode; theme?: "light" | "dark" }
) {
  return updateDemoState((state) => {
    const user = getOrCreateUser(state, userId, email);
    if (prefs.locale) {
      user.locale = normalizeLocaleCode(prefs.locale);
    }

    if (prefs.theme) {
      user.theme = prefs.theme;
    }

    return {
      locale: user.locale,
      theme: user.theme
    };
  });
}

export async function getDemoAnalytics(filter?: CaseAnalyticsFilter): Promise<CaseAnalytics> {
  const state = await readDemoState();
  const filteredEvents = state.cases.flatMap((item) => item.events.filter((event) => matchesFilter(event, filter)));
  const byType: Record<string, number> = {};
  const byHospital: Record<string, number> = {};

  for (const event of filteredEvents) {
    byType[event.type] = (byType[event.type] ?? 0) + 1;
    byHospital[event.hospital] = (byHospital[event.hospital] ?? 0) + 1;
  }

  return caseAnalyticsSchema.parse({
    totalCases: state.cases.length,
    totalEvents: filteredEvents.length,
    confirmedEvents: filteredEvents.filter((event) => event.confirmed).length,
    unconfirmedEvents: filteredEvents.filter((event) => !event.confirmed).length,
    reviewRequiredEvents: filteredEvents.filter((event) => event.requiresReview).length,
    eventsByType: byType,
    eventsByHospital: byHospital,
    topHospitals: Object.entries(byHospital)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([hospital, events]) => ({ hospital, events }))
  });
}

export async function getDemoAnalyticsTrend(
  filter: CaseAnalyticsFilter | undefined,
  interval: CaseAnalyticsTrend["interval"]
): Promise<CaseAnalyticsTrend> {
  const state = await readDemoState();
  const filteredEvents = state.cases.flatMap((item) => item.events.filter((event) => matchesFilter(event, filter)));
  const buckets = new Map<string, { total: number; confirmed: number; unconfirmed: number }>();

  for (const event of filteredEvents) {
    const bucket = bucketDate(event.date, interval);
    const current = buckets.get(bucket) ?? { total: 0, confirmed: 0, unconfirmed: 0 };
    current.total += 1;
    current.confirmed += event.confirmed ? 1 : 0;
    current.unconfirmed += event.confirmed ? 0 : 1;
    buckets.set(bucket, current);
  }

  return caseAnalyticsTrendSchema.parse({
    interval,
    points: [...buckets.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, value]) => ({
        date,
        total: value.total,
        confirmed: value.confirmed,
        unconfirmed: value.unconfirmed
      }))
  });
}

export async function listDemoPresets(userId: string, email = "demo@vnexus.local") {
  const state = await readDemoState();
  const user = getOrCreateUser(state, userId, email);
  await writeDemoState(state);
  return user.presets;
}

export async function createDemoPreset(
  userId: string,
  email: string,
  input: { name: string; filter: CaseAnalyticsFilter; interval: CaseAnalyticsTrend["interval"] }
) {
  return updateDemoState((state) => {
    const user = getOrCreateUser(state, userId, email);
    if (user.presets.some((preset) => preset.name === input.name)) {
      throw new Error("A preset with this name already exists");
    }

    const preset: CaseAnalyticsPreset = {
      presetId: `demo-preset-${user.presets.length + 1}`,
      userId,
      name: input.name,
      filter: input.filter,
      interval: input.interval,
      isShared: false,
      sharedWith: [],
      createdAt: new Date().toISOString()
    };
    user.presets.push(preset);
    return preset;
  });
}

export async function deleteDemoPreset(userId: string, presetId: string) {
  return updateDemoState((state) => {
    const user = getOrCreateUser(state, userId, "demo@vnexus.local");
    user.presets = user.presets.filter((preset) => preset.presetId !== presetId);
  });
}

export function getDefaultDemoCaseId() {
  return withDefaultCaseAccess();
}
