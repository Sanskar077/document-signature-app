import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import axios from "axios";

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
    userSelect: "none" as const,
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
  const pageWidth = 800;
  const pageHeight = 1000;

  const [position, setPosition] = useState({
    x: 100,
    y: 100,
  });

  const [relativePosition, setRelativePosition] =
    useState({
      x: 12.5,
      y: 10,
    });

  const saveSignature = async () => {
    try {
      const token = localStorage.getItem("token");

      const documentId =
        window.location.pathname.split("/").pop();

      const response = await axios.post(
        "http://localhost:5000/api/signatures",
        {
          documentId,
          x: relativePosition.x,
          y: relativePosition.y,
          page: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(response.data);

      alert("Signature saved successfully");
    } catch (error) {
      console.error(error);

      alert("Failed to save signature");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Signature Placement</h1>

      <DndContext
        onDragEnd={(event) => {
          const { delta } = event;

          setPosition((prev) => {
            const newX = prev.x + delta.x;
            const newY = prev.y + delta.y;

            const xPercent =
              (newX / pageWidth) * 100;

            const yPercent =
              (newY / pageHeight) * 100;

            setRelativePosition({
              x: Number(
                xPercent.toFixed(2)
              ),
              y: Number(
                yPercent.toFixed(2)
              ),
            });

            return {
              x: newX,
              y: newY,
            };
          });
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
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

      <div
        style={{
          marginTop: "20px",
          textAlign: "center",
        }}
      >
        <h3>Relative Coordinates</h3>

        <p>
          <strong>X:</strong>{" "}
          {relativePosition.x}%
        </p>

        <p>
          <strong>Y:</strong>{" "}
          {relativePosition.y}%
        </p>

        <button
          onClick={saveSignature}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

export default SignaturePlacement;