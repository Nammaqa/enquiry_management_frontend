import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';

import type { BillingDetails } from '../../types';

interface Log {
    id: number;
    title: string;
    description: string;
    author: string;
    timestamp: string;
}

interface ActivityTabsProps {
    enquiryId: number;
    billingDetails: BillingDetails | null;
    onUpdateBilling: (details: BillingDetails) => void;
    onSaveBilling: () => Promise<void>;
}

export default function ActivityTabs({ enquiryId, billingDetails, onUpdateBilling, onSaveBilling }: ActivityTabsProps) {
    const [activeTab, setActiveTab] = useState<'notes' | 'billing'>('notes');
    const [role, setRole] = useState<string | null>(null);

    // Notes/Logs State
    const [logs, setLogs] = useState<Log[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Billing state is now via props

    const [newLog, setNewLog] = useState({ title: '', description: '' });

    const [editingLogId, setEditingLogId] = useState<number | null>(null);


    // Fetch logs helper
    const fetchLogs = async () => {
        try {
            const response = await apiRequest<any[]>(`/api/logs/${enquiryId}`, {
                method: 'GET'
            });
            if (Array.isArray(response)) {
                const fetchedLogs: Log[] = response
                    .map(item => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        author: item.User?.name || item.User?.role || 'Unknown User',
                        timestamp: new Date(item.createdAt).toLocaleString()
                    }))
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort newest first
                setLogs(fetchedLogs);
            }
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        }
    };

    useEffect(() => {
        const storedRole = localStorage.getItem('userRole');
        setRole(storedRole);
        if (enquiryId) {
            fetchLogs();
        }
    }, [enquiryId]);

    const handleSaveLog = async () => {
        if (!newLog.title || !newLog.description) return;

        try {
            if (editingLogId) {
                // Edit existing log
                await apiRequest<{ message: string, log: any }>(`/api/logs/${editingLogId}`, {
                    method: 'PUT',
                    body: {
                        title: newLog.title,
                        description: newLog.description
                    }
                });
                alert('Log updated successfully!');
            } else {
                // Create new log
                await apiRequest<any[]>('/api/logs', {
                    method: 'POST',
                    body: {
                        enquiryId,
                        title: newLog.title,
                        description: newLog.description
                    }
                });
                alert('Log added successfully!');
            }

            // Refetch logs to update list
            await fetchLogs();

            // Cleanup
            setNewLog({ title: '', description: '' });
            setEditingLogId(null);
            setIsModalOpen(false);

        } catch (err: any) {
            console.error('Failed to save log:', err);
            if (err.message) {
                alert(`Error: ${err.message}`);
            } else {
                alert('Failed to save log. Please try again.');
            }
        }
    };

    const handleEditClick = (log: Log) => {
        setNewLog({ title: log.title, description: log.description });
        setEditingLogId(log.id);
        setIsModalOpen(true);
    };

    const isBillingAuthorized = role === 'ADMIN' || role === 'ACCOUNTS';

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full max-h-[600px]">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 flex-shrink-0">
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'notes'
                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    Call and Notes
                </button>
                {isBillingAuthorized && (
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex-1 py-3 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'billing'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        Accounts/Billing
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                <div className="p-6">
                    {activeTab === 'notes' ? (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        setEditingLogId(null);
                                        setNewLog({ title: '', description: '' });
                                        setIsModalOpen(true);
                                    }}
                                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Log a Call / Add Note
                                </button>
                            </div>

                            {logs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                    <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <p className="text-sm">No activity logs yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map(log => (
                                        <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-slate-800">{log.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">{log.timestamp}</span>
                                                    <button
                                                        onClick={() => handleEditClick(log)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-all"
                                                        title="Edit Log"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{log.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-200 pt-2">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                                                    {log.author.charAt(0).toUpperCase()}
                                                </div>
                                                <span>Logged by <span className="font-medium text-slate-700">{log.author}</span></span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="relative min-h-full flex flex-col">
                            {/* Authorized Content (blurred if not) */}
                            <div className={`flex-1 flex flex-col ${!isBillingAuthorized ? 'blur-sm select-none pointer-events-none' : ''}`}>

                                {!billingDetails ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-sm">No billing information initialized.</p>
                                        <button
                                            onClick={() => onUpdateBilling({ total: 0, paid: 0, discount: 0 })}
                                            className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-medium rounded-lg transition-colors border border-indigo-200"
                                        >
                                            Create Billing
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Header Stats */}
                                        <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                                            <div>
                                                <h3 className="font-semibold text-slate-800">Billing Details</h3>
                                                <p className="text-xs text-slate-500">Manage candidate payment info</p>
                                            </div>
                                            <div className={`flex gap-4 text-right ${role === 'ACCOUNTS' ? 'bg-indigo-50 p-2 rounded-lg border border-indigo-100' : ''}`}>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">Paid</p>
                                                    <p className="text-lg font-bold text-green-600">₹{billingDetails.paid.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">Balance</p>
                                                    <p className="text-lg font-bold text-rose-600">
                                                        ₹{Math.max(0, billingDetails.total - billingDetails.paid - billingDetails.discount).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Fields */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Total Package Cost</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={billingDetails.total || ''}
                                                        onChange={e => onUpdateBilling({ ...billingDetails, total: Number(e.target.value) })}
                                                        className="w-full pl-7 text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Discount</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={billingDetails.discount || ''}
                                                        onChange={e => onUpdateBilling({ ...billingDetails, discount: Number(e.target.value) })}
                                                        className="w-full pl-7 text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Amount Paid</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                    <input
                                                        type="number"
                                                        value={billingDetails.paid || ''}
                                                        onChange={e => onUpdateBilling({ ...billingDetails, paid: Number(e.target.value) })}
                                                        className="w-full pl-7 text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-2"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Balance Remaining</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={Math.max(0, billingDetails.total - billingDetails.paid - billingDetails.discount).toLocaleString()}
                                                        className="w-full pl-7 text-sm bg-slate-50 border-slate-300 rounded-lg shadow-sm text-slate-600 cursor-not-allowed py-2 font-medium bg-slate-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="flex justify-end py-4">
                                            <button
                                                onClick={() => onSaveBilling()}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors mb-4"
                                            >
                                                Update Billing
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lock Overlay */}
                            {!isBillingAuthorized && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-full shadow-sm mb-4">
                                        <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-slate-800 font-semibold mb-1">Unauthorised</h3>
                                    <p className="text-sm text-slate-500">You don't have permissions to view this section</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-800">{editingLogId ? 'Edit Log' : 'Log a Call / Add Note'}</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Log Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Initial Consultation Call"
                                    value={newLog.title}
                                    onChange={e => setNewLog({ ...newLog, title: e.target.value })}
                                    className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                                <textarea
                                    rows={4}
                                    placeholder="Enter details about the call or note..."
                                    value={newLog.description}
                                    onChange={e => setNewLog({ ...newLog, description: e.target.value })}
                                    className="w-full text-sm border-slate-300 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-2"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLog}
                                disabled={!newLog.title || !newLog.description}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                            >
                                {editingLogId ? 'Update Log' : 'Save Log'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}