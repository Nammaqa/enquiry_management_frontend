import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function LoginGuard({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Validate token
            const validateToken = async () => {
                try {
                    const apiUrl = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
                    const response = await fetch(`${apiUrl}/api/auth/validate-token`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    if (response.status === 200) {
                        navigate('/dashboard', { replace: true });
                    } else {
                        // For 401, 304, or other invalid statuses, clear token and stay on login
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('userRole');
                    }
                } catch (error) {
                    // Error validating, clear token and stay on login
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userRole');
                }
            };
            validateToken();
        }
    }, [navigate]);

    return <>{children}</>;
}