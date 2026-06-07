import { useParams, useSearchParams, Link } from "react-router-dom";
  import { Document, Page, pdfjs } from "react-pdf";
  import { useState, useEffect } from "react";
  import { useAuth } from "../context/AuthContext";
  import Navbar from "../components/Navbar";
  import LoadingSpinner from "../components/LoadingSpinner";
  import "react-pdf/dist/Page/AnnotationLayer.css";
  import "react-pdf/dist/Page/TextLayer.css";

  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  export default function PDFPreview() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const { token } = useAuth();

    const [numPages, setNumPages] = useState<number>(0);
    const [loadError, setLoadError] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Prefer auth-protected /file endpoint (handles any stored path format)
    // Falls back to /uploads/<filename> for public share scenarios
    useEffect(() => {
      if (!id) return;
      let objectUrl: string | null = null;

      const headers: HeadersInit = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      fetch(`${API_BASE}/api/docs/${id}/file`, { headers })
        .then((res) => {
          if (!res.ok) {
            // Fallback: try direct /uploads/ URL using the ?file= param
            const fileName = searchParams.get("file");
            if (fileName) {
              return fetch(`${API_BASE}/uploads/${encodeURIComponent(fileName)}`);
            }
            throw new Error("File not found");
          }
          return res;
        })
        .then((res) => {
          if (!res.ok) throw new Error("File not found");
          return res.blob();
        })
        .then((blob) => {
          objectUrl = URL.createObjectURL(blob);
          setPdfBlobUrl(objectUrl);
        })
        .catch(() => setLoadError(true))
        .finally(() => setLoading(false));

      return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      };
    }, [id, token, searchParams]);

    if (!id) {
      return (
        <>
          <Navbar />
          <div className="loading-page">
            <p style={{ color: "var(--text-muted)" }}>No document specified.</p>
            <Link to="/dashboard" className="btn btn-secondary" style={{ marginTop: "var(--space-4)" }}>
              Back to Dashboard
            </Link>
          </div>
        </>
      );
    }

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
                    {numPages > 0 ? `${numPages} page${numPages !== 1 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>
              <Link to={`/sign/${id}`} className="btn btn-primary" id="go-to-sign-btn">
                ✍️ Sign This Document
              </Link>
            </div>

            {loading && <LoadingSpinner text="Loading PDF…" />}

            {loadError && !loading && (
              <div className="alert alert-error">
                <span>⚠</span>
                <span>
                  Failed to load PDF. The file may have been moved or deleted.
                  Try re-uploading the document from the{" "}
                  <Link to="/dashboard" style={{ color: "inherit", textDecoration: "underline" }}>
                    Dashboard
                  </Link>.
                </span>
              </div>
            )}

            {pdfBlobUrl && !loadError && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--space-5)",
                }}
              >
                <Document
                  file={pdfBlobUrl}
                  onLoadSuccess={({ numPages: n }) => {
                    setNumPages(n);
                    setLoadError(false);
                  }}
                  onLoadError={() => setLoadError(true)}
                  loading={null}
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
  