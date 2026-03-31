const API_URL = import.meta.env.VITE_API_URL;

interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    isFormData?: boolean;
}

export const apiRequest = async <T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
): Promise<T> => {
    const token = localStorage.getItem('authToken');

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method: options.method || 'GET',
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    // Handle FormData (for file uploads)
    if (options.isFormData && options.body instanceof FormData) {
        // Remove Content-Type header to let browser set it automatically with boundary
        if (config.headers && typeof config.headers === 'object' && 'Content-Type' in config.headers) {
            delete (config.headers as Record<string, string>)['Content-Type'];
        }
        config.body = options.body;
    } else if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = '/login';
            throw new Error('Unauthorized');
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        throw error;
    }

    return response.json();
};

export default apiRequest;
