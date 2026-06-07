import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import DrawSignature from "./DrawSignature";
import TypedSignature from "./TypedSignature";
import InitialsTab from "./InitialsTab";
import StampTab from "./StampTab";

export type SignatureResult = {
  type: "typed" | "drawn" | "initials" | "stamp";
  text?: string;
  style?: number;
  color?: string;
  dataUrl?: string;
};

type Props = {
  onSave: (result: SignatureResult) => void;
  onClose: () => void;
};

const TABS = [
  { id: "typed", label: "✏️ Type" },
  { id: "drawn", label: "🖊 Draw" },
  { id: "initials", label: "🔤 Initials" },
  { id: "stamp", label: "🏢 Stamp" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SignatureModal({ onSave, onClose }: Props) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("typed");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} id="signature-modal">
        {/* Header */}
        <div className="modal-header">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Add Signature
          </h2>
          <button className="btn-icon" onClick={onClose} id="close-modal-btn" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              id={`tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-body">
          {activeTab === "typed" && (
            <TypedSignature
              defaultName={user?.name ?? ""}
              onSave={(text, style, color, dataUrl) =>
                onSave({ type: "typed", text, style, color, dataUrl })
              }
            />
          )}
          {activeTab === "drawn" && (
            <DrawSignature
              name={user?.name}
              onSave={(dataUrl) => onSave({ type: "drawn", dataUrl })}
            />
          )}
          {activeTab === "initials" && (
            <InitialsTab
              defaultName={user?.name ?? ""}
              onSave={(text, style, color, dataUrl) =>
                onSave({ type: "initials", text, style, color, dataUrl })
              }
            />
          )}
          {activeTab === "stamp" && (
            <StampTab
              onSave={(dataUrl) => onSave({ type: "stamp", dataUrl })}
            />
          )}
        </div>
      </div>
    </div>
  );
}
