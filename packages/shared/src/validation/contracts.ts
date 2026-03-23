import { z } from "zod";

export const caseAudienceSchema = z.enum(["consumer", "investigator"]);

export const caseStatusSchema = z.enum([
  "draft",
  "uploaded",
  "processing",
  "ready",
  "review_required",
  "archived"
]);

export const caseCreateSchema = z.object({
  title: z.string().min(1),
  audience: caseAudienceSchema
});

export const caseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  status: caseStatusSchema.optional()
});

export const patientInputSchema = z.object({
  patientName: z.string().min(1),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  insuranceJoinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  insuranceCompany: z.string().min(1).optional(),
  productType: z.string().min(1).optional()
});

export const documentCreateSchema = z.object({
  originalFileName: z.string().min(1),
  mimeType: z.string().min(1),
  pageCount: z.number().int().positive(),
  storagePath: z.string().min(1).optional()
});

export const ocrJobStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

export const dateTypeCandidateSchema = z.enum([
  "visit",
  "exam",
  "report",
  "pathology",
  "surgery",
  "admission",
  "discharge",
  "plan",
  "admin",
  "irrelevant"
]);

export const entityCandidateTypeSchema = z.enum([
  "hospital",
  "department",
  "diagnosis",
  "test",
  "treatment",
  "procedure",
  "surgery",
  "admission",
  "discharge",
  "pathology",
  "medication",
  "symptom",
  "admin",
  "unknown"
]);

export const eventTypeCandidateSchema = z.enum([
  "outpatient",
  "exam",
  "treatment",
  "procedure",
  "surgery",
  "admission",
  "discharge",
  "pathology",
  "followup",
  "mixed",
  "unknown"
]);

export const bundleTypeCandidateSchema = z.enum([
  "outpatient",
  "exam",
  "treatment",
  "procedure",
  "surgery",
  "admission",
  "discharge",
  "pathology",
  "mixed",
  "unknown"
]);

export const ocrBlockSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  blockIndex: z.number().int().nonnegative(),
  textRaw: z.string(),
  textNormalized: z.string(),
  bboxJson: z
    .object({
      xMin: z.number(),
      yMin: z.number(),
      xMax: z.number(),
      yMax: z.number()
    })
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  createdAt: z.string().datetime().optional()
});

export const ocrBlockResponseContractSchema = ocrBlockSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const dateCandidateSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  blockIndex: z.number().int().nonnegative(),
  rawDateText: z.string().min(1),
  normalizedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dateTypeCandidate: dateTypeCandidateSchema,
  confidence: z.number().min(0).max(1),
  createdAt: z.string().datetime().optional()
});

export const dateCandidateResponseContractSchema = dateCandidateSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const entityCandidateSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  relatedDateCandidateId: z.string().min(1).nullable().optional(),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  blockIndex: z.number().int().nonnegative(),
  candidateType: entityCandidateTypeSchema,
  rawText: z.string().min(1),
  normalizedText: z.string().min(1),
  confidence: z.number().min(0).max(1),
  metadataJson: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: z.string().datetime().optional()
});

export const entityCandidateResponseContractSchema = entityCandidateSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const candidateSummarySchema = z.object({
  hospitals: z.array(z.string()),
  departments: z.array(z.string()),
  diagnoses: z.array(z.string()),
  tests: z.array(z.string()),
  treatments: z.array(z.string()),
  procedures: z.array(z.string()),
  surgeries: z.array(z.string()),
  admissions: z.array(z.string()),
  discharges: z.array(z.string()),
  pathologies: z.array(z.string()),
  medications: z.array(z.string()),
  symptoms: z.array(z.string())
});

export const dateCenteredWindowSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  dateCandidateId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  anchorBlockIndex: z.number().int().nonnegative(),
  windowStartBlockIndex: z.number().int().nonnegative(),
  windowEndBlockIndex: z.number().int().nonnegative(),
  candidateSummaryJson: candidateSummarySchema,
  createdAt: z.string().datetime().optional()
});

