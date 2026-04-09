import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import EnrollmentModal from '../components/EnrollmentModal';

// Types
interface Subject {
    id: number;
    name: string;
    code: string;
}

interface Batch {
    id: number;
    name: string;
    code: string;
    status: 'yet to start' | 'In progress' | 'completed';
    sessionLink?: string;
    sessionDate?: string;
    sessionEndDate?: string;
    sessionTime?: string;
    sessionQr?: string;
    numberOfStudents?: number;
    subjectId?: number;
    instructorId?: number;
    image?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const MoreVerticalIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
);

const STATUS_OPTIONS = ['yet to start', 'In progress', 'completed'];

export default function Batches() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [instructors, setInstructors] = useState<Array<{ id: number; name: string; email?: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

    // Role-based UI controls
    const [isCounsellor, setIsCounsellor] = useState(false);

    // Enrollment Modal state
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
    const [enrollmentBatchId, setEnrollmentBatchId] = useState<number | null>(null);
    const [enrollmentBatchName, setEnrollmentBatchName] = useState<string>('');

    // QR Preview modal
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    const [qrPreviewSrc, setQrPreviewSrc] = useState<string | null>(null);
    const [qrPreviewTitle, setQrPreviewTitle] = useState('');



    // Form state
    const [batchForm, setBatchForm] = useState({
        name: '',
        code: '',
        status: 'yet to start' as 'yet to start' | 'In progress' | 'completed',
        sessionLink: '',
        sessionDate: '',
        sessionEndDate: '',
        sessionTime: '',
        numberOfStudents: 0,
        subjectId: null as number | null,
        instructorId: null as number | null,
        image: '',
    });

    // Fetch batches and subjects on mount
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        setIsCounsellor(role === 'COUNSELLOR');
        fetchBatches();
        fetchSubjects();
        fetchInstructors();
    }, []);

    // Fetch Instructors (users with role=instructor)
    const fetchInstructors = async () => {
        try {
            const data = await apiRequest('/api/users/instructors', { method: 'GET' });
            // API returns { success, data: [...] }
            if (Array.isArray(data)) {
                setInstructors(data as any);
            } else if (data && typeof data === 'object' && 'data' in data) {
                setInstructors(Array.isArray((data as any).data) ? (data as any).data : []);
            } else {
                setInstructors([]);
            }
        } catch (err) {
            console.error('Error fetching instructors:', err);
            setInstructors([]);
        }
    };

    // Fetch Batches
    const fetchBatches = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Fetching batches from /api/batches...');
            const data = await apiRequest<Batch[]>('/api/batches', {
                method: 'GET',
            });
            console.log('Batches response:', data);

            if (Array.isArray(data)) {
                console.log(`Successfully fetched ${data.length} batches`);
                setBatches(data);
            } else if (data && typeof data === 'object' && 'data' in data) {
                const batchesArray = Array.isArray((data as any).data) ? (data as any).data : [];
                console.log(`Extracted ${batchesArray.length} batches from nested response`);
                setBatches(batchesArray);
            } else {
                console.warn('Unexpected batches response format:', data);
                setBatches([]);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch batches';
            setError(errorMessage);
            console.error('Error fetching batches:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Subjects
    const fetchSubjects = async () => {
        try {
            const data = await apiRequest<Subject[]>('/api/subjects', {
                method: 'GET',
            });
            setSubjects(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching subjects:', err);
            setSubjects([]);
        }
    };

    // Show session QR as image
    const showQrPreview = (batch: Batch) => {
        const raw = batch.sessionQr || '';
        if (!raw) return;
        let src = raw;
        if (!/^data:/.test(src) && !/^https?:\/\//.test(src)) {
            src = `data:image/png;base64,${src}`;
        }
        setQrPreviewSrc(src);
        setQrPreviewTitle(batch.name || 'Session QR');
        setIsQrPreviewOpen(true);
    };



    // Helper to convert ISO date string to YYYY-MM-DD format for date inputs
    const formatDateForInput = (dateString?: string): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return '';
        }
    };

    // Open modal for create
    const openModal = (batch?: Batch) => {
        if (batch) {
            setEditingBatch(batch);
            setBatchForm({
                name: batch.name,
                code: batch.code,
                status: batch.status,
                sessionLink: batch.sessionLink || '',
                sessionDate: formatDateForInput(batch.sessionDate),
                sessionEndDate: formatDateForInput(batch.sessionEndDate),
                sessionTime: batch.sessionTime || '',
                numberOfStudents: batch.numberOfStudents || 0,
                subjectId: batch.subjectId || null,
                instructorId: (batch as any).instructorId || ((batch as any).instructor ? (batch as any).instructor.id : null) || null,
                image: batch.image || '',
            });
        } else {
            setEditingBatch(null);
            setBatchForm({
                name: '',
                code: '',
                status: 'yet to start',
                sessionLink: '',
                sessionDate: '',
                sessionEndDate: '',
                sessionTime: '',
                numberOfStudents: 0,
                subjectId: null,
                instructorId: null,
                image: '',
            });
        }
        setError(null);
        setIsModalOpen(true);
    };

    // Save batch
    const saveBatch = async () => {
        // Validate required fields
        if (!batchForm.name || !batchForm.code || !batchForm.sessionDate || !batchForm.sessionTime) {
            setError('Batch Name, Code, Session Date, and Session Time are required');
            return;
        }

        setFormLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('name', batchForm.name);
            formData.append('code', batchForm.code);
            formData.append('status', batchForm.status);
            formData.append('sessionLink', batchForm.sessionLink);
            formData.append('sessionDate', batchForm.sessionDate);
            formData.append('sessionEndDate', batchForm.sessionEndDate);
            formData.append('sessionTime', batchForm.sessionTime);
            formData.append('numberOfStudents', batchForm.numberOfStudents.toString());
            if (batchForm.subjectId != null) formData.append('subjectId', batchForm.subjectId.toString());
            if (batchForm.instructorId != null) formData.append('instructorId', batchForm.instructorId.toString());

            // Log FormData for debugging
            console.log('Batch FormData being sent:');
            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
                } else {
                    console.log(`  ${key}: ${value}`);
                }
            }

            // image input removed from UI (left in code earlier) — no file appended

            if (editingBatch) {
                // Update batch
                console.log('Updating batch:', editingBatch.id);
                await apiRequest(`/api/batches/${editingBatch.id}`, {
                    method: 'PUT',
                    body: formData,
                    isFormData: true,
                });
            } else {
                // Create batch
                console.log('Creating new batch');
                await apiRequest('/api/batches/create', {
                    method: 'POST',
                    body: formData,
                    isFormData: true,
                });
            }
            await fetchBatches();
            setIsModalOpen(false);
            setBatchForm({
                name: '',
                code: '',
                status: 'yet to start',
                sessionLink: '',
                sessionDate: '',
                sessionEndDate: '',
                sessionTime: '',
                numberOfStudents: 0,
                subjectId: null,
                image: '',
                instructorId: 0
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error saving batch:', err);
        } finally {
            setFormLoading(false);
        }
    };

    // Delete batch
    const deleteBatch = async (id: number) => {
        if (!confirm('Are you sure you want to delete this batch?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiRequest(`/api/batches/${id}`, {
                method: 'DELETE',
            });
            await fetchBatches();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete batch');
            console.error('Error deleting batch:', err);
        } finally {
            setLoading(false);
        }
    };

    // Get subject name by ID
    const getSubjectName = (subjectId: number | undefined) => {
        if (!subjectId) return 'N/A';
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? `${subject.name} (${subject.code})` : 'N/A';
    };

    // Get instructor display name by ID or from batch object
    const getInstructorName = (instructorId: number | undefined, batchObj?: any) => {
        // Prefer nested instructor object on the batch if present
        if (batchObj && batchObj.instructor && batchObj.instructor.name) return batchObj.instructor.name;
        if (!instructorId) return 'N/A';
        const inst = instructors.find(i => i.id === instructorId);
        return inst ? `${inst.name}${inst.email ? ` (${inst.email})` : ''}` : 'N/A';
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">Batches</h1>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon />
                    Create Batch
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Batches Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Batch Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Instructor</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Students</th>
                                {/* <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Image</th> */}
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && batches.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        Loading batches...
                                    </td>
                                </tr>
                            ) : batches.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        No batches found. Click "Create Batch" to create one.
                                    </td>
                                </tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-slate-800">{batch.name}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{batch.code}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{getSubjectName(batch.subjectId)}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{getInstructorName(batch.instructorId, batch)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${batch.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                batch.status === 'In progress' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{batch.numberOfStudents || 0}</td>
                                        {/* image column removed from UI */}
                                        <td className="px-4 py-3 text-right">
                                            {batch.sessionQr && (
                                                <button
                                                    onClick={() => showQrPreview(batch)}
                                                    title="Preview Session QR"
                                                    className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 px-2 py-1 rounded transition-colors"
                                                >
                                                    <EyeIcon />
                                                </button>
                                            )}
                                            {!isCounsellor && (
                                                <button
                                                    onClick={() => {
                                                        setEnrollmentBatchId(batch.id);
                                                        setEnrollmentBatchName(batch.name);
                                                        setIsEnrollmentModalOpen(true);
                                                    }}
                                                    title="Enrollments"
                                                    className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 px-2 py-1 rounded transition-colors"
                                                >
                                                    <MoreVerticalIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openModal(batch)}
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded transition-colors"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => deleteBatch(batch.id)}
                                                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 px-2 py-1 rounded transition-colors ml-1"
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {isQrPreviewOpen && qrPreviewSrc && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => { setIsQrPreviewOpen(false); setQrPreviewSrc(null); }}
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-800">{qrPreviewTitle}</h3>
                            <button
                                onClick={() => { setIsQrPreviewOpen(false); setQrPreviewSrc(null); }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <img
                                src={qrPreviewSrc}
                                alt="Session QR Code"
                                className="max-w-full max-h-[60vh] rounded-lg border border-slate-200 object-contain"
                            />
                            <a
                                href={qrPreviewSrc}
                                download={`${qrPreviewTitle.replace(/\s+/g, '_')}_QR.png`}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                            >
                                Download QR
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <EnrollmentModal
                isOpen={isEnrollmentModalOpen}
                onClose={() => setIsEnrollmentModalOpen(false)}
                batchId={enrollmentBatchId}
                batchName={enrollmentBatchName}
            />

            {/* Batch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingBatch ? 'Edit Batch' : 'Create Batch'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-6 px-6 py-4">
                            {/* Left Column - Form Fields */}
                            <div className="space-y-4">
                                {/* Error Message in Modal */}
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Batch Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={batchForm.name}
                                        onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Python Batch 2024"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Batch Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={batchForm.code}
                                        onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., PY-2024-001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={batchForm.status}
                                        onChange={(e) => setBatchForm({ ...batchForm, status: e.target.value as any })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Subject
                                    </label>
                                    <select
                                        value={batchForm.subjectId || ''}
                                        onChange={(e) => setBatchForm({ ...batchForm, subjectId: parseInt(e.target.value) || null })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">-- Select a Subject --</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name} ({subject.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
                                    <select
                                        value={batchForm.instructorId ?? ''}
                                        onChange={(e) => setBatchForm({ ...batchForm, instructorId: parseInt(e.target.value) || null })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">-- Select an Instructor --</option>
                                        {instructors.map(inst => (
                                            <option key={inst.id} value={inst.id}>{inst.name}{inst.email ? ` (${inst.email})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Number of Students
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={batchForm.numberOfStudents}
                                        onChange={(e) => setBatchForm({ ...batchForm, numberOfStudents: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Session Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={batchForm.sessionDate}
                                        onChange={(e) => setBatchForm({ ...batchForm, sessionDate: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Session End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={batchForm.sessionEndDate}
                                        onChange={(e) => setBatchForm({ ...batchForm, sessionEndDate: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Session Time *
                                    </label>
                                    <input
                                        type="time"
                                        value={batchForm.sessionTime}
                                        onChange={(e) => setBatchForm({ ...batchForm, sessionTime: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Session Link
                                    </label>
                                    <input
                                        type="url"
                                        value={batchForm.sessionLink}
                                        onChange={(e) => setBatchForm({ ...batchForm, sessionLink: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="https://zoom.us/..."
                                    />
                                </div>


                            </div>

                            {/* image upload UI removed */}
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveBatch}
                                disabled={formLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {formLoading ? 'Saving...' : editingBatch ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
