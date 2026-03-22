import { dateCandidateSchema, type DateCandidateInput } from "@vnexus/shared";

export type DateExtractionBlockInput = {
  caseId: string;
  sourceFileId: string;
  sourcePageId: string;
  fileOrder: number;
  pageOrder: number;
  blockIndex: number;
  textRaw: string;
};

type DateTypeCandidate = DateCandidateInput["dateTypeCandidate"] | "irrelevant";

type CandidateContext = {
  local: string;
  before: string;
  after: string;
};

type DateCandidateWithSignature = {
  candidate: DateCandidateInput;
  repetitiveInpatientLogKey: string | null;
};

const DATE_PATTERNS = [
  /(?<!\d)(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/g,
  /(?<!\d)(\d{4})(\d{2})(\d{2})(?!\d)/g,
  /(?<!\d)(\d{2})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/g,
  /(?<!\d)(\d{4})\s*\uB144\s*(\d{1,2})\s*\uC6D4\s*(\d{1,2})\s*\uC77C(?!\d)/g,
  /(?<!\d)(\d{2})\s*\uB144\s*(\d{1,2})\s*\uC6D4\s*(\d{1,2})\s*\uC77C(?!\d)/g
];

const ADMIN_KEYWORDS = [
  "\uBC1C\uAE09",
  "\uC791\uC131",
  "\uBCF4\uD5D8",
  "\uC811\uC218",
  "\uC11C\uB958",
  "\uD398\uC774\uC9C0",
  "page"
] as const;
const PLAN_KEYWORDS = ["\uC608\uC57D", "\uC608\uC815", "\uCD94\uD6C4 \uBC29\uBB38", "next visit", "follow up"] as const;
const CLINICAL_DATE_LABEL_KEYWORDS = [
  "\uC9C4\uB8CC\uC77C\uC790",
  "\uC9C4\uB8CC\uAE30\uAC04",
  "\uC9C4\uB8CC\uC2DC\uC791\uC77C",
  "\uC9C4\uB8CC\uC885\uB8CC\uC77C",
  "\uAC80\uC0AC\uC77C",
  "\uC218\uC220\uC77C",
  "\uC2DC\uD589\uC77C",
  "\uC785\uC6D0\uC77C",
  "\uD1F4\uC6D0\uC77C",
  "\uC678\uB798",
  "\uCD08\uC9C4",
  "\uC7AC\uC9C4"
] as const;
const BIRTH_KEYWORDS = [
  "\uC0DD\uB144\uC6D4\uC77C",
  "\uCD9C\uC0DD",
  "\uC8FC\uBBFC\uB4F1\uB85D",
  "\uC5F0\uB839",
  "dob",
  "birth"
] as const;
const EXAM_KEYWORDS = [
  "\uAC80\uC0AC",
  "\uAC80\uC9C4",
  "\uCD08\uC74C\uD30C",
  "\uB0B4\uC2DC\uACBD",
  "ct",
  "mri",
  "x-ray"
] as const;
const REPORT_KEYWORDS = ["\uACB0\uACFC", "\uBCF4\uACE0", "\uD310\uB3C5", "\uC694\uC57D"] as const;
const PATHOLOGY_KEYWORDS = ["\uBCD1\uB9AC", "\uC870\uC9C1"] as const;
const SURGERY_KEYWORDS = ["\uC218\uC220", "\uC2DC\uC220"] as const;
const ADMISSION_KEYWORDS = ["\uC785\uC6D0"] as const;
const DISCHARGE_KEYWORDS = ["\uD1F4\uC6D0"] as const;
const CLINICAL_ANCHOR_KEYWORDS = [
  ...EXAM_KEYWORDS,
  ...PATHOLOGY_KEYWORDS,
  ...SURGERY_KEYWORDS,
  ...ADMISSION_KEYWORDS,
  ...DISCHARGE_KEYWORDS,
  ...REPORT_KEYWORDS,
  "\uC9C4\uB8CC",
  "\uC678\uB798",
  "\uBCD1\uC6D0",
  "\uC758\uC6D0",
  "\uC13C\uD130",
  "\uC9C4\uB2E8",
  "\uCE58\uB8CC",
  "\uCC98\uCE58"
] as const;
const METADATA_KEYWORDS = [
  "page",
  "tel",
  "fax",
  "address",
  "\uBCF4\uD5D8",
  "\uCCAD\uAD6C",
  "\uBC1C\uAE09",
  "\uCD9C\uB825",
  "\uC778\uC801",
  "\uB4F1\uB85D\uBC88\uD638",
  "\uCC28\uD2B8\uBC88\uD638"
] as const;
const STRONG_METADATA_KEYWORDS = [
  "pid",
  "date:",
  "assurance",
  "\uC5F4\uB78C\uB300\uC0C1\uAE30\uAC04",
  "\uD310\uB3C5\uC77C\uC2DC",
  "\uC791\uC131\uC77C\uC2DC",
  "\uCC98\uBC29\uC804\uAD50\uBD80\uBC88\uD638",
  "\uC0AC\uC5C5\uC7A5\uAE30\uD638",
  "\uC870\uD569\uBA85\uCE6D",
  "\uD658\uC790\uBC88\uD638",
  "\uD1F4\uC6D0\uC608\uC815\uC77C",
  "care plan"
] as const;

const MIN_YEAR = 1900;
const CONTEXT_RADIUS = 40;
const INPATIENT_LOG_BEFORE_RADIUS = 20;
const INPATIENT_LOG_AFTER_RADIUS = 8;

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractCandidateContext(text: string, index: number, length: number): CandidateContext {
  const start = Math.max(0, index - CONTEXT_RADIUS);
  const end = Math.min(text.length, index + length + CONTEXT_RADIUS);
  return {
    local: text.slice(start, end),
    before: text.slice(start, index),
    after: text.slice(index + length, end)
  };
}

function toFourDigitYear(year: string) {
  if (year.length === 4) {
    return Number(year);
  }

  const twoDigitYear = Number(year);
  return twoDigitYear >= 50 ? 1900 + twoDigitYear : 2000 + twoDigitYear;
}

function isValidDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function isPlausibleYear(year: number) {
  const currentYear = new Date().getUTCFullYear();
  return year >= MIN_YEAR && year <= currentYear + 1;
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function hasAnyKeyword(haystack: string, keywords: readonly string[]) {
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function hasClinicalAnchors(textRaw: string) {
  return hasAnyKeyword(textRaw.toLowerCase(), [...CLINICAL_ANCHOR_KEYWORDS, ...CLINICAL_DATE_LABEL_KEYWORDS]);
}

function hasClinicalDateLabelNearCandidate(context: CandidateContext) {
  return hasAnyKeyword(context.local.toLowerCase(), CLINICAL_DATE_LABEL_KEYWORDS);
}

function hasMetadataNoise(context: CandidateContext) {
  const haystack = `${context.before.toLowerCase()} ${context.local.toLowerCase()} ${context.after.toLowerCase()}`;
  return hasAnyKeyword(haystack, METADATA_KEYWORDS);
}

function hasStrongMetadataMarkerNearCandidate(context: CandidateContext) {
  const haystack = `${context.before.toLowerCase()} ${context.local.toLowerCase()} ${context.after.toLowerCase()}`;
  return hasAnyKeyword(haystack, STRONG_METADATA_KEYWORDS);
}

function hasBirthMarkerNearCandidate(context: CandidateContext) {
  const immediateBefore = context.before.slice(-14).toLowerCase();
  const immediateAfter = context.after.slice(0, 14).toLowerCase();
  return hasAnyKeyword(`${immediateBefore} ${immediateAfter}`, BIRTH_KEYWORDS);
}

function inferDateTypeCandidate(textRaw: string, context: CandidateContext): DateTypeCandidate {
  const lower = textRaw.toLowerCase();
  const local = context.local.toLowerCase();

  if (hasBirthMarkerNearCandidate(context)) {
    return "irrelevant";
  }

  if (hasAnyKeyword(local, BIRTH_KEYWORDS) && !hasClinicalAnchors(local)) {
    return "irrelevant";
  }

  if (hasAnyKeyword(local, PATHOLOGY_KEYWORDS)) {
    return "pathology";
  }

  if (hasAnyKeyword(local, SURGERY_KEYWORDS)) {
    return "surgery";
  }

  if (hasAnyKeyword(local, ADMISSION_KEYWORDS)) {
    return "admission";
  }

  if (hasAnyKeyword(local, DISCHARGE_KEYWORDS)) {
    return "discharge";
  }

  if (hasAnyKeyword(local, REPORT_KEYWORDS)) {
    return "report";
  }

  if (hasAnyKeyword(local, EXAM_KEYWORDS)) {
    return "exam";
  }

  if (hasAnyKeyword(local, PLAN_KEYWORDS) && !hasClinicalAnchors(local)) {
    return "plan";
  }

  if (hasAnyKeyword(local, ADMIN_KEYWORDS) && !hasClinicalAnchors(local)) {
    return "admin";
  }

  if (hasClinicalAnchors(local) || hasClinicalAnchors(lower)) {
    return "visit";
  }

  if (hasAnyKeyword(lower, PLAN_KEYWORDS)) {
    return "plan";
  }

  if (hasAnyKeyword(lower, ADMIN_KEYWORDS)) {
    return "admin";
  }

  return "visit";
}

function inferConfidence(rawDateText: string, dateTypeCandidate: DateTypeCandidate, context: CandidateContext) {
  let confidence = rawDateText.length >= 8 ? 0.92 : 0.84;

  if (dateTypeCandidate === "admin") {
    confidence = 0.55;
  } else if (dateTypeCandidate === "plan") {
    confidence = 0.68;
  } else if (dateTypeCandidate === "irrelevant") {
    confidence = 0.4;
  }

  if (hasClinicalAnchors(context.local)) {
    confidence += 0.04;
  }

  if (hasClinicalDateLabelNearCandidate(context)) {
    confidence += 0.03;
  }

  if (hasMetadataNoise(context) && !hasClinicalAnchors(context.local) && !hasClinicalDateLabelNearCandidate(context)) {
    confidence -= 0.18;
  }

  if (hasStrongMetadataMarkerNearCandidate(context) && !hasClinicalDateLabelNearCandidate(context)) {
    confidence -= 0.12;
  }

  return Math.max(0.35, Math.min(0.98, Number(confidence.toFixed(2))));
}

function hasOutpatientScheduleNoise(textRaw: string, context: CandidateContext, dateTypeCandidate: DateTypeCandidate) {
  if (dateTypeCandidate !== "visit") {
    return false;
  }

  const haystack = `${textRaw} ${context.local}`.toLowerCase();
  const hasScheduleTimeRange = /\d{1,2}\s*:\s*\d{2}(?:\.\d+)?\s*\/\s*\d{1,2}\s*:\s*\d{2}(?:\.\d+)?/.test(haystack);
  const hasOutpatientLogMarkers =
    haystack.includes("공단") &&
    (haystack.includes("초진") || haystack.includes("재진")) &&
    (haystack.includes("progress") || haystack.includes("order list") || haystack.includes("dr."));

  return hasScheduleTimeRange && hasOutpatientLogMarkers;
}

function shouldKeepDateCandidate(textRaw: string, context: CandidateContext, dateTypeCandidate: DateTypeCandidate) {
  if (dateTypeCandidate === "irrelevant") {
    return false;
  }

  if (dateTypeCandidate === "admin" && !hasClinicalAnchors(context.local)) {
    return false;
  }

  if (dateTypeCandidate === "plan" && !hasClinicalDateLabelNearCandidate(context) && !hasClinicalAnchors(context.local)) {
    return false;
  }

  if (dateTypeCandidate === "visit" && !hasClinicalAnchors(context.local) && !hasClinicalAnchors(textRaw)) {
    return false;
  }

  if (hasOutpatientScheduleNoise(textRaw, context, dateTypeCandidate)) {
    return false;
  }

  if (
    hasStrongMetadataMarkerNearCandidate(context) &&
    !hasClinicalDateLabelNearCandidate(context) &&
    !hasClinicalAnchors(context.local)
  ) {
    return false;
  }

  if (hasMetadataNoise(context) && !hasClinicalAnchors(context.local) && !hasClinicalDateLabelNearCandidate(context)) {
    return false;
  }

  return true;
}

function buildBlockKey(block: Pick<DateExtractionBlockInput, "sourceFileId" | "sourcePageId" | "blockIndex">) {
  return `${block.sourceFileId}:${block.sourcePageId}:${block.blockIndex}`;
}

function buildCandidateKey(candidate: DateCandidateInput) {
  return `${candidate.sourceFileId}:${candidate.sourcePageId}:${candidate.blockIndex}:${candidate.normalizedDate}:${candidate.rawDateText}`;
}

function collectNearbyBlockText(
  blocksOnPage: DateExtractionBlockInput[],
  anchorBlockIndex: number,
  beforeRadius = INPATIENT_LOG_BEFORE_RADIUS,
  afterRadius = INPATIENT_LOG_AFTER_RADIUS
) {
  return normalizeWhitespace(
    blocksOnPage
      .filter(
        (block) =>
          block.blockIndex >= anchorBlockIndex - beforeRadius && block.blockIndex <= anchorBlockIndex + afterRadius
      )
      .map((block) => block.textRaw)
      .join(" ")
  );
}

function extractClinicalPeriodKey(text: string) {
  const match = text.match(
    /진료\s*기간\s*:\s*(\d{4})\s*[./-]?\s*(\d{1,2})\s*[./-]?\s*(\d{1,2})\s*~\s*(\d{4})\s*[./-]?\s*(\d{1,2})\s*[./-]?\s*(\d{1,2})/
  );
  if (!match) {
    return null;
  }

  const [, startYear, startMonth, startDay, endYear, endMonth, endDay] = match;
  return [
    toIsoDate(Number(startYear), Number(startMonth), Number(startDay)),
    toIsoDate(Number(endYear), Number(endMonth), Number(endDay))
  ].join("~");
}

function getRepetitiveInpatientLogKey(
  candidate: DateCandidateInput,
  blockByKey: Map<string, DateExtractionBlockInput>,
  blocksByPage: Map<string, DateExtractionBlockInput[]>
) {
  if (candidate.dateTypeCandidate !== "visit") {
    return null;
  }

  const anchorBlock = blockByKey.get(buildBlockKey(candidate));
  if (!anchorBlock) {
    return null;
  }

  const pageKey = `${candidate.sourceFileId}:${candidate.sourcePageId}`;
  const blocksOnPage = blocksByPage.get(pageKey) ?? [];
  const nearbyText = collectNearbyBlockText(blocksOnPage, candidate.blockIndex).toLowerCase();
  const hasRepetitiveInpatientSignature =
    nearbyText.includes("진료 기간") &&
    nearbyText.includes("병실") &&
    nearbyText.includes("nicu") &&
    nearbyText.includes("입원") &&
    nearbyText.includes("진료 일자") &&
    nearbyText.includes("검사 일시") &&
    nearbyText.includes("판독 일시");

  if (!hasRepetitiveInpatientSignature) {
    return null;
  }

  const periodKey = extractClinicalPeriodKey(nearbyText);
  return `${candidate.sourceFileId}:${periodKey ?? "no-period"}`;
}

function filterDocumentLocalDateCandidates(
  blocks: DateExtractionBlockInput[],
  candidates: DateCandidateInput[]
) {
  const blockByKey = new Map(blocks.map((block) => [buildBlockKey(block), block]));
  const blocksByPage = new Map<string, DateExtractionBlockInput[]>();

  for (const block of blocks) {
    const pageKey = `${block.sourceFileId}:${block.sourcePageId}`;
    const existing = blocksByPage.get(pageKey);
    if (existing) {
      existing.push(block);
    } else {
      blocksByPage.set(pageKey, [block]);
    }
  }

  const candidateSignatures: DateCandidateWithSignature[] = candidates.map((candidate) => ({
    candidate,
    repetitiveInpatientLogKey: getRepetitiveInpatientLogKey(candidate, blockByKey, blocksByPage)
  }));

  const earliestDateBySignature = new Map<string, string>();
  for (const item of candidateSignatures) {
    if (!item.repetitiveInpatientLogKey) {
      continue;
    }

    const currentEarliest = earliestDateBySignature.get(item.repetitiveInpatientLogKey);
    if (!currentEarliest || item.candidate.normalizedDate.localeCompare(currentEarliest) < 0) {
      earliestDateBySignature.set(item.repetitiveInpatientLogKey, item.candidate.normalizedDate);
    }
  }

  return candidateSignatures
    .filter((item) => {
      if (!item.repetitiveInpatientLogKey) {
        return true;
      }

      return earliestDateBySignature.get(item.repetitiveInpatientLogKey) === item.candidate.normalizedDate;
    })
    .map((item) => item.candidate)
    .filter(
      (candidate, index, allCandidates) =>
        allCandidates.findIndex((item) => buildCandidateKey(item) === buildCandidateKey(candidate)) === index
    );
}

export function extractDateCandidatesFromBlock(input: DateExtractionBlockInput): DateCandidateInput[] {
  const normalizedText = normalizeWhitespace(input.textRaw);
  const matches: Array<{ index: number; rawDateText: string; normalizedDate: string }> = [];

  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;

    for (const match of normalizedText.matchAll(pattern)) {
      const [rawDateText, yearText, monthText, dayText] = match;
      if (!rawDateText || !yearText || !monthText || !dayText) {
        continue;
      }

      const year = toFourDigitYear(yearText);
      const month = Number(monthText);
      const day = Number(dayText);

      if (!isValidDate(year, month, day) || !isPlausibleYear(year)) {
        continue;
      }

      matches.push({
        index: match.index ?? 0,
        rawDateText,
        normalizedDate: toIsoDate(year, month, day)
      });
    }
  }

  const uniqueMatches = [
    ...new Map(
      matches
        .sort((a, b) => a.index - b.index)
        .map((item) => [`${item.index}:${item.rawDateText}:${item.normalizedDate}`, item])
    ).values()
  ];

  return uniqueMatches
    .map((match) => {
      const candidateContext = extractCandidateContext(normalizedText, match.index, match.rawDateText.length);
      const dateTypeCandidate = inferDateTypeCandidate(normalizedText, candidateContext);
      if (!shouldKeepDateCandidate(normalizedText, candidateContext, dateTypeCandidate)) {
        return null;
      }

      return dateCandidateSchema.parse({
        caseId: input.caseId,
        sourceFileId: input.sourceFileId,
        sourcePageId: input.sourcePageId,
        fileOrder: input.fileOrder,
        pageOrder: input.pageOrder,
        blockIndex: input.blockIndex,
        rawDateText: match.rawDateText,
        normalizedDate: match.normalizedDate,
        dateTypeCandidate,
        confidence: inferConfidence(match.rawDateText, dateTypeCandidate, candidateContext)
      });
    })
    .filter((candidate): candidate is DateCandidateInput => candidate !== null);
}

export function extractDateCandidatesFromDocument(blocks: DateExtractionBlockInput[]) {
  const sortedBlocks = [...blocks].sort((a, b) => {
    if (a.fileOrder !== b.fileOrder) return a.fileOrder - b.fileOrder;
    if (a.pageOrder !== b.pageOrder) return a.pageOrder - b.pageOrder;
    return a.blockIndex - b.blockIndex;
  });

  const extractedCandidates = sortedBlocks.flatMap((block) => extractDateCandidatesFromBlock(block));
  return filterDocumentLocalDateCandidates(sortedBlocks, extractedCandidates);
}
