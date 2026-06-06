import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoadingScreen() {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <p className="loading-text">Loading…</p>
    </div>
  );
}

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
