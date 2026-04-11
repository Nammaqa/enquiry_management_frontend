import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import type { PlacementApplication } from '../types';

export default function StudentPlacementList() {
    const [applications, setApplications] = useState<PlacementApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [statusError, setStatusError] = useState<string | null>(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        // TODO: Integrate API endpoint when ready
        // Temporarily disabled - showing "No records found" message
        /*
        setLoading(true);
        try {
            const response = await apiRequest<ApiResponse>('/api/user-placement/all-applications', { method: 'GET' });
            if (response.success) {
                setApplications(response.data);
            } else {
                setError('Failed to fetch applications.');
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError('An error occurred while fetching applications.');
        } finally {
            setLoading(false);
        }
        */
        setLoading(false);
        setApplications([]);
    };

    const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
        setUpdatingId(applicationId);
        setStatusError(null);
        try {
            await apiRequest(`/api/user-placement/applications/${applicationId}/status`, {
                method: 'PATCH',
                body: { job_status: newStatus },
            });
            // Update the status locally so the badge reflects the change immediately
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === applicationId ? { ...app, job_status: newStatus } : app
                )
            );
        } catch (err) {
            console.error('Error updating status:', err);
            setStatusError(`Failed to update status for application #${applicationId}.`);
            // Auto-clear the error after 4 seconds
            setTimeout(() => setStatusError(null), 4000);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredApplications = applications.filter(app => 
        app.enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobPost.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobPost.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-indigo-600 font-medium animate-pulse">Loading placement applications...</div>
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">No Records Found</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        There are no job placement applications at the moment. Placement records will appear here once students apply for jobs.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full text-left">
                        <div className="relative text-left">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by student name, job title, or company..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all text-left"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {statusError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                    {statusError}
                </div>
            )}

            {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-slate-500 text-sm">No matching applications found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Details</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Applied</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Current Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applied Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-left">
                                {filteredApplications.map((app) => {
                                    const isUpdating = updatingId === app.id;
                                    return (
                                        <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900">{app.enquiry.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{app.enquiry.email}</div>
                                                <div className="text-xs text-slate-400">{app.enquiry.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-indigo-600">{app.jobPost.jobTitle}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{app.jobPost.companyName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {app.jobPost.location}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${app.job_status === 'selected' ? 'bg-green-100 text-green-700' : 
                                                      app.job_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 
                                                      'bg-amber-100 text-amber-700'}`}>
                                                    {app.job_status.charAt(0).toUpperCase() + app.job_status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {new Date(app.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleUpdateStatus(app.id, 'selected')}
                                                        disabled={isUpdating}
                                                        className={`p-1.5 rounded-lg transition-colors
                                                            ${isUpdating
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                                        title="Mark as Selected"
                                                    >
                                                        {isUpdating ? (
                                                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(app.id, 'rejected')}
                                                        disabled={isUpdating}
                                                        className={`p-1.5 rounded-lg transition-colors
                                                            ${isUpdating
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                                                        title="Mark as Rejected"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
