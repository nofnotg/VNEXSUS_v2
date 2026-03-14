import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inlineRuns: [] as string[],
  casesChecked: [] as Array<{ caseId: string; userId: string; role: string }>,
  documents: [
    {
      id: "doc-1",
      fileOrder: 1
    }
  ],
  createdJobId: "job-1"
}));

vi.mock("../../prisma", () => ({
  prisma: {
    sourceDocument: {
      findMany: vi.fn(async () => [...state.documents])
    },
    analysisJob: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({
        id: state.createdJobId,
        status: "queued"
      }))
    },
    case: {
      update: vi.fn(async () => ({ id: "case-1", status: "processing" }))
    }
  }
}));

vi.mock("./case-service", () => ({
  getCaseForUser: vi.fn(async (caseId: string, userId: string, role: string) => {
    state.casesChecked.push({ caseId, userId, role });
    return { id: caseId };
  })
}));

vi.mock("../demo-mode", () => ({
  isLocalDemoMode: vi.fn(() => false)
}));

vi.mock("../demo-store", () => ({
  getDemoLatestOcrJob: vi.fn(),
  runDemoOcrPipeline: vi.fn()
}));

vi.mock("./ocr-ingestion-service", () => ({
  runOcrIngestionSkeleton: vi.fn(async (jobId: string) => {
    state.inlineRuns.push(jobId);
    return {
      jobId,
      status: "completed",
      sourceDocumentIds: ["doc-1"]
    };
  })
}));

import { createOcrJob } from "./job-service";

describe("job service", () => {
  beforeEach(() => {
    state.inlineRuns = [];
    state.casesChecked = [];
    state.documents = [
      {
        id: "doc-1",
        fileOrder: 1
      }
    ];
    state.createdJobId = "job-1";
  });

  it("runs OCR ingestion inline when worker processing is not available", async () => {
    const result = await createOcrJob("case-1", "user-1", "investigator", {
      sourceDocumentIds: ["doc-1"],
      enqueueReason: "manual_case_upload"
    });

    expect(state.casesChecked).toEqual([{ caseId: "case-1", userId: "user-1", role: "investigator" }]);
    expect(state.inlineRuns).toEqual(["job-1"]);
    expect(result.status).toBe("completed");
    expect(result.jobId).toBe("job-1");
  });
});
