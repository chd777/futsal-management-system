import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useContext(AuthContext);

  if (loading) return <div className="center">Loading...</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}
