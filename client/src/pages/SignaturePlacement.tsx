import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

function DraggableSignature({
  x,
  y,
}: {
  x: number;
  y: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: "signature",
  });

  const style = {
    position: "absolute" as const,
    left: x,
    top: y,
    width: "150px",
    height: "60px",
    backgroundColor: "#2563eb",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "8px",
    cursor: "grab",
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      Signature
    </div>
  );
}

function SignaturePlacement() {
  const [position, setPosition] = useState({
    x: 100,
    y: 100,
  });

  return (
    <div style={{ padding: "20px" }}>
      <h1>Signature Placement</h1>

      <DndContext
        onDragEnd={(event) => {
          const { delta } = event;

          setPosition((prev) => ({
            x: prev.x + delta.x,
            y: prev.y + delta.y,
          }));
        }}
      >
        <div
          style={{
            position: "relative",
            width: "800px",
            height: "1000px",
            border: "1px solid #ccc",
            margin: "0 auto",
            backgroundColor: "#fff",
          }}
        >
          <DraggableSignature
            x={position.x}
            y={position.y}
          />
        </div>
      </DndContext>
    </div>
  );
}

export default SignaturePlacement;