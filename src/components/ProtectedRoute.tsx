import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        const validateToken = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/validate-token`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else if (response.status === 401 || response.status === 304) {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    setIsAuthenticated(false);
                } else {
                    // For other statuses, treat as invalid
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                setIsAuthenticated(false);
            }
        };

        validateToken();
    }, []);

    if (isAuthenticated === null) {
        // Loading state, perhaps show a spinner
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}