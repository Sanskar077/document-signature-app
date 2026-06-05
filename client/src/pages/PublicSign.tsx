import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PublicSign() {
  const { token } = useParams();

  const [document, setDocument] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const [position, setPosition] = useState({
    x: 100,
    y: 100,
  });

  useEffect(() => {
    fetchDocument();
  }, []);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/public-sign/${token}`
      );

      setDocument(res.data.document);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveSignature = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/public-sign/${token}/sign`,
        {
          x: position.x,
          y: position.y,
          page: 1,
        }
      );

      console.log(res.data);

      alert("Signature saved successfully");
    } catch (error) {
      console.error(error);

      alert("Failed to save signature");
    }
  };

  if (loading) {
    return (
      <h2
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Loading...
      </h2>
    );
  }

  if (!document) {
    return (
      <h2
        style={{
          textAlign: "center",
          marginTop: "50px",
        }}
      >
        Invalid Link
      </h2>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          textAlign: "center",
        }}
      >
        Public Sign Page
      </h1>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px",
          marginTop: "20px",
        }}
      >
        <p>
          <strong>Document:</strong>{" "}
          {document.originalName}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {document.status}
        </p>

        <p>
          Token validated successfully.
        </p>
      </div>

      <div
        style={{
          position: "relative",
          width: "800px",
          height: "500px",
          border: "2px solid #ccc",
          marginTop: "30px",
          backgroundColor: "#f8f9fa",
          overflow: "hidden",
        }}
        onClick={(e) => {
          const rect =
            e.currentTarget.getBoundingClientRect();

          setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
        }}
      >
        <div
          style={{
            position: "absolute",
            left: position.x,
            top: position.y,
            width: "150px",
            height: "60px",
            backgroundColor: "#2563eb",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            borderRadius: "8px",
            fontWeight: "bold",
          }}
        >
          Signature
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
        }}
      >
        <button
          onClick={saveSignature}
          style={{
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#2563eb",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

export default PublicSign;