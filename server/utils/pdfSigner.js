const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");

const generateSignedPdf = async (
  inputPath,
  outputPath,
  signatures
) => {
  const pdfBytes = fs.readFileSync(inputPath);

  const pdfDoc = await PDFDocument.load(
    pdfBytes
  );

  const pages = pdfDoc.getPages();

  signatures.forEach((signature) => {
    const page =
      pages[signature.page - 1];

    if (!page) return;

    const { width, height } =
      page.getSize();

    const x =
      (signature.x / 100) * width;

    const y =
      height -
      (signature.y / 100) * height;

    page.drawText("SIGNED", {
      x,
      y,
      size: 20,
      color: rgb(0, 0, 1),
    });
  });

  const signedPdfBytes =
    await pdfDoc.save();

  fs.writeFileSync(
    outputPath,
    signedPdfBytes
  );

  return outputPath;
};

module.exports = {
  generateSignedPdf,
};