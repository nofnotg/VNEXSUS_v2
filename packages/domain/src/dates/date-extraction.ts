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

const DATE_PATTERNS = [
  /(?<!\d)(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/g,
  /(?<!\d)(\d{2})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/g,
  /(?<!\d)(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일(?!\d)/g,
  /(?<!\d)(\d{2})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일(?!\d)/g
];

const ADMIN_KEYWORDS = ["발급", "작성일", "보험", "접수", "서류", "페이지", "page"];
const PLAN_KEYWORDS = ["예약", "예정", "추후 방문", "next visit", "follow up"];
const BIRTH_KEYWORDS = ["생년월일", "출생", "주민등록", "년생", "dob", "birth"];
const EXAM_KEYWORDS = ["검사", "검진", "촬영", "내시경", "초음파", "ct", "mri", "x-ray"];
const REPORT_KEYWORDS = ["결과", "보고", "판독", "소견"];
const PATHOLOGY_KEYWORDS = ["병리", "조직"];
const SURGERY_KEYWORDS = ["수술", "시술"];
const ADMISSION_KEYWORDS = ["입원", "재원"];
const DISCHARGE_KEYWORDS = ["퇴원"];
const CLINICAL_ANCHOR_KEYWORDS = [
  ...EXAM_KEYWORDS,
  ...PATHOLOGY_KEYWORDS,
  ...SURGERY_KEYWORDS,
  ...ADMISSION_KEYWORDS,
  ...DISCHARGE_KEYWORDS,
  ...REPORT_KEYWORDS,
  "진료",
  "외래",
  "병원",
  "의원",
  "센터",
  "진단",
  "치료",
  "약"
] as const;

const MIN_YEAR = 1900;

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
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

function inferDateTypeCandidate(textRaw: string): DateTypeCandidate {
  const lower = textRaw.toLowerCase();

  if (hasAnyKeyword(lower, BIRTH_KEYWORDS)) {
    return "irrelevant";
  }

  if (hasAnyKeyword(lower, ADMIN_KEYWORDS)) {
    return "admin";
  }

  if (hasAnyKeyword(lower, PLAN_KEYWORDS)) {
    return "plan";
  }

  if (hasAnyKeyword(lower, PATHOLOGY_KEYWORDS)) {
    return "pathology";
  }

  if (hasAnyKeyword(lower, SURGERY_KEYWORDS)) {
    return "surgery";
  }

  if (hasAnyKeyword(lower, ADMISSION_KEYWORDS)) {
    return "admission";
  }

  if (hasAnyKeyword(lower, DISCHARGE_KEYWORDS)) {
    return "discharge";
  }

  if (hasAnyKeyword(lower, REPORT_KEYWORDS)) {
    return "report";
  }

  if (hasAnyKeyword(lower, EXAM_KEYWORDS)) {
    return "exam";
  }

  return "visit";
}

function inferConfidence(rawDateText: string, dateTypeCandidate: DateTypeCandidate) {
  let confidence = rawDateText.length >= 8 ? 0.92 : 0.84;

  if (dateTypeCandidate === "admin") {
    confidence = 0.55;
  } else if (dateTypeCandidate === "plan") {
    confidence = 0.68;
  } else if (dateTypeCandidate === "irrelevant") {
    confidence = 0.4;
  }

  return confidence;
}

function hasClinicalAnchors(textRaw: string) {
  return hasAnyKeyword(textRaw.toLowerCase(), CLINICAL_ANCHOR_KEYWORDS);
}

function shouldKeepDateCandidate(textRaw: string, dateTypeCandidate: DateTypeCandidate) {
  if (dateTypeCandidate === "irrelevant") {
    return false;
  }

  if (dateTypeCandidate === "visit" && !hasClinicalAnchors(textRaw)) {
    return false;
  }

  return true;
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
      const dateTypeCandidate = inferDateTypeCandidate(normalizedText);
      if (!shouldKeepDateCandidate(normalizedText, dateTypeCandidate)) {
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
        confidence: inferConfidence(match.rawDateText, dateTypeCandidate)
      });
    })
    .filter((candidate): candidate is DateCandidateInput => candidate !== null);
}