export const dateCenteredWindowResponseContractSchema = dateCenteredWindowSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const unresolvedSlotsSchema = z.object({
  hospitalMissing: z.boolean(),
  diagnosisMissing: z.boolean(),
  conflictingDiagnosis: z.boolean(),
  conflictingHospital: z.boolean(),
  weakEvidence: z.boolean(),
  needsManualReview: z.boolean(),
  notes: z.array(z.string())
});

export const eventAtomSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  sourceWindowId: z.string().min(1),
  sourceFileId: z.string().min(1),
  sourcePageId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  anchorBlockIndex: z.number().int().nonnegative(),
  primaryHospital: z.string().nullable().optional(),
  primaryDepartment: z.string().nullable().optional(),
  primaryDiagnosis: z.string().nullable().optional(),
  primaryTest: z.string().nullable().optional(),
  primaryTreatment: z.string().nullable().optional(),
  primaryProcedure: z.string().nullable().optional(),
  primarySurgery: z.string().nullable().optional(),
  admissionStatus: z.enum(["admitted", "discharged", "both"]).nullable().optional(),
  pathologySummary: z.string().nullable().optional(),
  medicationSummary: z.string().nullable().optional(),
  symptomSummary: z.string().nullable().optional(),
  eventTypeCandidate: eventTypeCandidateSchema,
  ambiguityScore: z.number().min(0).max(1),
  confirmed: z.boolean().optional(),
  editedAt: z.string().datetime().nullable().optional(),
  editHistory: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  requiresReview: z.boolean(),
  unresolvedSlotsJson: unresolvedSlotsSchema,
  candidateSnapshotJson: candidateSummarySchema,
  createdAt: z.string().datetime().optional()
});

export const eventAtomResponseContractSchema = eventAtomSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const unresolvedBundleSlotsSchema = z.object({
  hospitalConflict: z.boolean(),
  diagnosisConflict: z.boolean(),
  mixedAtomTypes: z.boolean(),
  weakGrouping: z.boolean(),
  needsManualReview: z.boolean(),
  notes: z.array(z.string())
});

export const bundleQualityStateSchema = z.enum(["supported", "review_required", "insufficient"]);

export const bundleEvidenceAnchorsSchema = z.object({
  hospital: z.boolean(),
  department: z.boolean(),
  diagnosis: z.boolean(),
  test: z.boolean(),
  treatment: z.boolean(),
  procedure: z.boolean(),
  surgery: z.boolean(),
  pathology: z.boolean(),
  admissionOrDischarge: z.boolean()
});

export const bundleUnresolvedFlagsSchema = z.object({
  hospitalConflict: z.boolean(),
  diagnosisConflict: z.boolean(),
  mixedAtomTypes: z.boolean(),
  weakGrouping: z.boolean(),
  needsManualReview: z.boolean()
});

export const bundleQualityGateSchema = z.object({
  bundleQualityState: bundleQualityStateSchema,
  evidenceAnchors: bundleEvidenceAnchorsSchema,
  unresolvedFlags: bundleUnresolvedFlagsSchema
});

export const eventBundleSchema = z.object({
  id: z.string().optional(),
  caseId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive(),
  primaryHospital: z.string().nullable().optional(),
  bundleTypeCandidate: bundleTypeCandidateSchema,
  representativeDiagnosis: z.string().nullable().optional(),
  representativeTest: z.string().nullable().optional(),
  representativeTreatment: z.string().nullable().optional(),
  representativeProcedure: z.string().nullable().optional(),
  representativeSurgery: z.string().nullable().optional(),
  admissionStatus: z.enum(["admitted", "discharged", "both"]).nullable().optional(),
  ambiguityScore: z.number().min(0).max(1),
  requiresReview: z.boolean(),
  unresolvedBundleSlotsJson: unresolvedBundleSlotsSchema,
  atomIdsJson: z.array(z.string().min(1)),
  candidateSnapshotJson: candidateSummarySchema,
  createdAt: z.string().datetime().optional()
});

