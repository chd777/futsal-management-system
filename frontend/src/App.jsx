import AdminClosures from "./pages/AdminClosures";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";

import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPitches from "./pages/AdminPitches";
import AdminBookings from "./pages/AdminBookings";
import AdminRevenue from "./pages/AdminRevenue";

import UserLayout from "./components/UserLayout";
import Home from "./pages/Home";
import BrowsePitches from "./pages/BrowsePitches";
import PitchDetail from "./pages/PitchDetail";
import MyBookings from "./pages/MyBookings";
import PaymentVerify from "./pages/PaymentVerify";

function AdminPage({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}

function UserPage({ children }) {
  return (
    <ProtectedRoute>
      <UserLayout>{children}</UserLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />
      <Route path="/admin/pitches" element={<AdminPage><AdminPitches /></AdminPage>} />
      <Route path="/admin/bookings" element={<AdminPage><AdminBookings /></AdminPage>} />
      <Route path="/admin/revenue" element={<AdminPage><AdminRevenue /></AdminPage>} />

      {/* User Routes */}
      <Route path="/home" element={<UserPage><Home /></UserPage>} />
      <Route path="/pitches" element={<UserPage><BrowsePitches /></UserPage>} />
      <Route path="/pitches/:id" element={<UserPage><PitchDetail /></UserPage>} />
      <Route path="/my-bookings" element={<UserPage><MyBookings /></UserPage>} />
      <Route path="/admin/closures" element={<AdminPage><AdminClosures /></AdminPage>} />

      {/* Payment callback - still protected but no layout wrapper needed */}
      <Route
        path="/payment/verify"
        element={
          <ProtectedRoute>
            <UserLayout><PaymentVerify /></UserLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<div className="center">404 - Not Found</div>} />
    </Routes>
  );
}