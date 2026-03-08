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

const DATE_PATTERNS = [
  /(?<!\d)(\d{4})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/g,
  /(?<!\d)(\d{2})[./-](\d{1,2})[./-](\d{1,2})(?!\d)/g,
  /(?<!\d)(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일(?!\d)/g
];

const ADMIN_KEYWORDS = ["발급", "행정", "보험", "접수", "원무", "민원", "서류", "출력", "페이지", "page"];
const PLAN_KEYWORDS = ["예약", "예정"];
const EXAM_KEYWORDS = ["검사", "검진", "촬영", "내시경", "초음파", "ct", "mri"];
const REPORT_KEYWORDS = ["결과", "보고", "판독", "소견"];
const PATHOLOGY_KEYWORDS = ["병리", "조직"];
const SURGERY_KEYWORDS = ["수술", "시술"];
const ADMISSION_KEYWORDS = ["입원"];
const DISCHARGE_KEYWORDS = ["퇴원"];

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

function toIsoDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

function inferDateTypeCandidate(textRaw: string): DateCandidateInput["dateTypeCandidate"] {
  const lower = textRaw.toLowerCase();

  if (ADMIN_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "admin";
  }

  if (PLAN_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "plan";
  }

  if (PATHOLOGY_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "pathology";
  }

  if (SURGERY_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "surgery";
  }

  if (ADMISSION_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "admission";
  }

  if (DISCHARGE_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "discharge";
  }

  if (REPORT_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "report";
  }

  if (EXAM_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()))) {
    return "exam";
  }

  return "visit";
}

function inferConfidence(rawDateText: string, dateTypeCandidate: DateCandidateInput["dateTypeCandidate"]) {
  let confidence = rawDateText.length >= 8 ? 0.92 : 0.84;

  if (dateTypeCandidate === "admin") {
    confidence = 0.55;
  } else if (dateTypeCandidate === "plan") {
    confidence = 0.8;
  }

  return confidence;
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

      if (!isValidDate(year, month, day)) {
        continue;
      }

      matches.push({
        index: match.index ?? 0,
        rawDateText,
        normalizedDate: toIsoDate(year, month, day)
      });
    }
  }

  const uniqueMatches = [...new Map(matches.sort((a, b) => a.index - b.index).map((item) => [`${item.index}:${item.rawDateText}`, item])).values()];

  return uniqueMatches.map((match) => {
    const dateTypeCandidate = inferDateTypeCandidate(normalizedText);

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
  });
}
