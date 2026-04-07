import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import nammaqa from '../assets/nammaqa.jpg';

interface LoginResponse {
    message: string;
    token: string;
    role: string;
}

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('authToken')) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const response = await apiRequest<LoginResponse>('/api/auth/login', {
                method: 'POST',
                body: { email, password },
            });

            // Store token in localStorage
            localStorage.setItem('authToken', response.token);

            // Optional: Store role if needed
            if (response.role) {
                localStorage.setItem('userRole', response.role);
            }

            // Redirect to dashboard first after successful login
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const err = error as { status?: number; message?: string };
            // Handle 401 or other errors
            if (err.status === 401) {
                setError('Invalid credentials. Please try again.');
            } else {
                setError(err.message || 'An error occurred during login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                    <img
                        src={nammaqa}
                        alt="Logo"
                        className="h-12 w-auto"
                    />
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-center text-gray-800">
                    Enquiry Portal
                </h2>
                <p className="text-sm text-center text-gray-500 mb-6">
                    Please sign in to your account
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Forgot Password */}
                    <div className="flex justify-end">
                        <a
                            href="#"
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            Forgot password?
                        </a>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white
                            font-semibold py-2.5 rounded-lg transition duration-200 shadow-md
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer
                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <a href="#" className="text-indigo-600 font-medium hover:underline">
                        Sign up
                    </a>
                </p> */}
            </div>
        </div>
    );
};

export default LoginPage;