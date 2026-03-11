import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function AdminRoute({ children }) {
  const { loading, isAuthed, user } = useContext(AuthContext);

  if (loading) return <div className="center">Loading...</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/home" replace />;

  return children;
}
