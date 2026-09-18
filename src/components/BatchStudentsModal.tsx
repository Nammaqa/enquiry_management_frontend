import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

interface Student {
    id: number;
    name: string;
    email: string;
    phone: string;
    candidateStatus?: string;
}

interface BatchStudentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId: number | null;
    batchName?: string;
}

export default function BatchStudentsModal({ isOpen, onClose, batchId, batchName }: BatchStudentsModalProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && batchId) {
            fetchBatchDetails();
        }
    }, [isOpen, batchId]);

    const fetchBatchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest(`/api/batches/${batchId}/details`);
            if (response.success && response.data) {
                setStudents(response.data.enrolledStudents || []);
            } else {
                setStudents([]);
                console.warn('Unexpected batch details response:', response);
            }
        } catch (err) {
            console.error('Failed to fetch batch students:', err);
            setError('Failed to load students.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId: number) => {
        if (!confirm('Are you sure you want to remove this student from the batch?')) return;

        setLoading(true);
        setError(null);

        try {
            const response = await apiRequest(`/api/batches/students/remove`, {
                method: 'DELETE',
                body: { batchId, studentId }
            });

            if (response.success || response.message?.toLowerCase().includes('success')) {
                // Remove the student locally
                setStudents(students.filter(s => s.id !== studentId));
            } else {
                setError(response.message || 'Failed to remove student.');
            }
        } catch (err) {
            console.error('Error removing student:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove student.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                            Batch Students
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Students enrolled in {batchName || 'Batch'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        title="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
                    {/* Error / Loading */}
                    <div className="px-6 py-2">
                        {error && (
                            <div className="p-3 mb-2 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-50 border-y border-slate-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Email</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Status</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {loading && students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>Loading students...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No students enrolled in this batch.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 text-sm text-slate-800 font-medium">{student.name}</td>
                                            <td className="px-6 py-3 text-sm text-slate-600">{student.email}</td>
                                            <td className="px-6 py-3 text-sm text-slate-600">{student.phone}</td>
                                            <td className="px-6 py-3 text-sm text-slate-600 capitalize">{student.candidateStatus || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-right">
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                    disabled={loading}
                                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-rose-50 text-rose-600 rounded hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
