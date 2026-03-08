export type LocaleCode = "en" | "ko";

type MessageDictionary = {
  genericUnknownDate: string;
  genericUnknownFacility: string;
  genericNoData: string;
  noTimeline: string;
  timelineRecord: string;
  timelineDetail: string;
  summaryIntro: string;
  riskSignals: string;
  checkPoints: string;
  nextActions: string;
  noSummary: string;
  investigatorUnknownDate: string;
  investigatorUnknownFacility: string;
  investigatorNoKeyDetails: string;
  investigatorSummaryTemplate: string;
  investigatorPathology: string;
  investigatorMedication: string;
  investigatorSymptom: string;
  investigatorReviewRequired: string;
  investigatorReviewNotes: string;
  pdfConfidential: string;
  pdfCaseId: string;
  pdfGeneratedAt: string;
  pdfReviewStatus: string;
  pdfReviewStatusRequiresReview: string;
  pdfReviewStatusClear: string;
  pdfSectionReviewNote: string;
  pdfNoParagraphs: string;
  pdfInvestigatorTitle: string;
  pdfInvestigatorSubject: string;
  pdfConsumerTitle: string;
  pdfConsumerSubject: string;
  uiDownloadPdf: string;
  uiLanguageLabel: string;
  uiLanguageEnglish: string;
  uiLanguageKorean: string;
  uiInvalidLanguage: string;
};

export const messages: Record<LocaleCode, MessageDictionary> = {
  en: {
    genericUnknownDate: "unknown date",
    genericUnknownFacility: "unknown facility",
    genericNoData: "no data",
    noTimeline: "No confirmed timeline summary is available yet.",
    timelineRecord: "On {date}, a visit record from {hospital} was identified.",
    timelineDetail: "On {date}, records from {hospital} show {value}.",
    summaryIntro: "Summary: {summary}.",
    riskSignals: "Risk signals: {signals}.",
    checkPoints: "Check points: {points}.",
    nextActions: "Recommended next actions: {actions}.",
    noSummary: "No consumer summary details are available yet.",
    investigatorUnknownDate: "unknown date",
    investigatorUnknownFacility: "no confirmed facility",
    investigatorNoKeyDetails: "key medical details need manual review",
    investigatorSummaryTemplate: "On {date}, at {hospital}{departmentClause}, {details}.",
    investigatorPathology: "Pathology summary: {value}.",
    investigatorMedication: "Medication summary: {value}.",
    investigatorSymptom: "Symptom summary: {value}.",
    investigatorReviewRequired: "This section requires manual review.",
    investigatorReviewNotes: "Review notes: {notes}.",
    pdfConfidential: "Confidential",
    pdfCaseId: "Case ID: {caseId}",
    pdfGeneratedAt: "Generated at: {generatedAt}",
    pdfReviewStatus: "Review status: {status}",
    pdfReviewStatusRequiresReview: "requires review",
    pdfReviewStatusClear: "clear",
    pdfSectionReviewNote: "Review note: manual review is required for this section.",
    pdfNoParagraphs: "No narrative paragraphs are available for this section.",
    pdfInvestigatorTitle: "Investigator Narrative Report - {caseId}",
    pdfInvestigatorSubject: "Investigator narrative export",
    pdfConsumerTitle: "Consumer Narrative Report - {caseId}",
    pdfConsumerSubject: "Consumer narrative export",
    uiDownloadPdf: "Download PDF",
    uiLanguageLabel: "Language",
    uiLanguageEnglish: "English",
    uiLanguageKorean: "Korean",
    uiInvalidLanguage: "Unsupported language. Use en or ko."
  },
  ko: {
    genericUnknownDate: "날짜 미확인",
    genericUnknownFacility: "기관 미확인",
    genericNoData: "자료 없음",
    noTimeline: "확인 가능한 타임라인 요약이 아직 없다.",
    timelineRecord: "{date}에 {hospital} 방문 기록이 확인되었다.",
    timelineDetail: "{date}에 {hospital} 관련 기록으로 {value}이 확인되었다.",
    summaryIntro: "핵심 요약은 {summary}이다.",
    riskSignals: "주의 신호는 {signals}이다.",
    checkPoints: "추가 확인 항목은 {points}이다.",
    nextActions: "권장 다음 단계는 {actions}이다.",
    noSummary: "표시할 소비자용 요약 정보가 아직 없다.",
    investigatorUnknownDate: "날짜 미확인",
    investigatorUnknownFacility: "기관 미확인",
    investigatorNoKeyDetails: "핵심 의료 정보는 수동 검토가 필요하다",
    investigatorSummaryTemplate: "{date}에 {hospital}{departmentClause} 관련 기록에서 {details}.",
    investigatorPathology: "병리 요약은 {value}이다.",
    investigatorMedication: "투약 요약은 {value}이다.",
    investigatorSymptom: "증상 요약은 {value}이다.",
    investigatorReviewRequired: "이 섹션은 수동 검토가 필요하다.",
    investigatorReviewNotes: "검토 메모는 {notes}이다.",
    pdfConfidential: "Confidential",
    pdfCaseId: "사건 ID: {caseId}",
    pdfGeneratedAt: "생성 시각: {generatedAt}",
    pdfReviewStatus: "검토 상태: {status}",
    pdfReviewStatusRequiresReview: "검토 필요",
    pdfReviewStatusClear: "검토 완료",
    pdfSectionReviewNote: "검토 메모: 이 섹션은 수동 검토가 필요하다.",
    pdfNoParagraphs: "이 섹션에 표시할 내러티브 문단이 아직 없다.",
    pdfInvestigatorTitle: "조사자 내러티브 보고서 - {caseId}",
    pdfInvestigatorSubject: "조사자 내러티브 내보내기",
    pdfConsumerTitle: "소비자 내러티브 보고서 - {caseId}",
    pdfConsumerSubject: "소비자 내러티브 내보내기",
    uiDownloadPdf: "PDF 다운로드",
    uiLanguageLabel: "언어",
    uiLanguageEnglish: "영어",
    uiLanguageKorean: "한국어",
    uiInvalidLanguage: "지원하지 않는 언어이다. en 또는 ko를 사용해야 한다."
  }
};

export function formatMessage(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return value === "en" || value === "ko";
}
