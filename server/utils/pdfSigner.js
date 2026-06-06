const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * generateSignedPdf
 *
 * Extended to support multiple field types:
 *   - signature  (existing): draws "SIGNED" text in blue
 *   - typed      (new):      draws the typed name in script style
 *   - initials   (new):      draws initials in bold
 *   - date       (new):      draws formatted date
 *   - text       (new):      draws arbitrary text
 *   - stamp      (new):      would embed image (requires data URL in sig.data)
 *
 * Backward compatible: existing signatures with no `type` field
 * are treated as type === "signature".
 */
const generateSignedPdf = async (inputPath, outputPath, signatures) => {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  signatures.forEach((signature) => {
    const page = pages[signature.page - 1];
    if (!page) return;

    const { width, height } = page.getSize();

    // Convert percentage-based positions to absolute PDF coordinates
    const x = (signature.x / 100) * width;
    // PDF Y-axis is bottom-up; invert from top-down percentage
    const y = height - (signature.y / 100) * height;

    const type = signature.type || "signature";

    switch (type) {
      case "typed":
      case "initials": {
        // Draw the actual name/initials text
        const text = parseTextFromData(signature.data) || "Signed";
        page.drawText(text, {
          x,
          y,
          size: type === "initials" ? 18 : 22,
          font,
          color: rgb(0.12, 0.22, 0.56),   // navy blue
        });
        // Underline
        const textWidth = font.widthOfTextAtSize(text, type === "initials" ? 18 : 22);
        page.drawLine({
          start: { x, y: y - 3 },
          end: { x: x + textWidth, y: y - 3 },
          thickness: 1,
          color: rgb(0.12, 0.22, 0.56),
        });
        break;
      }

      case "date": {
        const dateStr = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        page.drawText(dateStr, {
          x,
          y,
          size: 11,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.3),
        });
        break;
      }

      case "text": {
        const text = parseTextFromData(signature.data) || "";
        page.drawText(text, {
          x,
          y,
          size: 11,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.1),
        });
        break;
      }

      case "stamp": {
        // Stamp: draw a rectangular badge (image embedding requires async, simplified here)
        page.drawRectangle({
          x: x - 2,
          y: y - 24,
          width: 90,
          height: 30,
          borderColor: rgb(0.12, 0.22, 0.56),
          borderWidth: 1.5,
          color: rgb(0.92, 0.95, 1),
        });
        page.drawText("COMPANY STAMP", {
          x,
          y: y - 12,
          size: 8,
          font,
          color: rgb(0.12, 0.22, 0.56),
        });
        break;
      }

      case "drawn":
      case "signature":
      default: {
        // Original behaviour — preserved exactly
        page.drawText("SIGNED", {
          x,
          y,
          size: 20,
          color: rgb(0, 0, 1),
        });
        // Add a decorative underline
        page.drawLine({
          start: { x, y: y - 3 },
          end: { x: x + 60, y: y - 3 },
          thickness: 1.5,
          color: rgb(0, 0, 0.85),
        });
        break;
      }
    }
  });

  const signedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, signedPdfBytes);
  return outputPath;
};

/**
 * Parse text from stored data field.
 * Format for typed/initials: "textContent|styleId"
 */
function parseTextFromData(data) {
  if (!data) return null;
  if (typeof data === "string" && data.includes("|")) {
    return data.split("|")[0].trim();
  }
  return typeof data === "string" ? data.trim() : null;
}

module.exports = { generateSignedPdf };