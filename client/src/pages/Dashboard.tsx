import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

type DocumentType = {
  _id: string;
  originalName: string;
  status: string;
  fileSize: number;
  fileName: string;
};

function Dashboard() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/docs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDocuments(res.data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading documents...</h2>;
  }

  return (
    <div>
      <h1>My Documents</h1>

      {documents.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul>
          {documents.map((doc) => (
            <li
              key={doc._id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <p>
                <strong>File:</strong> {doc.originalName}
              </p>

              <p>
                <strong>Status:</strong> {doc.status}
              </p>

              <p>
                <strong>Size:</strong>{" "}
                {(doc.fileSize / 1024).toFixed(2)} KB
              </p>

              <Link
                to={`/preview/${doc._id}?file=${doc.fileName}`}
              >
                Preview PDF
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Dashboard;