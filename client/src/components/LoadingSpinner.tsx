export default function LoadingSpinner({
  text = "Loading…",
  fullPage = false,
}: {
  text?: string;
  fullPage?: boolean;
}) {
  if (fullPage) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p className="loading-text">{text}</p>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        justifyContent: "center",
        padding: "var(--space-8)",
      }}
    >
      <div className="spinner" style={{ width: 24, height: 24 }} />
      <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        {text}
      </span>
    </div>
  );
}
