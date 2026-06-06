import { useParams, useSearchParams, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";

pdfjs.GlobalWorkerOptions.workerSrc =
  "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs";

export default function PDFPreview() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [numPages, setNumPages] = useState<number>(0);
  const [loadError, setLoadError] = useState(false);

  const fileName = searchParams.get("file");

  if (!fileName) {
    return (
      <>
        <Navbar />
        <div className="loading-page" style={{ paddingTop: "var(--navbar-h)" }}>
          <p style={{ color: "var(--text-muted)" }}>No PDF file specified.</p>
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  const pdfUrl = `http://localhost:5000/uploads/${fileName}`;

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div
          className="container"
          style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}
        >
          <div className="page-header">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                ← Dashboard
              </Link>
              <div>
                <h1 className="page-title">PDF Preview</h1>
                <p className="page-subtitle">{numPages} page{numPages !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <Link
              to={`/sign/${id}`}
              className="btn btn-primary"
              id="go-to-sign-btn"
            >
              ✍️ Sign This Document
            </Link>
          </div>

          {loadError ? (
            <div className="alert alert-error">
              Failed to load PDF. The file may have been moved or deleted.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--space-5)",
              }}
            >
              <Document
                file={pdfUrl}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                onLoadError={() => setLoadError(true)}
                loading={<LoadingSpinner text="Loading PDF…" />}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      boxShadow: "var(--shadow-lg)",
                      borderRadius: "var(--radius)",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Page
                      pageNumber={i + 1}
                      width={Math.min(900, window.innerWidth - 64)}
                    />
                  </div>
                ))}
              </Document>
            </div>
          )}
        </div>
      </div>
    </>
  );
}