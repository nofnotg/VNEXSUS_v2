export type LocaleCode = "en" | "ko";

export type MessageDictionary = {
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
  uiHome: string;
  uiSignIn: string;
  uiDashboard: string;
  uiCases: string;
  uiSettings: string;
  uiLocaleSelectLabel: string;
  uiInvestigatorNarrativeHeading: string;
  uiConsumerNarrativeHeading: string;
  uiInvestigatorNarrativeSubheading: string;
  uiConsumerNarrativeSubheading: string;
  uiAuthRequiredNarrative: string;
  uiInvestigatorNarrativeRoleRequired: string;
  uiConsumerNarrativeRoleRequired: string;
  uiInvestigatorNarrativeRoleBlocked: string;
  uiConsumerNarrativeRoleBlocked: string;
  uiLoadingInvestigatorNarrative: string;
  uiLoadingConsumerNarrative: string;
  uiNoInvestigatorNarrative: string;
  uiNoConsumerNarrative: string;
  uiManualReviewRequired: string;
  uiReviewed: string;
  uiAdditionalReviewRecommended: string;
  uiClear: string;
  uiInvestigatorReportHeading: string;
  uiConsumerReportHeading: string;
  uiInvestigatorReportSubheading: string;
  uiConsumerReportSubheading: string;
  uiAuthRequiredReport: string;
  uiInvestigatorReportRoleRequired: string;
  uiConsumerReportRoleRequired: string;
  uiInvestigatorReportRoleBlocked: string;
  uiConsumerReportRoleBlocked: string;
  uiLoadingInvestigatorReport: string;
  uiLoadingConsumerReport: string;
  uiNoInvestigatorReport: string;
  uiNoConsumerReport: string;
  uiCaseLabel: string;
  uiGeneratedLabel: string;
  uiReviewLabel: string;
  uiReviewRequiredShort: string;
  uiReviewClearShort: string;
  uiUntitledSection: string;
  uiNoStructuredEntries: string;
  uiReviewNotePending: string;
  uiTimelineFallbackTitle: string;
  uiTimelineFallbackItem: string;
  uiNoTimelineItems: string;
  uiOverviewFallbackTitle: string;
  uiNoOverviewItems: string;
  uiRiskSignalsHeading: string;
  uiCheckPointsHeading: string;
  uiNextActionsHeading: string;
  uiNoRiskSignals: string;
  uiNoCheckPoints: string;
  uiNoNextActions: string;
  uiRiskSignalFallback: string;
  uiCheckPointFallback: string;
  uiNextActionFallback: string;
  uiCasesHeading: string;
  uiCasesSubheading: string;
  uiCasesEmpty: string;
  uiCasesLoading: string;
  uiCasesLoadError: string;
  uiCaseIdColumn: string;
  uiUploadDateColumn: string;
  uiHospitalColumn: string;
  uiStatusColumn: string;
  uiAudienceColumn: string;
  uiActionsColumn: string;
  uiActionReport: string;
  uiActionNarrative: string;
  uiActionPdf: string;
  uiStatusReady: string;
  uiStatusProcessing: string;
  uiStatusReviewRequired: string;
  uiStatusDraft: string;
  uiAudienceConsumer: string;
  uiAudienceInvestigator: string;
  uiSettingsHeading: string;
  uiSettingsSubheading: string;
  uiLanguageOption: string;
  uiThemeOption: string;
  uiThemeLight: string;
  uiThemeDark: string;
  uiSaveSettings: string;
  uiSettingsSaved: string;
  uiCaseDetailHeading: string;
  uiCaseDetailSubheading: string;
  uiCaseDetailEmpty: string;
  uiCaseDetailTimelineHeading: string;
  uiEventDateColumn: string;
  uiEventTypeColumn: string;
  uiEventDetailsColumn: string;
  uiEventConfirmedColumn: string;
  uiEventRequiresReviewColumn: string;
  uiEventConfirmed: string;
  uiEventUnconfirmed: string;
  uiEventRequiresReview: string;
  uiEventNoReview: string;
  uiConfirmAction: string;
  uiUnconfirmAction: string;
  uiConfirmationSaving: string;
  uiConfirmationSaved: string;
  uiConfirmationFailed: string;
  uiEditAction: string;
  uiSaveAction: string;
  uiCancelAction: string;
  uiEditSuccess: string;
  uiEditError: string;
  uiEventDateLabel: string;
  uiEventHospitalLabel: string;
  uiEventDetailsLabel: string;
  uiEventReviewToggleLabel: string;
  uiInvalidDate: string;
  uiViewEditHistory: string;
  uiHideEditHistory: string;
  uiEditHistoryHeading: string;
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
    uiInvalidLanguage: "Unsupported language. Use en or ko.",
    uiHome: "Home",
    uiSignIn: "Sign in",
    uiDashboard: "Dashboard",
    uiCases: "Cases",
    uiSettings: "Settings",
    uiLocaleSelectLabel: "Select language",
    uiInvestigatorNarrativeHeading: "Investigator Narrative",
    uiConsumerNarrativeHeading: "Consumer Narrative",
    uiInvestigatorNarrativeSubheading: "Template-based narrative derived from investigator report JSON.",
    uiConsumerNarrativeSubheading: "Template-based narrative derived from consumer report JSON.",
    uiAuthRequiredNarrative: "Authentication is required to view this narrative.",
    uiInvestigatorNarrativeRoleRequired: "Please sign in with an investigator account.",
    uiConsumerNarrativeRoleRequired: "Please sign in with a consumer account.",
    uiInvestigatorNarrativeRoleBlocked: "Your current role cannot open investigator narrative output.",
    uiConsumerNarrativeRoleBlocked: "Your current role cannot open consumer narrative output.",
    uiLoadingInvestigatorNarrative: "Loading investigator narrative...",
    uiLoadingConsumerNarrative: "Loading consumer narrative...",
    uiNoInvestigatorNarrative: "No investigator narrative is available yet.",
    uiNoConsumerNarrative: "No consumer narrative is available yet.",
    uiManualReviewRequired: "Manual review required",
    uiReviewed: "Reviewed",
    uiAdditionalReviewRecommended: "Additional review recommended",
    uiClear: "Clear",
    uiInvestigatorReportHeading: "Investigator Report",
    uiConsumerReportHeading: "Consumer Report",
    uiInvestigatorReportSubheading: "Structured JSON view for investigator-only review.",
    uiConsumerReportSubheading: "Structured JSON view for consumer-safe review.",
    uiAuthRequiredReport: "Authentication is required to view this report.",
    uiInvestigatorReportRoleRequired: "Please sign in with an investigator account.",
    uiConsumerReportRoleRequired: "Please sign in with a consumer account.",
    uiInvestigatorReportRoleBlocked: "Your current role cannot open investigator report JSON.",
    uiConsumerReportRoleBlocked: "Your current role cannot open consumer report JSON.",
    uiLoadingInvestigatorReport: "Loading investigator report...",
    uiLoadingConsumerReport: "Loading consumer report...",
    uiNoInvestigatorReport: "No investigator report sections are available yet.",
    uiNoConsumerReport: "No consumer report sections are available yet.",
    uiCaseLabel: "Case",
    uiGeneratedLabel: "Generated",
    uiReviewLabel: "Review",
    uiReviewRequiredShort: "required",
    uiReviewClearShort: "clear",
    uiUntitledSection: "Untitled section",
    uiNoStructuredEntries: "No structured entries are available for this section.",
    uiReviewNotePending: "Review note pending",
    uiTimelineFallbackTitle: "timeline_summary",
    uiTimelineFallbackItem: "timeline item",
    uiNoTimelineItems: "No timeline summary items are available.",
    uiOverviewFallbackTitle: "consumer_overview",
    uiNoOverviewItems: "No overview summary items are available.",
    uiRiskSignalsHeading: "Risk signals",
    uiCheckPointsHeading: "Check points",
    uiNextActionsHeading: "Next actions",
    uiNoRiskSignals: "No risk signals.",
    uiNoCheckPoints: "No check points.",
    uiNoNextActions: "No next actions.",
    uiRiskSignalFallback: "risk_signal",
    uiCheckPointFallback: "check_point",
    uiNextActionFallback: "next_action",
    uiCasesHeading: "Case List",
    uiCasesSubheading: "Browse available cases and open report outputs.",
    uiCasesEmpty: "No cases are available yet.",
    uiCasesLoading: "Loading case list...",
    uiCasesLoadError: "Failed to load case list.",
    uiCaseIdColumn: "Case ID",
    uiUploadDateColumn: "Upload date",
    uiHospitalColumn: "Hospital",
    uiStatusColumn: "Status",
    uiAudienceColumn: "Audience",
    uiActionsColumn: "Actions",
    uiActionReport: "Report",
    uiActionNarrative: "Narrative",
    uiActionPdf: "PDF",
    uiStatusReady: "Ready",
    uiStatusProcessing: "Processing",
    uiStatusReviewRequired: "Review required",
    uiStatusDraft: "Draft",
    uiAudienceConsumer: "Consumer",
    uiAudienceInvestigator: "Investigator",
    uiSettingsHeading: "Settings",
    uiSettingsSubheading: "Manage language and theme preferences.",
    uiLanguageOption: "Language",
    uiThemeOption: "Theme",
    uiThemeLight: "Light",
    uiThemeDark: "Dark",
    uiSaveSettings: "Save settings",
    uiSettingsSaved: "Settings saved.",
    uiCaseDetailHeading: "Case Detail",
    uiCaseDetailSubheading: "Review structured events and confirm timeline items.",
    uiCaseDetailEmpty: "No structured events are available for this case yet.",
    uiCaseDetailTimelineHeading: "Event timeline",
    uiEventDateColumn: "Date",
    uiEventTypeColumn: "Type",
    uiEventDetailsColumn: "Details",
    uiEventConfirmedColumn: "Confirmation",
    uiEventRequiresReviewColumn: "Review",
    uiEventConfirmed: "Confirmed",
    uiEventUnconfirmed: "Unconfirmed",
    uiEventRequiresReview: "Needs review",
    uiEventNoReview: "No review flag",
    uiConfirmAction: "Confirm",
    uiUnconfirmAction: "Mark unconfirmed",
    uiConfirmationSaving: "Saving confirmation...",
    uiConfirmationSaved: "Confirmation updated.",
    uiConfirmationFailed: "Failed to update confirmation.",
    uiEditAction: "Edit",
    uiSaveAction: "Save",
    uiCancelAction: "Cancel",
    uiEditSuccess: "Event updated.",
    uiEditError: "Failed to update event.",
    uiEventDateLabel: "Event date",
    uiEventHospitalLabel: "Hospital",
    uiEventDetailsLabel: "Details",
    uiEventReviewToggleLabel: "Requires review",
    uiInvalidDate: "Use YYYY-MM-DD format.",
    uiViewEditHistory: "View edit history",
    uiHideEditHistory: "Hide edit history",
    uiEditHistoryHeading: "Edit history"
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
    uiInvalidLanguage: "지원하지 않는 언어이다. en 또는 ko를 사용해야 한다.",
    uiHome: "홈",
    uiSignIn: "로그인",
    uiDashboard: "대시보드",
    uiCases: "사례 목록",
    uiSettings: "설정",
    uiLocaleSelectLabel: "언어 선택",
    uiInvestigatorNarrativeHeading: "조사자 내러티브",
    uiConsumerNarrativeHeading: "소비자 내러티브",
    uiInvestigatorNarrativeSubheading: "조사자 보고서 JSON에서 파생된 템플릿 기반 내러티브이다.",
    uiConsumerNarrativeSubheading: "소비자 보고서 JSON에서 파생된 템플릿 기반 내러티브이다.",
    uiAuthRequiredNarrative: "이 내러티브를 보려면 인증이 필요하다.",
    uiInvestigatorNarrativeRoleRequired: "조사자 계정으로 로그인해야 한다.",
    uiConsumerNarrativeRoleRequired: "소비자 계정으로 로그인해야 한다.",
    uiInvestigatorNarrativeRoleBlocked: "현재 역할로는 조사자 내러티브를 열 수 없다.",
    uiConsumerNarrativeRoleBlocked: "현재 역할로는 소비자 내러티브를 열 수 없다.",
    uiLoadingInvestigatorNarrative: "조사자 내러티브를 불러오는 중이다.",
    uiLoadingConsumerNarrative: "소비자 내러티브를 불러오는 중이다.",
    uiNoInvestigatorNarrative: "표시할 조사자 내러티브가 아직 없다.",
    uiNoConsumerNarrative: "표시할 소비자 내러티브가 아직 없다.",
    uiManualReviewRequired: "수동 검토 필요",
    uiReviewed: "검토 완료",
    uiAdditionalReviewRecommended: "추가 검토 권장",
    uiClear: "정상",
    uiInvestigatorReportHeading: "조사자 보고서",
    uiConsumerReportHeading: "소비자 보고서",
    uiInvestigatorReportSubheading: "조사자 전용 검토를 위한 구조화 JSON 화면이다.",
    uiConsumerReportSubheading: "소비자 안전 검토를 위한 구조화 JSON 화면이다.",
    uiAuthRequiredReport: "이 보고서를 보려면 인증이 필요하다.",
    uiInvestigatorReportRoleRequired: "조사자 계정으로 로그인해야 한다.",
    uiConsumerReportRoleRequired: "소비자 계정으로 로그인해야 한다.",
    uiInvestigatorReportRoleBlocked: "현재 역할로는 조사자 보고서 JSON을 열 수 없다.",
    uiConsumerReportRoleBlocked: "현재 역할로는 소비자 보고서 JSON을 열 수 없다.",
    uiLoadingInvestigatorReport: "조사자 보고서를 불러오는 중이다.",
    uiLoadingConsumerReport: "소비자 보고서를 불러오는 중이다.",
    uiNoInvestigatorReport: "표시할 조사자 보고서 섹션이 아직 없다.",
    uiNoConsumerReport: "표시할 소비자 보고서 섹션이 아직 없다.",
    uiCaseLabel: "사건",
    uiGeneratedLabel: "생성 시각",
    uiReviewLabel: "검토",
    uiReviewRequiredShort: "필요",
    uiReviewClearShort: "완료",
    uiUntitledSection: "제목 없는 섹션",
    uiNoStructuredEntries: "이 섹션에 표시할 구조화 항목이 아직 없다.",
    uiReviewNotePending: "검토 메모 대기 중",
    uiTimelineFallbackTitle: "타임라인 요약",
    uiTimelineFallbackItem: "타임라인 항목",
    uiNoTimelineItems: "표시할 타임라인 요약 항목이 없다.",
    uiOverviewFallbackTitle: "소비자 개요",
    uiNoOverviewItems: "표시할 개요 요약 항목이 없다.",
    uiRiskSignalsHeading: "주의 신호",
    uiCheckPointsHeading: "확인 항목",
    uiNextActionsHeading: "다음 단계",
    uiNoRiskSignals: "주의 신호가 없다.",
    uiNoCheckPoints: "확인 항목이 없다.",
    uiNoNextActions: "다음 단계가 없다.",
    uiRiskSignalFallback: "주의 신호",
    uiCheckPointFallback: "확인 항목",
    uiNextActionFallback: "다음 단계",
    uiCasesHeading: "사례 목록",
    uiCasesSubheading: "이용 가능한 사례를 살펴보고 보고서 출력을 연다.",
    uiCasesEmpty: "표시할 사례가 아직 없다.",
    uiCasesLoading: "사례 목록을 불러오는 중이다.",
    uiCasesLoadError: "사례 목록을 불러오지 못했다.",
    uiCaseIdColumn: "사례 ID",
    uiUploadDateColumn: "업로드 일자",
    uiHospitalColumn: "병원",
    uiStatusColumn: "상태",
    uiAudienceColumn: "대상",
    uiActionsColumn: "작업",
    uiActionReport: "보고서",
    uiActionNarrative: "내러티브",
    uiActionPdf: "PDF",
    uiStatusReady: "준비 완료",
    uiStatusProcessing: "처리 중",
    uiStatusReviewRequired: "검토 필요",
    uiStatusDraft: "초안",
    uiAudienceConsumer: "소비자",
    uiAudienceInvestigator: "조사자",
    uiSettingsHeading: "설정",
    uiSettingsSubheading: "언어와 테마 기본 설정을 관리한다.",
    uiLanguageOption: "언어",
    uiThemeOption: "테마",
    uiThemeLight: "라이트",
    uiThemeDark: "다크",
    uiSaveSettings: "설정 저장",
    uiSettingsSaved: "설정을 저장했다.",
    uiCaseDetailHeading: "사건 상세",
    uiCaseDetailSubheading: "구조화된 이벤트 타임라인을 검토하고 확정 상태를 조정합니다.",
    uiCaseDetailEmpty: "이 사례에 표시할 구조화 이벤트가 아직 없습니다.",
    uiCaseDetailTimelineHeading: "이벤트 타임라인",
    uiEventDateColumn: "날짜",
    uiEventTypeColumn: "유형",
    uiEventDetailsColumn: "세부 내용",
    uiEventConfirmedColumn: "확정 상태",
    uiEventRequiresReviewColumn: "검토",
    uiEventConfirmed: "확정",
    uiEventUnconfirmed: "미확정",
    uiEventRequiresReview: "검토 필요",
    uiEventNoReview: "검토 표시 없음",
    uiConfirmAction: "확정",
    uiUnconfirmAction: "미확정으로 변경",
    uiConfirmationSaving: "확정 상태를 저장하는 중입니다...",
    uiConfirmationSaved: "확정 상태를 저장했습니다.",
    uiConfirmationFailed: "확정 상태를 저장하지 못했습니다.",
    uiEditAction: "수정",
    uiSaveAction: "저장",
    uiCancelAction: "취소",
    uiEditSuccess: "이벤트를 수정했습니다.",
    uiEditError: "이벤트를 수정하지 못했습니다.",
    uiEventDateLabel: "이벤트 날짜",
    uiEventHospitalLabel: "병원",
    uiEventDetailsLabel: "세부 내용",
    uiEventReviewToggleLabel: "검토 필요",
    uiInvalidDate: "YYYY-MM-DD 형식을 사용하세요.",
    uiViewEditHistory: "수정 이력 보기",
    uiHideEditHistory: "수정 이력 숨기기",
    uiEditHistoryHeading: "수정 이력"
  }
};

export function formatMessage(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return value === "en" || value === "ko";
}

export function normalizeLocaleCode(value: string | null | undefined): LocaleCode {
  return isLocaleCode(value) ? value : "en";
}

export function getLocaleMessages(
  locale: LocaleCode,
  source: Partial<Record<LocaleCode, Partial<MessageDictionary>>> = messages
): MessageDictionary {
  return {
    ...messages.en,
    ...(source.en ?? {}),
    ...(source[locale] ?? {})
  };
}
