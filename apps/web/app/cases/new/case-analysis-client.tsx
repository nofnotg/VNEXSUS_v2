"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { runCaseOcr, uploadCaseDocument } from "../../../lib/client/case-document-api";

type Props = {
  userRole: "consumer" | "investigator" | "admin";
};

type Feedback = {
  kind: "success" | "error" | "pending";
  message: string;
};

type PatientForm = {
  patientName: string;
  insuranceJoinDateDigits: string;
  insuranceCompany: string;
  productType: string;
  issueNote: string;
};

const emptyForm: PatientForm = {
  patientName: "",
  insuranceJoinDateDigits: "",
  insuranceCompany: "",
  productType: "",
  issueNote: ""
};

export function CaseAnalysisClient({ userRole }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const progressCapRef = useRef(30);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [progress, setProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedCaseId, setCompletedCaseId] = useState<string | null>(null);
  const [rawPreview, setRawPreview] = useState("");
  const [showRawPreview, setShowRawPreview] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const audience = userRole === "investigator" || userRole === "admin" ? "investigator" : "consumer";
  const formattedJoinDate = formatInsuranceJoinDateDisplay(form.insuranceJoinDateDigits);
  const insuranceJoinDate = toIsoDate(form.insuranceJoinDateDigits);
  const canAnalyze = form.patientName.trim().length > 0 && Boolean(insuranceJoinDate) && files.length > 0 && !isAnalyzing;

  const progressLabel = useMemo(() => {
    if (progress <= 0) {
      return "분석 대기";
    }

    if (progress >= 100) {
      return "분석 완료";
    }

    return `분석 진행 ${progress}%`;
  }, [progress]);

  function resetForm() {
    setForm(emptyForm);
  }

  function addFiles(nextFiles: FileList | File[] | null | undefined) {
    if (!nextFiles) {
      return;
    }

    setFiles((current) => [...current, ...Array.from(nextFiles)]);
  }

  function startProgress(fileCount: number) {
    progressCapRef.current = 30;
    setProgress(30);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= progressCapRef.current) {
          return current;
        }

        return Math.min(current + 1, progressCapRef.current);
      });
    }, 3000);

    if (fileCount <= 0) {
      progressCapRef.current = 100;
    }
  }

  function updateProgressForStep(fileCount: number, completedSteps: number) {
    progressCapRef.current = Math.min(99, 30 + Math.floor((70 / fileCount) * completedSteps));
    setProgress((current) => Math.max(current, progressCapRef.current));
  }

  async function handleAnalyze() {
    if (!canAnalyze || !insuranceJoinDate) {
      setFeedback({
        kind: "error",
        message: "피보험자 이름, 보험가입일, 업로드 파일을 먼저 확인해 주세요."
      });
      return;
    }

    setIsAnalyzing(true);
    setFeedback({ kind: "pending", message: "케이스를 만들고 OCR 분석을 시작합니다." });
    setCompletedCaseId(null);
    setRawPreview("");
    setShowRawPreview(false);
    startProgress(files.length);

    try {
      const createCaseResponse = await fetch("/api/cases", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: `${form.patientName.trim()} 분석 ${new Date().toLocaleDateString("ko-KR")}`,
          audience
        })
      });

      const createdJson = await createCaseResponse.json().catch(() => null);
      const caseId = (createdJson as { data?: { id?: string } })?.data?.id;

      if (!createCaseResponse.ok || !caseId) {
        throw new Error("케이스 생성에 실패했습니다.");
      }

      const patientResponse = await fetch(`/api/cases/${caseId}/patient-input`, {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientName: form.patientName.trim(),
          insuranceJoinDate,
          insuranceCompany: form.insuranceCompany.trim() || undefined,
          productType: form.productType.trim() || undefined,
          notes: form.issueNote.trim() || undefined
        })
      });

      if (!patientResponse.ok) {
        throw new Error("피보험자 정보 저장에 실패했습니다.");
      }

      const uploadedDocumentIds: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const uploaded = await uploadCaseDocument(caseId, files[index]!);
        if (uploaded?.documentId) {
          uploadedDocumentIds.push(uploaded.documentId);
        }
        updateProgressForStep(files.length, index + 1);
      }

      const ocrResult = await runCaseOcr(caseId, uploadedDocumentIds);
      if (!ocrResult?.jobId) {
        throw new Error("OCR 실행에 실패했습니다.");
      }

      const blocksResponse = await fetch(`/api/cases/${caseId}/ocr/blocks`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store"
      });
      const blocksJson = await blocksResponse.json().catch(() => null);
      const items = ((blocksJson as { data?: { items?: Array<{ text?: string }> } })?.data?.items ?? []).flatMap((item) =>
        typeof item.text === "string" ? [item.text] : []
      );

      setRawPreview(items.join("\n"));
      setCompletedCaseId(caseId);
      setProgress(100);
      setFeedback({
        kind: "success",
        message:
          form.issueNote.trim().length > 0
            ? "분석이 완료됐습니다. 쟁점사항 메모는 현재 1차 UI에서 참고 텍스트로 유지됩니다."
            : "분석이 완료됐습니다. 상세 결과와 보고서를 확인해 주세요."
      });
    } catch (error) {
      setFeedback({
        kind: "error",
        message: error instanceof Error ? error.message : "케이스 분석에 실패했습니다."
      });
    } finally {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      setIsAnalyzing(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "grid", gap: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "24px" }}>피보험자 정보</h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
              피보험자 이름과 보험가입일은 필수입니다. 보험가입일은 숫자만 입력하면 자동으로 정리해 보여줍니다.
            </p>
          </div>
          <button type="button" onClick={resetForm} style={ghostButtonStyle}>
            입력 초기화
          </button>
        </div>

        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>
              피보험자 이름 <strong style={{ color: "#8d2b22" }}>*</strong>
            </span>
            <input
              value={form.patientName}
              onChange={(event) => setForm((current) => ({ ...current, patientName: event.target.value }))}
              placeholder="예: 홍길동"
            />
          </label>

          <label style={fieldStyle}>
            <span>
              보험가입일 <strong style={{ color: "#8d2b22" }}>*</strong>
            </span>
            <input
              inputMode="numeric"
              value={formattedJoinDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  insuranceJoinDateDigits: event.target.value.replace(/\D/g, "").slice(0, 8)
                }))
              }
              placeholder="YYYYMMDD 또는 2025년 01월 01일"
            />
            <small style={{ color: "var(--muted)" }}>숫자 8자리 입력 시 자동으로 날짜 형식으로 정리됩니다.</small>
          </label>

          <label style={fieldStyle}>
            <span>가입 보험사</span>
            <input
              value={form.insuranceCompany}
              onChange={(event) => setForm((current) => ({ ...current, insuranceCompany: event.target.value }))}
              placeholder="예: 삼성화재"
            />
          </label>

          <label style={fieldStyle}>
            <span>가입 상품명</span>
            <input
              value={form.productType}
              onChange={(event) => setForm((current) => ({ ...current, productType: event.target.value }))}
              placeholder="예: 건강보험 플랜"
            />
          </label>
        </div>

        <label style={fieldStyle}>
          <span>{audience === "investigator" ? "중점 검토 키워드" : "쟁점사항"}</span>
          <textarea
            rows={4}
            value={form.issueNote}
            onChange={(event) => setForm((current) => ({ ...current, issueNote: event.target.value }))}
            placeholder={
              audience === "investigator"
                ? "조사자가 특히 확인하고 싶은 키워드나 쟁점을 적어 주세요."
                : "궁금한 부분이나 더 자세히 보고 싶은 내용을 적어 주세요."
            }
          />
          <small style={{ color: "var(--muted)" }}>
            현재 단계에서는 참고 메모로 유지되며, 이후 결과 설명을 더 풍부하게 만드는 입력으로 확장할 수 있습니다.
          </small>
        </label>
      </section>

      <section style={cardStyle}>
        <div style={{ display: "grid", gap: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "24px" }}>파일 업로드</h2>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            파일을 끌어다 놓거나 버튼을 눌러 추가해 주세요. PNG와 PDF를 우선 기준으로 검증하도록 구성했습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={dropZoneStyle}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
        >
          <strong style={{ fontSize: "17px" }}>파일을 여기로 끌어다 놓거나 파일 업로드 버튼을 눌러 주세요.</strong>
          <span style={{ color: "var(--muted)" }}>현재 선택된 파일 {files.length}개</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tif,.tiff"
          style={{ display: "none" }}
          onChange={(event) => addFiles(event.target.files)}
        />

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" onClick={() => inputRef.current?.click()} style={ghostButtonStyle}>
            파일 업로드
          </button>
          <button type="button" onClick={() => setFiles([])} style={ghostButtonStyle}>
            파일 목록 비우기
          </button>
        </div>

        {files.length > 0 ? (
          <div style={{ display: "grid", gap: "10px" }}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} style={fileItemStyle}>
                <div style={{ display: "grid", gap: "4px" }}>
                  <strong>{file.name}</strong>
                  <span style={{ color: "var(--muted)", fontSize: "14px" }}>{file.type || "알 수 없는 형식"}</span>
                </div>
                <span style={{ color: "var(--muted)", fontSize: "14px" }}>{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section style={cardStyle}>
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "24px" }}>분석 실행</h2>
            <strong>{progressLabel}</strong>
          </div>

          <div style={progressTrackStyle}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: "999px",
                background: "linear-gradient(90deg, #b7833e 0%, #e1c087 100%)",
                transition: "width 0.3s ease"
              }}
            />
          </div>

          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.8 }}>
            진행률은 업로드 문서 수를 기준으로 체감형으로 표시합니다. OCR이 끝나면 100%로 고정됩니다.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button type="button" onClick={() => void handleAnalyze()} disabled={!canAnalyze} style={primaryButtonStyle}>
              케이스 분석
            </button>
            {completedCaseId ? (
              <button type="button" onClick={() => setShowRawPreview((current) => !current)} style={ghostButtonStyle}>
                {showRawPreview ? "추출 텍스트 닫기" : "추출 텍스트 보기"}
              </button>
            ) : null}
            {completedCaseId ? (
              <Link href={`/cases/${completedCaseId}`} style={ghostLinkStyle}>
                상세 결과 보기
              </Link>
            ) : null}
          </div>
        </div>

        {feedback ? (
          <div
            role="status"
            style={{
              padding: "14px 16px",
              borderRadius: "18px",
              border: "1px solid var(--border)",
              background:
                feedback.kind === "error"
                  ? "rgba(196, 62, 47, 0.08)"
                  : feedback.kind === "pending"
                    ? "rgba(183, 131, 62, 0.1)"
                    : "rgba(25, 120, 74, 0.08)"
            }}
          >
            {feedback.message}
          </div>
        ) : null}

        {showRawPreview && rawPreview ? (
          <section
            style={{
              display: "grid",
              gap: "10px",
              padding: "18px",
              borderRadius: "20px",
              background: "#fffdf8",
              border: "1px solid var(--border)"
            }}
          >
            <h3 style={{ margin: 0 }}>추출 텍스트</h3>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "Consolas, monospace", lineHeight: 1.7 }}>{rawPreview}</pre>
          </section>
        ) : null}
      </section>
    </div>
  );
}

function formatInsuranceJoinDateDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  if (!digits) {
    return "";
  }

  if (digits.length <= 4) {
    return year;
  }

  if (digits.length <= 6) {
    return `${year}년 ${month}`;
  }

  return `${year}년 ${month}월 ${day}일`;
}

function toIsoDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length !== 8) {
    return "";
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

const cardStyle = {
  display: "grid",
  gap: "18px",
  padding: "28px",
  borderRadius: "26px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  background: "rgba(255,255,255,0.88)",
  boxShadow: "0 18px 42px rgba(27, 26, 23, 0.05)"
} as const;

const gridStyle = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
} as const;

const fieldStyle = {
  display: "grid",
  gap: "8px"
} as const;

const dropZoneStyle = {
  display: "grid",
  gap: "8px",
  padding: "30px 24px",
  borderRadius: "24px",
  border: "1px dashed rgba(22, 93, 86, 0.28)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,246,239,0.95) 100%)",
  textAlign: "center",
  cursor: "pointer"
} as const;

const fileItemStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  padding: "14px 16px",
  borderRadius: "18px",
  border: "1px solid rgba(62, 49, 31, 0.09)",
  background: "#fffdfa"
} as const;

const progressTrackStyle = {
  height: "12px",
  borderRadius: "999px",
  background: "#eee5d8",
  overflow: "hidden"
} as const;

const primaryButtonStyle = {
  border: "1px solid var(--accent)",
  borderRadius: "999px",
  padding: "12px 18px",
  background: "var(--accent)",
  color: "var(--accent-foreground)",
  cursor: "pointer",
  fontWeight: 700
} as const;

const ghostButtonStyle = {
  border: "1px solid rgba(62, 49, 31, 0.12)",
  borderRadius: "999px",
  padding: "12px 18px",
  background: "rgba(255,255,255,0.9)",
  cursor: "pointer",
  fontWeight: 600
} as const;

const ghostLinkStyle = {
  width: "fit-content",
  border: "1px solid rgba(62, 49, 31, 0.12)",
  borderRadius: "999px",
  padding: "12px 18px",
  textDecoration: "none",
  color: "inherit",
  fontWeight: 600,
  background: "rgba(255,255,255,0.9)"
} as const;
