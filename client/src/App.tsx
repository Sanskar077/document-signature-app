import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PDFPreview from "./pages/PDFPreview";
import SignaturePlacement from "./pages/SignaturePlacement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* PDF Preview */}
        <Route
          path="/preview/:id"
          element={<PDFPreview />}
        />

        {/* Signature Placement */}
        <Route
          path="/sign/:id"
          element={<SignaturePlacement />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;