export const eventBundleResponseContractSchema = eventBundleSchema.extend({
  id: z.string(),
  createdAt: z.string().datetime()
});

export const investigatorSlotBundleSchema = z.object({
  eventBundleId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hospital: z.string().nullable(),
  department: z.string().nullable(),
  diagnosis: z.string().nullable(),
  test: z.string().nullable(),
  treatment: z.string().nullable(),
  procedure: z.string().nullable(),
  surgery: z.string().nullable(),
  admissionStatus: z.enum(["admitted", "discharged", "both"]).nullable(),
  pathologySummary: z.string().nullable(),
  medicationSummary: z.string().nullable(),
  symptomSummary: z.string().nullable(),
  bundleTypeCandidate: bundleTypeCandidateSchema,
  ambiguityScore: z.number().min(0).max(1),
  requiresReview: z.boolean(),
  bundleQualityGate: bundleQualityGateSchema,
  notes: z.array(z.string())
});

export const investigatorSlotJsonSchema = z.object({
  caseId: z.string().min(1),
  generatedAt: z.string().datetime(),
  bundles: z.array(investigatorSlotBundleSchema)
});

export const consumerTimelineItemSchema = z.object({
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hospital: z.string().nullable(),
  diagnosis: z.string().nullable(),
  test: z.string().nullable(),
  treatment: z.string().nullable(),
  surgery: z.string().nullable(),
  admissionStatus: z.enum(["admitted", "discharged", "both"]).nullable(),
  reviewFlag: z.boolean()
});

export const consumerSummaryJsonSchema = z.object({
  caseId: z.string().min(1),
  generatedAt: z.string().datetime(),
  timelineSummary: z.array(consumerTimelineItemSchema),
  hospitalSummary: z.array(z.string()),
  riskSignals: z.array(z.string()),
  checkPoints: z.array(
    z.enum([
      "review_required_bundle_exists",
      "surgery_history_detected",
      "admission_history_detected",
      "mixed_bundle_detected"
    ])
  ),
  recommendedNextActions: z.array(
    z.enum([
      "review_original_documents",
      "check_hospital_history",
      "check_surgery_records",
      "manual_review_recommended"
    ])
  ),
  requiresReview: z.boolean()
});

export const starterCoreEventTypeSchema = z.enum([
  "outpatient",
  "admission",
  "surgery",
  "exam",
  "pathology",
  "treatment",
  "procedure",
  "follow_up",
  "emergency",
  "unknown"
]);

export const starterCaseBasicInfoSchema = z.object({
  caseId: z.string().min(1),
  insuranceJoinDateAvailable: z.boolean(),
  analysisTimestamp: z.string().datetime(),
  activeTier: z.literal("starter")
});

export const starterDocumentInventorySummarySchema = z.object({
  totalDocuments: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hospitalsMentioned: z.array(z.string()),
  dateRange: z
    .object({
      earliestEventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      latestEventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
    })
    .optional(),
  sourceQualityNotices: z.array(z.string())
});

export const starterRepresentativeEvidenceSchema = z.object({
  entryType: z.literal("event_bundle"),
  eventBundleId: z.string().min(1),
  fileOrder: z.number().int().positive(),
  pageOrder: z.number().int().positive()
});

export const starterDiseaseClusterTypeSchema = z.enum([
  "cancer",
  "heart",
  "brain_cerebrovascular",
  "surgery",
  "hospitalization",
  "chronic_or_other_important"
]);

export const starterDiseaseClusterStatusSchema = z.enum(["present", "not_found", "review_needed"]);

export const starterDiseaseClusterItemSchema = z.object({
  clusterType: starterDiseaseClusterTypeSchema,
  status: starterDiseaseClusterStatusSchema,
  overview: z.string().min(1),
  relatedEventIds: z.array(z.string().min(1)),
  representativeEvidenceEntryPoint: starterRepresentativeEvidenceSchema.nullable()
});

