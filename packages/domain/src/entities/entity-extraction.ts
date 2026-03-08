import { entityCandidateSchema, type DateCandidateResponseContract, type EntityCandidateInput } from "@vnexus/shared";

export type EntityExtractionBlockInput = {
  caseId: string;
  sourceFileId: string;
  sourcePageId: string;
  fileOrder: number;
  pageOrder: number;
  blockIndex: number;
  textRaw: string;
  textNormalized?: string;
};

export type EntityExtractionInput = {
  ocrBlocks: EntityExtractionBlockInput[];
  dateCandidates: Array<
    Pick<
      DateCandidateResponseContract,
      "id" | "caseId" | "sourceFileId" | "sourcePageId" | "fileOrder" | "pageOrder" | "blockIndex"
    >
  >;
};

const HOSPITAL_PATTERN =
  /([A-Za-z0-9가-힣 ]{2,40}?(?:대학병원|종합병원|병원|의원|한의원|클리닉|센터))/g;
const ICD_CODE_PATTERN = /\b[A-Z]\d{2}(?:\.\d+)?\b/g;

const DEPARTMENTS = [
  "내과",
  "외과",
  "정형외과",
  "신경외과",
  "산부인과",
  "이비인후과",
  "피부과",
  "영상의학과",
  "병리과",
  "응급의학과",
  "재활의학과"
] as const;

const TEST_KEYWORDS = ["검사", "CT", "MRI", "X-ray", "초음파", "혈액검사", "병리검사", "조직검사", "내시경"] as const;
const TREATMENT_KEYWORDS = ["치료", "처치"] as const;
const PROCEDURE_KEYWORDS = ["시술", "절제", "봉합", "고정술", "삽입술"] as const;
const SURGERY_KEYWORDS = ["수술"] as const;
const ADMISSION_KEYWORDS = ["입원", "전원", "입퇴원"] as const;
const DISCHARGE_KEYWORDS = ["퇴원"] as const;
const PATHOLOGY_KEYWORDS = ["병리", "조직", "검체", "슬라이드"] as const;
const MEDICATION_KEYWORDS = ["처방", "투약", "약물", "복용"] as const;
const SYMPTOM_KEYWORDS = ["통증", "발열", "기침", "부종", "마비", "어지럼"] as const;
const DIAGNOSIS_KEYWORDS = ["진단", "의증", "의심", "병명", "상병", "주상병", "부상병"] as const;
const ADMIN_KEYWORDS = ["접수", "원무", "보험", "서류", "행정", "발급"] as const;
const UNKNOWN_KEYWORDS = ["기타", "비고", "참고", "unknown"] as const;

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildCandidate(params: {
  block: EntityExtractionBlockInput;
  candidateType: EntityCandidateInput["candidateType"];
  rawText: string;
  normalizedText?: string;
  confidence: number;
  relatedDateCandidateId?: string | null;
  metadataJson?: Record<string, unknown>;
}) {
  return entityCandidateSchema.parse({
    caseId: params.block.caseId,
    sourceFileId: params.block.sourceFileId,
    sourcePageId: params.block.sourcePageId,
    relatedDateCandidateId: params.relatedDateCandidateId ?? null,
    fileOrder: params.block.fileOrder,
    pageOrder: params.block.pageOrder,
    blockIndex: params.block.blockIndex,
    candidateType: params.candidateType,
    rawText: params.rawText,
    normalizedText: params.normalizedText ?? normalizeText(params.rawText),
    confidence: params.confidence,
    metadataJson: params.metadataJson ?? null
  });
}

function findRelatedDateCandidateId(
  block: EntityExtractionBlockInput,
  dateCandidates: EntityExtractionInput["dateCandidates"]
) {
  const related = dateCandidates
    .filter(
      (candidate) =>
        candidate.caseId === block.caseId &&
        candidate.sourceFileId === block.sourceFileId &&
        candidate.sourcePageId === block.sourcePageId &&
        Math.abs(candidate.blockIndex - block.blockIndex) <= 2
    )
    .sort((a, b) => Math.abs(a.blockIndex - block.blockIndex) - Math.abs(b.blockIndex - block.blockIndex))[0];

  return related?.id ?? null;
}

