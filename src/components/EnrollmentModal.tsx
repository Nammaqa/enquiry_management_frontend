import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

interface Student {
    id: number;
    name: string;
    email: string;
    phone: string;
    candidateStatus: string;
    packageId?: number;
    enrolledBatches?: { id: number; name: string }[];
    packageName?: string | null;
    subjectNames?: string[];
}

interface EnrollmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    batchId: number | null;
    batchName?: string; // Add this prop
}

export default function EnrollmentModal({ isOpen, onClose, batchId, batchName }: EnrollmentModalProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search states
    const [nameSearch, setNameSearch] = useState('');
    const [batchSearch, setBatchSearch] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchStudents();
            setSelectedIds(new Set());
            setNameSearch('');
            setBatchSearch('');
        }
    }, [isOpen]);

    const fetchStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest('/api/batches/students/enrollment');
            if (response.success && Array.isArray(response.data)) {
                setStudents(response.data);
            } else if (Array.isArray(response)) {
                setStudents(response);
            } else {
                setStudents([]);
                console.warn('Unexpected enrollment response:', response);
            }
        } catch (err) {
            console.error('Failed to fetch enrollment students:', err);
            setError('Failed to load students.');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        const allIds = filteredStudents.map(s => s.id);
        setSelectedIds(new Set(allIds));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const handleSave = async () => {
        if (!batchId) {
            setError('No batch selected.');
            return;
        }

        if (selectedIds.size === 0) {
            setError('Please select at least one student to enroll.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                batchId: batchId,
                studentIds: Array.from(selectedIds)
            };

            const response = await apiRequest('/api/batches/students/addstudent-tobatch', {
                method: 'POST',
                body: payload
            });

            if (response.success) {
                console.log('Enrollment success:', response.message);
                onClose();
            } else {
                setError(response.message || 'Failed to enroll students.');
            }
        } catch (err) {
            console.error('Error saving enrollments:', err);
            setError(err instanceof Error ? err.message : 'Failed to save enrollments.');
        } finally {
            setLoading(false);
        }
    };

    // Filter students based on search terms
    const filteredStudents = students.filter(student => {
        const matchesName = student.name.toLowerCase().includes(nameSearch.toLowerCase()) ||
            student.email.toLowerCase().includes(nameSearch.toLowerCase());

        const enrolledBatchNames = student.enrolledBatches?.map(b => b.name.toLowerCase()).join(' ') || '';
        const matchesBatch = batchSearch === '' || enrolledBatchNames.includes(batchSearch.toLowerCase());

        return matchesName && matchesBatch;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            Viewing Enrollments for {batchName || 'Batch'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Select students to enroll in this batch</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-3">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={nameSearch}
                                onChange={(e) => setNameSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search by enrolled batch..."
                                value={batchSearch}
                                onChange={(e) => setBatchSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSelectAll}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleDeselectAll}
                            className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
                        >
                            Deselect All
                        </button>
                        <span className="text-xs text-slate-400 ml-auto">
                            {selectedIds.size} selected
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Loading students...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-rose-500 text-sm">{error}</div>
                    ) : students.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No students found available for enrollment.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase w-10"></th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Name</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Email</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Interested Package</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Interested Subjects</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase">Enrolled Batches</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">
                                            No matches found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => {
                                        const isSelected = selectedIds.has(student.id);
                                        return (
                                            <tr
                                                key={student.id}
                                                className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                                onClick={() => toggleSelect(student.id)}
                                            >
                                                <td className="px-6 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => { }}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-800 font-medium">{student.name}</td>
                                                <td className="px-6 py-3 text-sm text-slate-600">{student.email}</td>
                                                <td className="px-6 py-3 text-sm text-slate-600">{student.phone}</td>
                                                <td className="px-6 py-3 text-sm text-slate-600">
                                                    {student.packageName || '-'}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-600">
                                                    {student.subjectNames && student.subjectNames.length > 0
                                                        ? student.subjectNames.join(', ')
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="px-6 py-3 text-sm text-slate-600" title={student.enrolledBatches?.map(b => b.name.trim()).filter(Boolean).join(', ') || 'None'}>
                                                    {student.enrolledBatches && student.enrolledBatches.length > 0
                                                        ? student.enrolledBatches.map(b => b.name.trim()).filter(Boolean).join(', ')
                                                        : 'None'
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Save Enrollments
                    </button>
                </div>
            </div>
        </div>
    );
}