export const starterTimelineItemSchema = z.object({
  eventBundleId: z.string().min(1),
  canonicalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hospital: z.string().nullable(),
  eventType: starterCoreEventTypeSchema,
  shortSummary: z.string().min(1),
  reviewNeeded: z.boolean(),
  representativeEvidenceEntryPoint: starterRepresentativeEvidenceSchema
});

export const starterWarningSummarySchema = z.object({
  overallConfidence: z.enum(["high", "medium", "low"]),
  reviewNeededCount: z.number().int().nonnegative(),
  unresolvedCount: z.number().int().nonnegative(),
  sourceQualityWarnings: z.array(z.string()),
  mandatoryWarnings: z.array(z.string()).min(1)
});

export const starterCoreResultSchema = z.object({
  caseBasicInfo: starterCaseBasicInfoSchema,
  documentInventorySummary: starterDocumentInventorySummarySchema,
  medicalEventTimeline: z.array(starterTimelineItemSchema),
  diseaseClusters: z.array(starterDiseaseClusterItemSchema),
  warningSummary: starterWarningSummarySchema
});

export const investigatorReportEntrySchema = z.object({
  label: z.string().min(1),
  value: z.string().nullable()
});

export const investigatorReportSectionSchema = z.object({
  sectionTitle: z.string().min(1),
  entries: z.array(investigatorReportEntrySchema),
  bundleQualityState: bundleQualityStateSchema,
  reviewSignalSummary: z.array(z.string()),
  requiresReview: z.boolean(),
  notes: z.array(z.string())
});

export const investigatorReportJsonSchema = z.object({
  caseId: z.string().min(1),
  generatedAt: z.string().datetime(),
  sections: z.array(investigatorReportSectionSchema),
  requiresReview: z.boolean()
});

export const consumerReportSummaryItemSchema = z.object({
  title: z.string().min(1),
  value: z.string().nullable()
});

export const consumerReportSectionSchema = z.object({
  sectionTitle: z.string().min(1),
  summaryItems: z.array(consumerReportSummaryItemSchema),
  riskSignals: z.array(z.string()),
  checkPoints: z.array(z.string()),
  nextActions: z.array(z.string()),
  requiresReview: z.boolean()
});

export const consumerReportJsonSchema = z.object({
  caseId: z.string().min(1),
  generatedAt: z.string().datetime(),
  sections: z.array(consumerReportSectionSchema),
  requiresReview: z.boolean()
});

export const investigatorNarrativeSectionSchema = z.object({
  heading: z.string().min(1),
  bundleQualityState: bundleQualityStateSchema,
  paragraphs: z.array(z.string()),
  requiresReview: z.boolean()
});

export const investigatorNarrativeJsonSchema = z.object({
  caseId: z.string().min(1),
  generatedAt: z.string().datetime(),
  sections: z.array(investigatorNarrativeSectionSchema),
  requiresReview: z.boolean()
});

export const consumerNarrativeSectionSchema = z.object({
  heading: z.string().min(1),
  paragraphs: z.array(z.string()),
  requiresReview: z.boolean()
});

export const consumerNarrativeJsonSchema = z.object({
  caseId: z.string().min(1),
  generatedAt: z.string().datetime(),
  sections: z.array(consumerNarrativeSectionSchema),
  requiresReview: z.boolean()
});

export const caseListItemSchema = z.object({
  caseId: z.string().min(1),
  hospitalName: z.string().nullable(),
  uploadDate: z.string().datetime(),
  status: caseStatusSchema,
  audience: caseAudienceSchema,
  hasReport: z.boolean(),
  hasNarrative: z.boolean(),
  hasPdf: z.boolean()
});

export const caseListJsonSchema = z.object({
  items: z.array(caseListItemSchema)
});

