import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ConsumerNarrativeJson, InvestigatorNarrativeJson } from "@vnexus/shared";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 56;
const TOP_MARGIN = 72;
const BOTTOM_MARGIN = 64;
const LINE_GAP = 18;
const SECTION_GAP = 28;
const PARAGRAPH_GAP = 12;

type NarrativeDocument = InvestigatorNarrativeJson | ConsumerNarrativeJson;

async function buildNarrativePdf(
  narrative: NarrativeDocument,
  title: string,
  subject: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(title);
  pdfDoc.setSubject(subject);
  pdfDoc.setProducer("VNEXSUS V2");
  pdfDoc.setCreator("VNEXSUS V2");
  pdfDoc.setCreationDate(new Date(narrative.generatedAt));
  pdfDoc.setModificationDate(new Date());

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - TOP_MARGIN;

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY - heightNeeded < BOTTOM_MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - TOP_MARGIN;
    }
  };

  const drawFooter = () => {
    page.drawText("Confidential", {
      x: MARGIN_X,
      y: 24,
      size: 10,
      font: boldFont,
      color: rgb(0.65, 0.1, 0.1),
      opacity: 0.75
    });
  };

  const drawWrappedText = (text: string, fontSize: number, font: typeof regularFont, color = rgb(0.15, 0.15, 0.15)) => {
    const maxWidth = PAGE_WIDTH - MARGIN_X * 2;
    const words = text.split(/\s+/);
    let line = "";

    for (const word of words) {
      const candidate = line.length > 0 ? `${line} ${word}` : word;
      const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

      if (candidateWidth > maxWidth && line.length > 0) {
        ensureSpace(LINE_GAP);
        page.drawText(line, {
          x: MARGIN_X,
          y: cursorY,
          size: fontSize,
          font,
          color
        });
        cursorY -= LINE_GAP;
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line.length > 0) {
      ensureSpace(LINE_GAP);
      page.drawText(line, {
        x: MARGIN_X,
        y: cursorY,
        size: fontSize,
        font,
        color
      });
      cursorY -= LINE_GAP;
    }
  };

  drawWrappedText(title, 22, boldFont, rgb(0.1, 0.1, 0.1));
  cursorY -= 8;
  drawWrappedText(`Case ID: ${narrative.caseId}`, 11, regularFont, rgb(0.4, 0.4, 0.4));
  drawWrappedText(`Generated at: ${narrative.generatedAt}`, 11, regularFont, rgb(0.4, 0.4, 0.4));
  drawWrappedText(`Review status: ${narrative.requiresReview ? "requires review" : "clear"}`, 11, regularFont, rgb(0.4, 0.4, 0.4));
  cursorY -= SECTION_GAP;

  narrative.sections.forEach((section, index) => {
    ensureSpace(40);
    drawWrappedText(`${index + 1}. ${section.heading}`, 16, boldFont, rgb(0.12, 0.12, 0.12));

    if (section.requiresReview) {
      drawWrappedText("Review note: manual review is required for this section.", 11, regularFont, rgb(0.6, 0.25, 0.1));
    }

    if (section.paragraphs.length === 0) {
      drawWrappedText("No narrative paragraphs are available for this section.", 11, regularFont, rgb(0.4, 0.4, 0.4));
    } else {
      section.paragraphs.forEach((paragraph) => {
        drawWrappedText(paragraph, 12, regularFont);
        cursorY -= PARAGRAPH_GAP;
      });
    }

    cursorY -= SECTION_GAP;
  });

  pdfDoc.getPages().forEach((existingPage) => {
    page = existingPage;
    drawFooter();
  });

  return pdfDoc.save({ useObjectStreams: false });
}

export function buildInvestigatorReportPdf(narrative: InvestigatorNarrativeJson): Promise<Uint8Array> {
  return buildNarrativePdf(narrative, `Investigator Narrative Report - ${narrative.caseId}`, "Investigator narrative export");
}

export function buildConsumerReportPdf(narrative: ConsumerNarrativeJson): Promise<Uint8Array> {
  return buildNarrativePdf(narrative, `Consumer Narrative Report - ${narrative.caseId}`, "Consumer narrative export");
}
