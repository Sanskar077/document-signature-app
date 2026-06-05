import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function PublicSign() {
  const { token } = useParams();

  const [document, setDocument] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

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

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!document) {
    return <h2>Invalid Link</h2>;
  }

  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      <h1>Public Sign Page</h1>

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
  );
}

export default PublicSign;