export const caseEventSchema = z.object({
  eventId: z.string().min(1),
  type: z.enum(["visit", "diagnosis", "exam", "treatment", "procedure", "surgery", "admission", "discharge", "pathology", "followup", "other"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hospital: z.string().min(1),
  details: z.string().min(1),
  confirmed: z.boolean(),
  requiresReview: z.boolean(),
  editedAt: z.string().datetime().nullable().optional(),
  editHistory: z
    .array(
      z.object({
        editedBy: z.string().min(1),
        editedAt: z.string().datetime(),
        changes: z.record(
          z.string(),
          z.object({
            previousValue: z.string().nullable(),
            nextValue: z.string().nullable()
          })
        )
      })
    )
    .optional(),
  metadata: z
    .object({
      fileOrder: z.number().int().positive(),
      pageOrder: z.number().int().positive(),
      anchorBlockIndex: z.number().int().nonnegative(),
      eventBundleId: z.string().min(1).nullable().optional(),
      sourceFileId: z.string().min(1),
      sourcePageId: z.string().min(1)
    })
    .optional()
});

export const caseDetailSchema = z.object({
  caseId: z.string().min(1),
  hospitalName: z.string().nullable(),
  events: z.array(caseEventSchema)
});

export const caseEventEditSchema = z.object({
  eventId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hospital: z.string().min(1).optional(),
  details: z.string().min(1).optional(),
  requiresReview: z.boolean().optional()
});

export const caseAnalyticsSchema = z.object({
  totalCases: z.number().int().nonnegative(),
  totalEvents: z.number().int().nonnegative(),
  confirmedEvents: z.number().int().nonnegative(),
  unconfirmedEvents: z.number().int().nonnegative(),
  reviewRequiredEvents: z.number().int().nonnegative(),
  eventsByType: z.record(z.string(), z.number().int().nonnegative()),
  eventsByHospital: z.record(z.string(), z.number().int().nonnegative()),
  topHospitals: z.array(
    z.object({
      hospital: z.string().min(1),
      events: z.number().int().nonnegative()
    })
  )
});

export const caseAnalyticsFilterSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    eventTypes: z.array(z.string().min(1)).optional(),
    hospitals: z.array(z.string().min(1)).optional()
  })
  .refine(
    (value) => {
      if (!value.startDate || !value.endDate) {
        return true;
      }

      return value.startDate <= value.endDate;
    },
    {
      message: "startDate must be less than or equal to endDate",
      path: ["endDate"]
    }
  );

export const analyticsIntervalSchema = z.enum(["daily", "weekly", "monthly"]);

export const analyticsExportFileTypeSchema = z.enum(["csv", "xlsx"]);

export const caseAnalyticsTrendPointSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total: z.number().int().nonnegative(),
  confirmed: z.number().int().nonnegative(),
  unconfirmed: z.number().int().nonnegative()
});

export const caseAnalyticsTrendSchema = z.object({
  interval: analyticsIntervalSchema,
  points: z.array(caseAnalyticsTrendPointSchema)
});

export const analyticsPresetSchema = z.object({
  presetId: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  filter: caseAnalyticsFilterSchema,
  interval: analyticsIntervalSchema,
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string().min(1)).default([]),
  createdAt: z.string().datetime()
});

export const analyticsExportSchema = z.object({
  fileType: analyticsExportFileTypeSchema,
  filter: caseAnalyticsFilterSchema.default({}),
  interval: analyticsIntervalSchema
});

export const analyticsPresetShareSchema = z.object({
  presetId: z.string().min(1),
  sharedWith: z.array(z.string().min(1)).min(1)
});

export const analyticsShareCandidateSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().nullable()
});

export const analyticsShareCandidateSearchSchema = z.object({
  items: z.array(analyticsShareCandidateSchema),
  page: z.number().int().positive(),
  hasMore: z.boolean()
});

export const ocrIngestionJobPayloadSchema = z.object({
  caseId: z.string().min(1),
  sourceDocumentIds: z.array(z.string().min(1)).min(1),
  fileOrders: z.array(z.number().int().positive()).min(1),
  requestedByUserId: z.string().min(1),
  ingestionMode: z.enum(["metadata-only", "ocr"]),
  enqueueReason: z.enum(["manual_case_upload", "retry", "system_followup"]),
  idempotencyKey: z.string().min(1),
  allowedTransitions: z.array(ocrJobStatusSchema).length(4)
});

