// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../components/locale-provider";
import { ThemeProvider } from "../../../components/theme-provider";
import { CaseDetailClient } from "./case-detail-client";

function renderClient(ui: React.ReactNode) {
  return render(
    <ThemeProvider initialTheme="light">
      <LocaleProvider initialLocale="en">{ui}</LocaleProvider>
    </ThemeProvider>
  );
}

describe("case detail client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it("edits an event and shows edit history for admins", async () => {
    const fetchMock = vi.fn((input: string) => {
      if (input === "/api/cases/case-1/events/event-1/edit") {
        return Promise.resolve(
          Response.json({
            success: true,
            data: {
              eventId: "event-1",
              type: "exam",
              date: "2026-03-06",
              hospital: "Busan Hospital",
              details: "Revised detail",
              confirmed: true,
              requiresReview: true,
              editedAt: "2026-03-06T01:00:00.000Z",
              editHistory: [
                {
                  editedBy: "admin-1",
                  editedAt: "2026-03-06T01:00:00.000Z",
                  changes: {
                    details: {
                      previousValue: "Chest CT | Pneumonia",
                      nextValue: "Revised detail"
                    }
                  }
                }
              ],
              metadata: {
                fileOrder: 1,
                pageOrder: 1,
                anchorBlockIndex: 0,
                eventBundleId: "bundle-1",
                sourceFileId: "doc-1",
                sourcePageId: "page-1"
              }
            },
            meta: { requestId: "req-edit" }
          })
        );
      }

      return Promise.reject(new Error(`Unexpected fetch: ${input}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderClient(
      <CaseDetailClient
        caseId="case-1"
        canEdit
        canViewHistory
        initialDetail={{
          caseId: "case-1",
          hospitalName: "Seoul Hospital",
          events: [
            {
              eventId: "event-1",
              type: "exam",
              date: "2026-03-05",
              hospital: "Seoul Hospital",
              details: "Chest CT | Pneumonia",
              confirmed: true,
              requiresReview: false,
              editedAt: null,
              editHistory: [],
              metadata: {
                fileOrder: 1,
                pageOrder: 1,
                anchorBlockIndex: 0,
                eventBundleId: "bundle-1",
                sourceFileId: "doc-1",
                sourcePageId: "page-1"
              }
            }
          ]
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Hospital" }), {
      target: { value: "Busan Hospital" }
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Details" }), {
      target: { value: "Revised detail" }
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "Requires review" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Event updated.")).toBeTruthy();
    });

    expect(screen.getByText("Busan Hospital")).toBeTruthy();
    expect(screen.getByText("Revised detail")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "View edit history" }));

    await waitFor(() => {
      expect(screen.getByText("Edit history")).toBeTruthy();
    });

    expect(screen.getByText("admin-1")).toBeTruthy();
    expect(screen.getByText("details: Chest CT | Pneumonia -> Revised detail")).toBeTruthy();
  });

  it("rolls back optimistic edits when save fails", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        Response.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Event was updated by another user"
            },
            meta: { requestId: "req-conflict" }
          },
          { status: 409 }
        )
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    renderClient(
      <CaseDetailClient
        caseId="case-1"
        canEdit
        canViewHistory={false}
        initialDetail={{
          caseId: "case-1",
          hospitalName: "Seoul Hospital",
          events: [
            {
              eventId: "event-1",
              type: "exam",
              date: "2026-03-05",
              hospital: "Seoul Hospital",
              details: "Chest CT | Pneumonia",
              confirmed: true,
              requiresReview: false,
              editedAt: "2026-03-05T01:00:00.000Z",
              editHistory: [],
              metadata: {
                fileOrder: 1,
                pageOrder: 1,
                anchorBlockIndex: 0,
                eventBundleId: "bundle-1",
                sourceFileId: "doc-1",
                sourcePageId: "page-1"
              }
            }
          ]
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Details" }), {
      target: { value: "Conflicting edit" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Event was updated by another user")).toBeTruthy();
    });

    expect(screen.getByText("Chest CT | Pneumonia")).toBeTruthy();
  });
});
