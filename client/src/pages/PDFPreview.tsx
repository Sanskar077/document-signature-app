import { useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

pdfjs.GlobalWorkerOptions.workerSrc =
  "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs";

function PDFPreview() {
  const [numPages, setNumPages] = useState<number>(0);

  const [searchParams] = useSearchParams();

  const fileName = searchParams.get("file");

  if (!fileName) {
    return <h2>No PDF file specified.</h2>;
  }

  const pdfUrl = `http://localhost:5000/uploads/${fileName}`;

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center",
      }}
    >
      <h1>PDF Preview</h1>

      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => {
          setNumPages(numPages);
        }}
        onLoadError={(error) => {
          console.error("PDF Load Error:", error);
        }}
        loading={<h2>Loading PDF...</h2>}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {Array.from(
            { length: numPages },
            (_, index) => (
              <Page
                key={index}
                pageNumber={index + 1}
                width={1000}
              />
            )
          )}
        </div>
      </Document>
    </div>
  );
}

export default PDFPreview;