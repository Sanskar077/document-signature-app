const fs = require("fs");
  const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

  const generateSignedPdf = async (inputPath, outputPath, signatures) => {
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const sig of signatures) {
      const pageIndex = (sig.page || 1) - 1;
      const page = pages[pageIndex];
      if (!page) continue;

      const { width: pageW, height: pageH } = page.getSize();
      const xPct = typeof sig.x === "number" ? sig.x : parseFloat(sig.x) || 0;
      const yPct = typeof sig.y === "number" ? sig.y : parseFloat(sig.y) || 0;
      const x = (xPct / 100) * pageW;
      const y = pageH - (yPct / 100) * pageH;
      const type = sig.type || "signature";
      const sigColor = parseHex(sig.signatureColor || sig.color || "#1e3a8a");

      const imageData = sig.signatureImage || sig.stampImage ||
        (sig.data && typeof sig.data === "string" && sig.data.startsWith("data:") ? sig.data : null);

      if (imageData?.startsWith("data:")) {
        try {
          const img = await embedImg(pdfDoc, imageData);
          const w = sig.width || 180;
          const h = sig.height || 72;
          page.drawImage(img, { x, y: y - h, width: w, height: h });
          continue;
        } catch (_) { /* fall through to text */ }
      }

      switch (type) {
        case "typed": case "initials": {
          const text = parseText(sig.data, sig.signatureText) || (type === "initials" ? "??" : "Signed");
          const sz = 24;
          page.drawText(text, { x, y, size: sz, font, color: sigColor });
          const tw = font.widthOfTextAtSize(text, sz);
          page.drawLine({ start: { x, y: y - 3 }, end: { x: x + tw, y: y - 3 }, thickness: 1.5, color: sigColor });
          break;
        }
        case "date": {
          const dateStr = sig.dateValue || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
          page.drawText(dateStr, { x, y, size: 12, font: fontReg, color: rgb(0.25, 0.25, 0.25) });
          break;
        }
        default: {
          page.drawText("SIGNED", { x, y, size: 22, font, color: sigColor });
          page.drawLine({ start: { x, y: y - 3 }, end: { x: x + 70, y: y - 3 }, thickness: 1.5, color: sigColor });
        }
      }
    }

    fs.writeFileSync(outputPath, await pdfDoc.save());
    return outputPath;
  };

  async function embedImg(pdfDoc, dataUrl) {
    const [header, b64] = dataUrl.split(",");
    if (!b64) throw new Error("Invalid data URL");
    const bytes = Buffer.from(b64, "base64");
    if (header.includes("image/png")) return await pdfDoc.embedPng(bytes);
    if (header.includes("image/jpeg") || header.includes("image/jpg")) return await pdfDoc.embedJpg(bytes);
    try { return await pdfDoc.embedPng(bytes); } catch { return await pdfDoc.embedJpg(bytes); }
  }

  function parseText(data, fallback) {
    if (fallback && typeof fallback === "string") return fallback.trim();
    if (!data || typeof data !== "string" || data.startsWith("data:")) return null;
    if (data.includes("|")) return data.split("|")[0].trim();
    return data.trim();
  }

  function parseHex(hex) {
    try {
      const c = hex.replace("#", "");
      const r = parseInt(c.substring(0,2),16)/255, g = parseInt(c.substring(2,4),16)/255, b = parseInt(c.substring(4,6),16)/255;
      if (isNaN(r)||isNaN(g)||isNaN(b)) throw new Error();
      return rgb(r, g, b);
    } catch { return rgb(0.12, 0.22, 0.56); }
  }

  module.exports = { generateSignedPdf };
  