export const ocrJobCreateSchema = z.object({
  sourceDocumentIds: z.array(z.string().min(1)).min(1),
  enqueueReason: z.enum(["manual_case_upload", "retry", "system_followup"]).default("manual_case_upload")
});

export const jobStatusSchema = z.enum(["queued", "processing", "completed", "failed"]);

export const evidenceKindSchema = z.enum(["ocr_block", "merged_window", "page_region"]);

export const evidenceStorageSchema = z.object({
  caseId: z.string(),
  sourceFileId: z.string(),
  sourcePageId: z.string(),
  fileOrder: z.number().int().nonnegative(),
  pageOrder: z.number().int().nonnegative(),
  evidenceKind: evidenceKindSchema,
  blockIndexStart: z.number().int().nonnegative().optional(),
  blockIndexEnd: z.number().int().nonnegative().optional(),
  bbox: z
    .object({
      xMin: z.number(),
      yMin: z.number(),
      xMax: z.number(),
      yMax: z.number()
    })
    .optional(),
  quote: z.string().min(1),
  contextBefore: z.string().optional(),
  contextAfter: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime().optional()
});

export const evidenceRefContractSchema = evidenceStorageSchema.extend({
  evidenceId: z.string(),
  createdAt: z.string().datetime()
});

export const consumerSummarySchema = z.object({
  risk_signals: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      evidenceRefs: z.array(evidenceRefContractSchema).default([])
    })
  ),
  timeline_summary: z.array(
    z.object({
      date: z.string(),
      eventLabel: z.string(),
      hospital: z.string().optional(),
      evidenceRefs: z.array(evidenceRefContractSchema).default([])
    })
  ),
  hospital_summary: z.array(
    z.object({
      hospital: z.string(),
      eventCount: z.number().int().nonnegative(),
      evidenceRefs: z.array(evidenceRefContractSchema).default([])
    })
  ),
  check_points: z.array(z.string()),
  recommended_next_actions: z.array(z.string())
});

