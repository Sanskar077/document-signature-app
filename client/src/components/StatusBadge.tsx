type Status =
    | "pending"
    | "signed"
    | "completed"
    | "rejected"
    | "draft"
    | "viewed"
    | "expired"
    | "in_progress"
    | "partially_signed";

  const LABELS: Record<Status, string> = {
    pending:          "Pending",
    signed:           "Signed",
    completed:        "Completed",
    rejected:         "Rejected",
    draft:            "Draft",
    viewed:           "Viewed",
    expired:          "Expired",
    in_progress:      "In Progress",
    partially_signed: "Partial",
  };

  const CLASS_MAP: Partial<Record<Status, string>> = {
    in_progress:      "badge-in-progress",
    partially_signed: "badge-viewed",
    completed:        "badge-completed",
  };

  export default function StatusBadge({ status }: { status: string }) {
    const s = (status || "draft") as Status;
    const cls = CLASS_MAP[s] ?? `badge-${s.replace("_", "-")}`;
    return (
      <span className={`badge ${cls}`}>
        {LABELS[s] ?? status}
      </span>
    );
  }
  