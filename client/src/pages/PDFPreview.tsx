import { useParams, useSearchParams, Link } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use the version-matched CDN worker — works reliably in both dev and prod
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
          <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: "var(--space-4)" }}>
            Back to Dashboard
          </Link>
        </div>
      </>
    );
  }

  const pdfUrl = `${API_BASE}/uploads/${fileName}`;

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
                <p className="page-subtitle">
                  {numPages} page{numPages !== 1 ? "s" : ""}
                </p>
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
                onLoadSuccess={({ numPages: n }) => {
                  setNumPages(n);
                  setLoadError(false);
                }}
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
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    <Page
                      pageNumber={i + 1}
                      width={Math.min(900, window.innerWidth - 64)}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
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
