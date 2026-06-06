import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PDFPreview from "./pages/PDFPreview";
import SignaturePlacement from "./pages/SignaturePlacement";
import PublicSign from "./pages/PublicSign";
import AuditTrail from "./pages/AuditTrail";
import Recipients from "./pages/Recipients";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public-sign/:token" element={<PublicSign />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preview/:id"
            element={
              <ProtectedRoute>
                <PDFPreview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sign/:id"
            element={
              <ProtectedRoute>
                <SignaturePlacement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit/:id"
            element={
              <ProtectedRoute>
                <AuditTrail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recipients/:id"
            element={
              <ProtectedRoute>
                <Recipients />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
