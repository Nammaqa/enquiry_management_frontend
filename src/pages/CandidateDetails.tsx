import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import type { Enquiry } from '../types';

interface LogEntry {
    id: number;
    title: string;
    description: string;
    author: string;
    createdAt: string;
}

export default function CandidateDetails() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const [enquiry, setEnquiry] = useState<Enquiry | null>(location.state?.enquiry || null);
    const [loading, setLoading] = useState(!location.state?.enquiry);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [newLog, setNewLog] = useState({ title: '', description: '' });
    const [savingStatus, setSavingStatus] = useState(false);
    const [savingLog, setSavingLog] = useState(false);
    const [expandedSection, setExpandedSection] = useState<'details' | 'logs' | 'status' | null>('details');
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [detailsForm, setDetailsForm] = useState<Partial<Enquiry>>({});

    const role = localStorage.getItem('userRole');
    const isCounsellor = role === 'COUNSELLOR';
    const statusOptions = isCounsellor
        ? ['enquiry stage', 'demo']
        : ['enquiry stage', 'demo', 'qualified demo', 'class', 'class qualified'];

    useEffect(() => {
        if (enquiry) {
            setSelectedStatus(enquiry.candidateStatus || 'enquiry stage');
            setDetailsForm({
                name: enquiry.name,
                email: enquiry.email,
                phone: enquiry.phone,
                current_location: enquiry.current_location,
                profession: enquiry.profession,
                referral: enquiry.referral,
                consent: enquiry.consent,
                trainingMode: enquiry.trainingMode,
                trainingTime: enquiry.trainingTime,
                startTime: enquiry.startTime,
                qualification: enquiry.qualification,
                experience: enquiry.experience,
            });
        }
    }, [enquiry]);

    const handleUpdateCandidate = async () => {
        if (!enquiry) return;

        const payload: Partial<Enquiry> = {
            ...detailsForm,
        };

        try {
            const response = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                method: 'PUT',
                body: payload,
            });

            setEnquiry({ ...enquiry, ...payload, ...(response || {}) });
            setIsEditingDetails(false);
        } catch (err) {
            console.error('Failed to update candidate details:', err);
            alert('Failed to update candidate details. Please try again.');
        }
    };

    useEffect(() => {
        if (enquiry) {
            setSelectedStatus(enquiry.candidateStatus || 'enquiry stage');
        }
    }, [enquiry]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            if (!enquiry) setLoading(true);
            try {
                const data = await apiRequest<Enquiry>(`/api/enquiries/${id}`, { method: 'GET' });
                setEnquiry(data);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch candidate details:', err);
                try {
                    const all = await apiRequest<Enquiry[]>('/api/enquiries', { method: 'GET' });
                    const found = all.find(e => e.id === Number(id));
                    if (found) {
                        setEnquiry(found);
                        setError(null);
                    } else {
                        setError('Candidate not found.');
                    }
                } catch (fallbackErr) {
                    console.error('Fallback fetch failed:', fallbackErr);
                    setError('Failed to load candidate data.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!enquiry) return;
            try {
                const response = await apiRequest<LogEntry[]>(`/api/logs/${enquiry.id}`, { method: 'GET' });
                setLogs(response);
            } catch (err) {
                console.error('Failed to fetch logs:', err);
                setLogs([]);
            }
        };

        fetchLogs();
    }, [enquiry]);

    const handleStageUpdate = async () => {
        if (!enquiry || selectedStatus === enquiry.candidateStatus) return;

        setSavingStatus(true);
        const previousStatus = enquiry.candidateStatus;
        setEnquiry(prev => prev ? { ...prev, candidateStatus: selectedStatus } : prev);

        try {
            const response = await apiRequest<{ message: string; enquiry: Enquiry }>('/api/enquiries/change-status', {
                method: 'POST',
                body: {
                    enquiryId: enquiry.id,
                    newStatus: selectedStatus,
                },
            });

            if (response?.enquiry) {
                setEnquiry(response.enquiry);
                setSelectedStatus(response.enquiry.candidateStatus || selectedStatus);
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            setEnquiry(prev => prev ? ({ ...prev, candidateStatus: previousStatus }) : prev);
            alert('Failed to update status. Please try again.');
        } finally {
            setSavingStatus(false);
        }
    };

    const handleSaveLog = async () => {
        if (!enquiry || !newLog.title.trim() || !newLog.description.trim()) return;

        setSavingLog(true);
        try {
            await apiRequest('/api/logs', {
                method: 'POST',
                body: {
                    enquiryId: enquiry.id,
                    title: newLog.title,
                    description: newLog.description,
                },
            });
            setNewLog({ title: '', description: '' });
            const response = await apiRequest<LogEntry[]>(`/api/logs/${enquiry.id}`, { method: 'GET' });
            setLogs(response);
        } catch (err) {
            console.error('Failed to save log:', err);
            alert('Unable to save call log. Please try again.');
        } finally {
            setSavingLog(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-indigo-600 font-medium animate-pulse">Loading candidate profile...</div>
            </div>
        );
    }

    if (error || !enquiry) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="text-rose-600 font-medium mb-4">{error || 'Candidate not found'}</div>
                <button
                    onClick={() => navigate('/enquiries')}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                    Back to Enquiries
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 -m-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/enquiries')}
                        className="p-2 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{enquiry.name}</h1>
                        <p className="text-sm text-slate-500">{enquiry.email} • {enquiry.phone}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-800">
                        Status: <span className="font-semibold text-slate-900">{enquiry.candidateStatus}</span>
                    </div>
                    <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-800">
                        Role: <span className="font-semibold text-slate-900">{role || 'USER'}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSection(prev => prev === 'details' ? null : 'details')}
                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Candidate Details</h2>
                            <p className="text-sm text-slate-500 mt-1">Review and edit core enquiry details.</p>
                        </div>
                        <span className={`text-2xl font-bold text-slate-400 transition-transform ${expandedSection === 'details' ? 'rotate-180' : ''}`}>
                            &minus;
                        </span>
                    </button>
                    {expandedSection === 'details' && (
                        <div className="px-6 pb-6 space-y-6 border-t border-slate-200">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm text-slate-500">Fields marked with * are editable.</div>
                                <button
                                    type="button"
                                    onClick={() => setIsEditingDetails(prev => !prev)}
                                    className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    {isEditingDetails ? 'Cancel edit' : 'Edit details'}
                                </button>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Name *</label>
                                    <input
                                        type="text"
                                        value={detailsForm.name || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Email *</label>
                                    <input
                                        type="email"
                                        value={detailsForm.email || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Phone *</label>
                                    <input
                                        type="tel"
                                        value={detailsForm.phone || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Location *</label>
                                    <input
                                        type="text"
                                        value={detailsForm.current_location || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, current_location: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Profession *</label>
                                    <input
                                        type="text"
                                        value={detailsForm.profession || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, profession: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Referral</label>
                                    <input
                                        type="text"
                                        value={detailsForm.referral || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, referral: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Consent</label>
                                    <select
                                        value={detailsForm.consent ? 'true' : 'false'}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, consent: e.target.value === 'true' }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    >
                                        <option value="true">Yes</option>
                                        <option value="false">No</option>
                                    </select>

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Qualification</label>
                                    <input
                                        type="text"
                                        value={detailsForm.qualification || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, qualification: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Training Mode</label>
                                    <input
                                        type="text"
                                        value={detailsForm.trainingMode || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, trainingMode: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Training Time</label>
                                    <input
                                        type="text"
                                        value={detailsForm.trainingTime || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, trainingTime: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Start Time</label>
                                    <input
                                        type="text"
                                        value={detailsForm.startTime || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Experience</label>
                                    <input
                                        type="text"
                                        value={detailsForm.experience || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, experience: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />
                                </div>
                            </div>

                            {isEditingDetails && (
                                <div className="flex flex-wrap gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleUpdateCandidate}
                                        className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        Save details
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingDetails(false);
                                            if (enquiry) {
                                                setDetailsForm({
                                                    name: enquiry.name,
                                                    email: enquiry.email,
                                                    phone: enquiry.phone,
                                                    current_location: enquiry.current_location,
                                                    profession: enquiry.profession,
                                                    referral: enquiry.referral,
                                                    consent: enquiry.consent,
                                                    trainingMode: enquiry.trainingMode,
                                                    trainingTime: enquiry.trainingTime,
                                                    startTime: enquiry.startTime,
                                                    qualification: enquiry.qualification,
                                                    experience: enquiry.experience,
                                                });
                                            }
                                        }}
                                        className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSection(prev => prev === 'logs' ? null : 'logs')}
                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Call Logs</h2>
                            <p className="text-sm text-slate-500 mt-1">View and add notes for this enquiry.</p>
                        </div>
                        <span className={`text-2xl font-bold text-slate-400 transition-transform ${expandedSection === 'logs' ? 'rotate-180' : ''}`}>
                            &minus;
                        </span>
                    </button>
                    {expandedSection === 'logs' && (
                        <div className="px-6 pb-6 space-y-6 border-t border-slate-200">
                            {logs.length === 0 ? (
                                <div className="text-sm text-slate-500">No call logs available yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map(log => (
                                        <div key={log.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <p className="font-semibold text-slate-900">{log.title}</p>
                                                <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="mt-3 text-sm text-slate-700">{log.description}</p>
                                            <p className="mt-3 text-xs text-slate-500">Created by {log.author}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="grid gap-4">
                                <input
                                    type="text"
                                    placeholder="Call title"
                                    value={newLog.title}
                                    onChange={(e) => setNewLog(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <textarea
                                    rows={4}
                                    placeholder="Add a note about the call"
                                    value={newLog.description}
                                    onChange={(e) => setNewLog(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={handleSaveLog}
                                    disabled={savingLog}
                                    className="inline-flex items-center justify-center w-max rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingLog ? 'Saving log...' : 'Save Call Log'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSection(prev => prev === 'status' ? null : 'status')}
                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Status</h2>
                            <p className="text-sm text-slate-500 mt-1">Manage the candidate's stage and demo status.</p>
                        </div>
                        <span className={`text-2xl font-bold text-slate-400 transition-transform ${expandedSection === 'status' ? 'rotate-180' : ''}`}>
                            &minus;
                        </span>
                    </button>
                    {expandedSection === 'status' && (
                        <div className="px-6 pb-6 space-y-6 border-t border-slate-200">
                            <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
                                <div className="grid gap-4">
                                    {isCounsellor ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Select Status</label>
                                            <select
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            >
                                                {statusOptions.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-sm text-slate-700">Current status</p>
                                            <p className="mt-2 text-base font-semibold text-slate-900">{enquiry.candidateStatus}</p>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs uppercase tracking-[0.16em] text-slate-500">Demo status</h3>
                                        <p className="mt-1 text-sm text-slate-900">
                                            {enquiry.demoStatus || (enquiry.candidateStatus === 'demo' ? 'Demo' : 'Not set')}
                                        </p>
                                    </div>
                                </div>

                                {isCounsellor && (
                                    <button
                                        onClick={handleStageUpdate}
                                        disabled={savingStatus || selectedStatus === enquiry.candidateStatus}
                                        className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingStatus ? 'Saving...' : 'Save Status'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
