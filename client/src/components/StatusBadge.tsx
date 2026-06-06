type Status =
  | "pending"
  | "signed"
  | "completed"
  | "rejected"
  | "draft"
  | "viewed"
  | "expired";

const LABELS: Record<Status, string> = {
  pending:   "Pending",
  signed:    "Signed",
  completed: "Completed",
  rejected:  "Rejected",
  draft:     "Draft",
  viewed:    "Viewed",
  expired:   "Expired",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = (status || "draft") as Status;
  return (
    <span className={`badge badge-${s}`}>
      {LABELS[s] ?? status}
    </span>
  );
}
