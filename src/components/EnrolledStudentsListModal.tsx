import { useState, useEffect, useMemo, useRef } from 'react';
import { apiRequest } from '../utils/api';

interface BatchInfo {
    id: number;
    name: string;
    code: string;
}

interface EnrolledStudent {
    id: number;
    name: string;
    email: string;
    phone: string;
    candidateStatus: string;
    enrolledBatches: BatchInfo[];
}

interface EnrolledStudentsListModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EnrolledStudentsListModal({ isOpen, onClose }: EnrolledStudentsListModalProps) {
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            fetchEnrolledStudents();
            // Reset filters when modal opens
            setSearchQuery('');
            setSelectedBatchIds([]);
            setIsDropdownOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchEnrolledStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest('/api/batches/students/enrollment');
            if (response.success) {
                // Filter to only those who are enrolled in at least one batch
                const enrolledOnly = response.data.filter((s: EnrolledStudent) => s.enrolledBatches && s.enrolledBatches.length > 0);
                setStudents(enrolledOnly);
            } else {
                setError(response.message || 'Failed to fetch students.');
            }
        } catch (err) {
            console.error('Error fetching enrolled students:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch students.');
        } finally {
            setLoading(false);
        }
    };

    const allBatches = useMemo(() => {
        const batchMap = new Map<number, BatchInfo>();
        students.forEach(s => {
            s.enrolledBatches.forEach(b => {
                if (!batchMap.has(b.id)) {
                    batchMap.set(b.id, b);
                }
            });
        });
        return Array.from(batchMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [students]);

    const filteredStudents = useMemo(() => {
        let result = students;

        if (selectedBatchIds.length > 0) {
            result = result.filter(s => 
                s.enrolledBatches.some(b => selectedBatchIds.includes(b.id))
            );
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(s => 
                s.name.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                s.phone.includes(q) ||
                s.enrolledBatches.some(b => b.name.toLowerCase().includes(q) || (b.code && b.code.toLowerCase().includes(q)))
            );
        }

        return result;
    }, [students, searchQuery, selectedBatchIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            Enrolled Students List
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Overview of all candidates currently enrolled in batches</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap sm:flex-nowrap justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Search by student, email, phone, or batch name/code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full sm:w-auto px-4 py-2 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 flex items-center justify-between gap-2 min-w-[160px]"
                        >
                            <span className="truncate">
                                {selectedBatchIds.length > 0 
                                    ? `${selectedBatchIds.length} batch${selectedBatchIds.length > 1 ? 'es' : ''} selected` 
                                    : 'Filter by Batch'}
                            </span>
                            <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 sm:right-auto sm:left-auto sm:right-0 mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-20 max-h-60 flex flex-col">
                                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-md">
                                    <span className="text-xs font-semibold text-slate-700">Select Batches</span>
                                    {selectedBatchIds.length > 0 && (
                                        <button 
                                            onClick={() => setSelectedBatchIds([])}
                                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                                <div className="p-2 overflow-y-auto flex-1">
                                    {allBatches.length === 0 ? (
                                        <div className="text-sm text-slate-500 p-2 text-center">No batches found</div>
                                    ) : (
                                        allBatches.map(batch => (
                                            <label key={batch.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer transition-colors">
                                                <div className="flex items-center h-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBatchIds.includes(batch.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedBatchIds([...selectedBatchIds, batch.id]);
                                                            } else {
                                                                setSelectedBatchIds(selectedBatchIds.filter(id => id !== batch.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm text-slate-700 font-medium truncate">{batch.name}</span>
                                                    {batch.code && <span className="text-[10px] text-slate-500 truncate uppercase tracking-wide">{batch.code}</span>}
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-slate-200">
                            No enrolled students found matching the criteria.
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Student Name</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Phone</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Enrolled Batches</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{student.email}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{student.phone}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {student.enrolledBatches.map(batch => (
                                                        <span key={batch.id} className="inline-flex flex-col bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 shadow-sm">
                                                            <span className="font-medium">{batch.name}</span>
                                                            {batch.code && <span className="text-[10px] text-slate-400">{batch.code}</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
