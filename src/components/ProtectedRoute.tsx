import type { JSX } from "react";
import { Navigate } from "react-router";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const isAuthenticated = Boolean(localStorage.getItem('authToken'));

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}