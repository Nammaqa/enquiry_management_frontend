import { Navigate } from "react-router";

export default function RootRedirect() {
  const isAuthenticated = Boolean(localStorage.getItem('authToken'));

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}