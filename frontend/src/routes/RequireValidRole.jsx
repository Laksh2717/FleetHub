import { Navigate } from "react-router-dom";
import { getStoredRole } from "../utils/authUtils";

export default function RequireValidRole({ children, requiredRole }) {
  const role = getStoredRole();
  const allowedRoles = ["shipper", "carrier"];

  // If no role found, redirect to login
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  // If role is invalid, redirect to 404
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/404" replace />;
  }

  // If a specific role is required and user doesn't have it, redirect to 404
  if (requiredRole && role !== requiredRole.toLowerCase()) {
    return <Navigate to="/404" replace />;
  }

  return children;
}