function collectKeywordCandidates(
  block: EntityExtractionBlockInput,
  dateCandidates: EntityExtractionInput["dateCandidates"],
  keywords: readonly string[],
  candidateType: EntityCandidateInput["candidateType"],
  confidence: number
) {
  const normalizedBlock = normalizeText(block.textRaw);
  const relatedDateCandidateId = findRelatedDateCandidateId(block, dateCandidates);

  return keywords
    .filter((keyword) => normalizedBlock.toLowerCase().includes(keyword.toLowerCase()))
    .map((keyword) =>
      buildCandidate({
        block,
        candidateType,
        rawText: keyword,
        normalizedText: keyword,
        confidence,
        relatedDateCandidateId
      })
    );
}

export function extractEntityCandidates(input: EntityExtractionInput): EntityCandidateInput[] {
  const candidates: EntityCandidateInput[] = [];

  for (const block of input.ocrBlocks) {
    const normalizedBlock = normalizeText(block.textNormalized ?? block.textRaw);
    const relatedDateCandidateId = findRelatedDateCandidateId(block, input.dateCandidates);

    for (const match of normalizedBlock.matchAll(HOSPITAL_PATTERN)) {
      const rawText = match[1];
      if (!rawText) {
        continue;
      }

      candidates.push(
        buildCandidate({
          block,
          candidateType: "hospital",
          rawText,
          confidence: 0.88,
          relatedDateCandidateId
        })
      );
    }

    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, DEPARTMENTS, "department", 0.86));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, TEST_KEYWORDS, "test", 0.84));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, TREATMENT_KEYWORDS, "treatment", 0.82));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, PROCEDURE_KEYWORDS, "procedure", 0.82));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, SURGERY_KEYWORDS, "surgery", 0.86));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, ADMISSION_KEYWORDS, "admission", 0.8));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, DISCHARGE_KEYWORDS, "discharge", 0.8));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, PATHOLOGY_KEYWORDS, "pathology", 0.84));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, MEDICATION_KEYWORDS, "medication", 0.8));
    candidates.push(...collectKeywordCandidates(block, input.dateCandidates, SYMPTOM_KEYWORDS, "symptom", 0.78));

    const diagnosisTriggered = DIAGNOSIS_KEYWORDS.some((keyword) =>
      normalizedBlock.toLowerCase().includes(keyword.toLowerCase())
    );
    const icdCodes = [...normalizedBlock.matchAll(ICD_CODE_PATTERN)].map((match) => match[0]).filter(Boolean);
    if (diagnosisTriggered || icdCodes.length > 0) {
      candidates.push(
        buildCandidate({
          block,
          candidateType: "diagnosis",
          rawText: normalizedBlock,
          confidence: diagnosisTriggered ? 0.85 : 0.74,
          relatedDateCandidateId,
          ...(icdCodes.length > 0 ? { metadataJson: { icdCodes } } : {})
        })
      );
    }

    if (ADMIN_KEYWORDS.some((keyword) => normalizedBlock.toLowerCase().includes(keyword.toLowerCase()))) {
      candidates.push(
        buildCandidate({
          block,
          candidateType: "admin",
          rawText: normalizedBlock,
          confidence: 0.52,
          relatedDateCandidateId
        })
      );
    } else if (
      UNKNOWN_KEYWORDS.some((keyword) => normalizedBlock.toLowerCase().includes(keyword.toLowerCase()))
    ) {
      candidates.push(
        buildCandidate({
          block,
          candidateType: "unknown",
          rawText: normalizedBlock,
          confidence: 0.4,
          relatedDateCandidateId
        })
      );
    }
  }

  return [...new Map(candidates.map((candidate) => [`${candidate.fileOrder}:${candidate.pageOrder}:${candidate.blockIndex}:${candidate.candidateType}:${candidate.normalizedText}`, candidate])).values()];
}
