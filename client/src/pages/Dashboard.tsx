import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";

type DocumentType = {
  _id: string;
  originalName: string;
  status: string;
  fileSize: number;
  fileName: string;
  createdAt: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/docs", {
        headers: authHeader,
      });
      setDocuments(res.data.documents);
    } catch {
      /* handled silently */
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File must be smaller than 20 MB.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    const form = new FormData();
    form.append("document", file);

    try {
      await axios.post("http://localhost:5000/api/docs/upload", form, {
        headers: { ...authHeader, "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess(`"${file.name}" uploaded successfully!`);
      await fetchDocuments();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleGenerateLink = async (docId: string) => {
    setShareLoadingId(docId);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/public-sign/${docId}`,
        {},
        { headers: authHeader }
      );
      const url = res.data.publicUrl as string;
      setShareLinks((prev) => ({ ...prev, [docId]: url }));
    } catch {
      /* ignored */
    } finally {
      setShareLoadingId(null);
    }
  };

  const handleFinalize = async (docId: string) => {
    try {
      await axios.post(
        `http://localhost:5000/api/docs/${docId}/finalize`,
        {},
        { headers: authHeader }
      );
      alert("Signed PDF generated successfully!");
      await fetchDocuments();
    } catch {
      alert("Finalize failed. Make sure a signature exists first.");
    }
  };

  /* Stats */
  const total = documents.length;
  const pending = documents.filter((d) => d.status === "pending").length;
  const signed = documents.filter((d) => d.status === "signed").length;

  const STATS = [
    { label: "Total Documents", value: total, sub: "Uploaded" },
    { label: "Pending Signature", value: pending, sub: "Awaiting action" },
    { label: "Signed", value: signed, sub: "Completed" },
  ];

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: "var(--space-8)", paddingBottom: "var(--space-12)" }}>

          {/* Page header */}
          <div className="page-header">
            <h1 className="page-title">
              Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="page-subtitle">
              Manage your documents, signatures, and sharing links.
            </p>
          </div>

          {/* Stats row */}
          <div className="stats-grid" style={{ marginBottom: "var(--space-8)" }}>
            {STATS.map((s) => (
              <div className="stat-card" key={s.label}>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.value}</p>
                <p className="stat-sub">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Upload zone */}
          <div style={{ marginBottom: "var(--space-8)" }}>
            <div className="section-header">
              <div>
                <h2 className="section-title">Upload Document</h2>
                <p className="section-desc">PDF files only · max 20 MB</p>
              </div>
            </div>

            <div
              className={`upload-zone${dragOver ? " drag-over" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              id="upload-dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                id="file-input"
              />

              {uploading ? (
                <LoadingSpinner text="Uploading…" />
              ) : (
                <>
                  <div className="upload-icon">
                    {dragOver ? "📂" : "📤"}
                  </div>
                  <p className="upload-title">
                    {dragOver
                      ? "Drop your PDF here"
                      : "Click to upload or drag & drop"}
                  </p>
                  <p className="upload-desc">PDF documents only</p>
                </>
              )}
            </div>

            {uploadError && (
              <div className="alert alert-error mt-4">
                <span>⚠</span> {uploadError}
              </div>
            )}
            {uploadSuccess && (
              <div className="alert alert-success mt-4">
                <span>✓</span> {uploadSuccess}
              </div>
            )}
          </div>

          {/* Documents list */}
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">My Documents</h2>
                <p className="section-desc">
                  {total} document{total !== 1 ? "s" : ""} total
                </p>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner fullPage text="Loading documents…" />
            ) : documents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📁</div>
                <p className="empty-title">No documents yet</p>
                <p className="empty-desc">
                  Upload your first PDF above to get started with signing.
                </p>
              </div>
            ) : (
              <div className="doc-grid">
                {documents.map((doc) => (
                  <div className="doc-card" key={doc._id} id={`doc-card-${doc._id}`}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)" }}>
                      <div className="doc-card-icon">📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="doc-card-name" title={doc.originalName}>
                          {doc.originalName}
                        </p>
                        <p className="doc-card-meta">
                          {formatSize(doc.fileSize)} · {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>

                    {/* Actions */}
                    <div className="doc-card-actions">
                      <Link
                        to={`/preview/${doc._id}?file=${doc.fileName}`}
                        className="btn btn-secondary btn-sm"
                        id={`preview-btn-${doc._id}`}
                      >
                        Preview
                      </Link>
                      <Link
                        to={`/sign/${doc._id}`}
                        className="btn btn-secondary btn-sm"
                        id={`sign-btn-${doc._id}`}
                      >
                        ✍️ Sign
                      </Link>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleFinalize(doc._id)}
                        id={`finalize-btn-${doc._id}`}
                      >
                        📥 Finalize
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleGenerateLink(doc._id)}
                        disabled={shareLoadingId === doc._id}
                        id={`share-btn-${doc._id}`}
                      >
                        {shareLoadingId === doc._id ? "…" : "🔗 Share"}
                      </button>
                    </div>

                    {/* Share link display */}
                    {shareLinks[doc._id] && (
                      <div
                        style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          padding: "var(--space-3)",
                          marginTop: "var(--space-2)",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginBottom: "var(--space-2)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          Public Signing Link
                        </p>
                        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                          <input
                            readOnly
                            value={shareLinks[doc._id]}
                            className="form-input"
                            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
                            id={`share-link-${doc._id}`}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              navigator.clipboard.writeText(shareLinks[doc._id]);
                            }}
                            id={`copy-link-btn-${doc._id}`}
                          >
                            Copy
                          </button>
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
                          Expires in 7 days
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}