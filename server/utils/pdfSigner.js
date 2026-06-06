const fs = require("fs");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

/**
 * generateSignedPdf
 *
 * Supports all field types:
 *   - drawn   : embeds the actual drawn signature image (PNG data URL)
 *   - stamp   : embeds the actual stamp image (PNG/JPG data URL)
 *   - typed   : draws the typed name text in a script-style font
 *   - initials: draws the initials text
 *   - date    : draws formatted date
 *   - text    : draws arbitrary text
 *
 * Color support: reads sig.signatureColor (hex) if present.
 * Size support:  reads sig.width / sig.height for image-based sigs.
 */
const generateSignedPdf = async (inputPath, outputPath, signatures) => {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const signature of signatures) {
    const pageIndex = (signature.page || 1) - 1;
    const page = pages[pageIndex];
    if (!page) continue;

    const { width: pageW, height: pageH } = page.getSize();

    // Convert percentage-based positions to absolute PDF coordinates
    const x = (signature.x / 100) * pageW;
    // PDF Y-axis is bottom-up; invert from top-down percentage
    const y = pageH - (signature.y / 100) * pageH;

    const type = signature.type || "signature";

    // Parse color from hex string (e.g. "#1e3a8a" → rgb(0.12, 0.22, 0.54))
    const sigColor = parseHexColor(signature.signatureColor || signature.color || "#1e3a8a");

    switch (type) {
      case "drawn": {
        // Embed the actual drawn signature image
        const data = signature.data || signature.signatureImage;
        if (data && data.startsWith("data:")) {
          try {
            const embedded = await embedImageFromDataUrl(pdfDoc, data);
            const w = signature.width || 150;
            const h = signature.height || 60;
            // Draw image; PDF y is bottom-left, so shift up by height
            page.drawImage(embedded, {
              x,
              y: y - h,
              width: w,
              height: h,
            });
          } catch {
            // Fallback: text
            page.drawText("SIGNED", { x, y, size: 20, font, color: sigColor });
          }
        } else {
          page.drawText("SIGNED", { x, y, size: 20, font, color: sigColor });
        }
        break;
      }

      case "stamp": {
        // Embed the actual stamp image
        const stampData = signature.data || signature.stampImage || signature.signatureImage;
        if (stampData && stampData.startsWith("data:")) {
          try {
            const embedded = await embedImageFromDataUrl(pdfDoc, stampData);
            const w = signature.width || 120;
            const h = signature.height || 80;
            page.drawImage(embedded, {
              x,
              y: y - h,
              width: w,
              height: h,
            });
          } catch {
            // Fallback: stamp box
            page.drawRectangle({
              x: x - 2,
              y: y - 30,
              width: 100,
              height: 36,
              borderColor: sigColor,
              borderWidth: 1.5,
              color: rgb(0.92, 0.95, 1),
            });
            page.drawText("COMPANY STAMP", {
              x: x + 4,
              y: y - 18,
              size: 8,
              font,
              color: sigColor,
            });
          }
        } else {
          // No data URL: draw placeholder box
          page.drawRectangle({
            x: x - 2,
            y: y - 30,
            width: 100,
            height: 36,
            borderColor: sigColor,
            borderWidth: 1.5,
            color: rgb(0.92, 0.95, 1),
          });
          page.drawText("COMPANY STAMP", {
            x: x + 4,
            y: y - 18,
            size: 8,
            font,
            color: sigColor,
          });
        }
        break;
      }

      case "typed": {
        const text = parseTextFromData(signature.data, signature.signatureText) || "Signed";
        const fontSize = 22;
        page.drawText(text, { x, y, size: fontSize, font, color: sigColor });
        // Underline
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawLine({
          start: { x, y: y - 3 },
          end: { x: x + textWidth, y: y - 3 },
          thickness: 1,
          color: sigColor,
        });
        break;
      }

      case "initials": {
        const text = parseTextFromData(signature.data, signature.signatureText) || "??";
        const fontSize = 20;
        page.drawText(text, { x, y, size: fontSize, font, color: sigColor });
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawLine({
          start: { x, y: y - 3 },
          end: { x: x + textWidth, y: y - 3 },
          thickness: 1,
          color: sigColor,
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
        const text = parseTextFromData(signature.data, signature.signatureText) || "";
        page.drawText(text, {
          x,
          y,
          size: 11,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.1),
        });
        break;
      }

      case "signature":
      default: {
        // Legacy fallback — try to embed image if data URL present, else text
        const data = signature.data;
        if (data && data.startsWith("data:")) {
          try {
            const embedded = await embedImageFromDataUrl(pdfDoc, data);
            const w = signature.width || 150;
            const h = signature.height || 60;
            page.drawImage(embedded, { x, y: y - h, width: w, height: h });
          } catch {
            page.drawText("SIGNED", { x, y, size: 20, font: font, color: rgb(0, 0, 1) });
          }
        } else {
          page.drawText("SIGNED", { x, y, size: 20, font: font, color: rgb(0, 0, 1) });
          page.drawLine({
            start: { x, y: y - 3 },
            end: { x: x + 60, y: y - 3 },
            thickness: 1.5,
            color: rgb(0, 0, 0.85),
          });
        }
        break;
      }
    }
  }

  const signedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, signedPdfBytes);
  return outputPath;
};

/**
 * Embed image from a base64 data URL into the PDF document.
 * Supports PNG and JPEG.
 */
async function embedImageFromDataUrl(pdfDoc, dataUrl) {
  const [header, base64Data] = dataUrl.split(",");
  const imageBytes = Buffer.from(base64Data, "base64");
  if (header.includes("image/png")) {
    return await pdfDoc.embedPng(imageBytes);
  } else {
    // JPEG, WebP etc – pdf-lib only supports PNG and JPEG
    return await pdfDoc.embedJpg(imageBytes);
  }
}

/**
 * Parse text from stored data field.
 * Format for typed/initials: "textContent|styleId"
 */
function parseTextFromData(data, fallback) {
  if (fallback) return fallback.trim();
  if (!data) return null;
  if (typeof data === "string" && data.includes("|")) {
    return data.split("|")[0].trim();
  }
  return typeof data === "string" ? data.trim() : null;
}

/**
 * Convert hex color string to pdf-lib rgb() values.
 * Defaults to navy blue if parsing fails.
 */
function parseHexColor(hex) {
  try {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  } catch {
    return rgb(0.12, 0.22, 0.56);
  }
}

module.exports = { generateSignedPdf };