export type CaseCreateInput = z.infer<typeof caseCreateSchema>;
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>;
export type PatientInput = z.infer<typeof patientInputSchema>;
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
export type OcrJobCreateInput = z.infer<typeof ocrJobCreateSchema>;
export type OcrIngestionJobPayload = z.infer<typeof ocrIngestionJobPayloadSchema>;
export type OcrBlockInput = z.infer<typeof ocrBlockSchema>;
export type OcrBlockResponseContract = z.infer<typeof ocrBlockResponseContractSchema>;
export type DateCandidateInput = z.infer<typeof dateCandidateSchema>;
export type DateCandidateResponseContract = z.infer<typeof dateCandidateResponseContractSchema>;
export type EntityCandidateInput = z.infer<typeof entityCandidateSchema>;
export type EntityCandidateResponseContract = z.infer<typeof entityCandidateResponseContractSchema>;
export type CandidateSummary = z.infer<typeof candidateSummarySchema>;
export type DateCenteredWindowInput = z.infer<typeof dateCenteredWindowSchema>;
export type DateCenteredWindowResponseContract = z.infer<typeof dateCenteredWindowResponseContractSchema>;
export type UnresolvedSlots = z.infer<typeof unresolvedSlotsSchema>;
export type EventAtomInput = z.infer<typeof eventAtomSchema>;
export type EventAtomResponseContract = z.infer<typeof eventAtomResponseContractSchema>;
export type UnresolvedBundleSlots = z.infer<typeof unresolvedBundleSlotsSchema>;
export type BundleQualityState = z.infer<typeof bundleQualityStateSchema>;
export type BundleEvidenceAnchors = z.infer<typeof bundleEvidenceAnchorsSchema>;
export type BundleUnresolvedFlags = z.infer<typeof bundleUnresolvedFlagsSchema>;
export type BundleQualityGate = z.infer<typeof bundleQualityGateSchema>;
export type EventBundleInput = z.infer<typeof eventBundleSchema>;
export type EventBundleResponseContract = z.infer<typeof eventBundleResponseContractSchema>;
export type InvestigatorSlotBundle = z.infer<typeof investigatorSlotBundleSchema>;
export type InvestigatorSlotJson = z.infer<typeof investigatorSlotJsonSchema>;
export type ConsumerTimelineItem = z.infer<typeof consumerTimelineItemSchema>;
export type ConsumerSummaryJson = z.infer<typeof consumerSummaryJsonSchema>;
export type StarterCoreEventType = z.infer<typeof starterCoreEventTypeSchema>;
export type StarterCaseBasicInfo = z.infer<typeof starterCaseBasicInfoSchema>;
export type StarterDocumentInventorySummary = z.infer<typeof starterDocumentInventorySummarySchema>;
export type StarterRepresentativeEvidence = z.infer<typeof starterRepresentativeEvidenceSchema>;
export type StarterDiseaseClusterType = z.infer<typeof starterDiseaseClusterTypeSchema>;
export type StarterDiseaseClusterStatus = z.infer<typeof starterDiseaseClusterStatusSchema>;
export type StarterDiseaseClusterItem = z.infer<typeof starterDiseaseClusterItemSchema>;
export type StarterTimelineItem = z.infer<typeof starterTimelineItemSchema>;
export type StarterWarningSummary = z.infer<typeof starterWarningSummarySchema>;
export type StarterCoreResult = z.infer<typeof starterCoreResultSchema>;
export type InvestigatorReportEntry = z.infer<typeof investigatorReportEntrySchema>;
export type InvestigatorReportSection = z.infer<typeof investigatorReportSectionSchema>;
export type InvestigatorReportJson = z.infer<typeof investigatorReportJsonSchema>;
export type ConsumerReportSummaryItem = z.infer<typeof consumerReportSummaryItemSchema>;
export type ConsumerReportSection = z.infer<typeof consumerReportSectionSchema>;
export type ConsumerReportJson = z.infer<typeof consumerReportJsonSchema>;
export type InvestigatorNarrativeSection = z.infer<typeof investigatorNarrativeSectionSchema>;
export type InvestigatorNarrativeJson = z.infer<typeof investigatorNarrativeJsonSchema>;
export type ConsumerNarrativeSection = z.infer<typeof consumerNarrativeSectionSchema>;
export type ConsumerNarrativeJson = z.infer<typeof consumerNarrativeJsonSchema>;
export type CaseListItem = z.infer<typeof caseListItemSchema>;
export type CaseListJson = z.infer<typeof caseListJsonSchema>;
export type CaseEvent = z.infer<typeof caseEventSchema>;
export type CaseDetail = z.infer<typeof caseDetailSchema>;
export type CaseEventEdit = z.infer<typeof caseEventEditSchema>;
export type EventEditHistory = NonNullable<CaseEvent["editHistory"]>[number];
export type CaseAnalytics = z.infer<typeof caseAnalyticsSchema>;
export type CaseAnalyticsFilter = z.infer<typeof caseAnalyticsFilterSchema>;
export type CaseAnalyticsTrend = z.infer<typeof caseAnalyticsTrendSchema>;
export type CaseAnalyticsPreset = z.infer<typeof analyticsPresetSchema>;
export type AnalyticsExportInput = z.infer<typeof analyticsExportSchema>;
export type AnalyticsExportFileType = z.infer<typeof analyticsExportFileTypeSchema>;
export type AnalyticsPresetShareInput = z.infer<typeof analyticsPresetShareSchema>;
export type AnalyticsShareCandidate = z.infer<typeof analyticsShareCandidateSchema>;
export type AnalyticsShareCandidateSearchResult = z.infer<typeof analyticsShareCandidateSearchSchema>;
