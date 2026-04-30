
import { useState, useEffect } from 'react';
import { apiRequest, type ApiRequestOptions } from '../utils/api';

// Types
interface Subject {
    id: number;
    name: string;
    code: string;
    domain?: string;
    mode?: string;
    type?: string;
    description?: string;
    duration?: number;
    image?: string;
    overview?: string;
    syllabus?: string;
    prerequisites?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface Package {
    id: number;
    name: string;
    code: string;
    domain?: string;
    mode?: string;
    type?: string;
    description?: string;
    duration?: number;
    image?: string;
    overview?: string;
    syllabus?: string;
    prerequisites?: string;
    createdAt?: string;
    updatedAt?: string;
    Subjects: Subject[];
}

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const domains = [
    {
        name: 'Testing',
        code: 'TST',
        type: 'Domain',
        description: 'Software Testing and Quality Assurance',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Development',
        code: 'DEV',
        type: 'Domain',
        description: 'Web and Application Development',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Cybersecurity',
        code: 'CYB',
        type: 'Domain',
        description: 'Cybersecurity and Information Security',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Devops',
        code: 'DOP',
        type: 'Domain',
        description: 'DevOps and Infrastructure Management',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'AI/ML',
        code: 'AIM',
        type: 'Domain',
        description: 'Artificial Intelligence and Machine Learning',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'Data Analytics',
        code: 'DAT',
        type: 'Domain',
        description: 'Data Analytics and Business Intelligence',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: 'UI/UX Design',
        code: 'UIX',
        type: 'Domain',
        description: 'User Interface and User Experience Design',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

export default function PackageSubject() {
    const [activeTab, setActiveTab] = useState<'subjects' | 'packages'>('subjects');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal states
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [editingPackage, setEditingPackage] = useState<Package | null>(null);

    // Form states
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', domain: 'Testing', mode: 'Online', type: 'starter', description: '', duration: '', image: '', overview: '', syllabus: '', prerequisites: ''});
    const [packageForm, setPackageForm] = useState({ name: '', code: '', domain: 'Testing', mode: 'Online', type: 'starter', description: '', duration: '', image: '', overview: '', syllabus: '', prerequisites: '', subjectIds: [] as number[], });
    const [subjectSearchQuery, setSubjectSearchQuery] = useState(''); // Modal search
    const [tableSubjectSearchQuery, setTableSubjectSearchQuery] = useState('');
    const [tablePackageSearchQuery, setTablePackageSearchQuery] = useState('');
    const [currentSubjectPage, setCurrentSubjectPage] = useState(1);
    const [currentPackagePage, setCurrentPackagePage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Fetch data on mount and tab change
    useEffect(() => {
        fetchSubjects();
        fetchPackages();
    }, []);

    // Fetch Subjects
    const fetchSubjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiRequest<Subject[]>('/api/subjects', {
                method: 'GET',
            });
            setSubjects(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
            console.error('Error fetching subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Packages
    const fetchPackages = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiRequest<Package[]>('/api/packages', {
                method: 'GET',
            });

            // Normalize package subjects: backend may return `subjects` or `Subjects`
            const normalized = data.map(p => ({
                ...p,
                Subjects: (p as any).Subjects || (p as any).subjects || []
            }) as Package);

            setPackages(normalized);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch packages');
            console.error('Error fetching packages:', err);
        } finally {
            setLoading(false);
        }
    };

    // Subject CRUD
    const openSubjectModal = (subject?: Subject) => {
        if (subject) {
            setEditingSubject(subject);
            setSubjectForm({
                name: subject.name,
                code: subject.code,
                domain: subject.domain || 'Testing',
                mode: subject.mode || 'Online',
                type: subject.type || 'starter',
                description: subject.description || '',
                duration: subject.duration?.toString() || '',
                image: subject.image || '',
                overview: subject.overview || '',
                syllabus: subject.syllabus || '',
                prerequisites: subject.prerequisites || ''
            });
        } else {
            setEditingSubject(null);
            setSubjectForm({ name: '', code: '', domain: 'Testing', mode: 'Online', type: 'starter', description: '', duration: '', image: '', overview: '', syllabus: '', prerequisites: '' });
        }
        setError(null);
        setSuccessMessage(null);
        setIsSubjectModalOpen(true);
    };

    const saveSubject = async () => {
        if (!subjectForm.name || !subjectForm.code) {
            setError('⚠️ Subject name and code are mandatory fields');
            return;
        }


        if (formLoading) return; // Prevent multiple simultaneous saves

        setFormLoading(true);
        setError(null);

        try {
            // Create FormData for subject details
            const formData = new FormData();
            formData.append('name', subjectForm.name);
            formData.append('code', subjectForm.code);
            formData.append('domain', subjectForm.domain || 'Testing');
            formData.append('mode', subjectForm.mode || 'Online');
            formData.append('type', subjectForm.type || 'starter');
            formData.append('description', subjectForm.description || '');
            formData.append('duration', subjectForm.duration || '');

            // Append image file if selected (backend will handle Cloudinary upload)
            const imageInput = document.querySelector('input[type="file"]#subjectImageFile') as HTMLInputElement;
            if (imageInput && imageInput.files && imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            // Append JSON fields as JSON strings
          if (subjectForm.overview) {
    formData.append('overview', subjectForm.overview);
}
if (subjectForm.syllabus) {
    formData.append('syllabus', subjectForm.syllabus);
}
if (subjectForm.prerequisites) {
    formData.append('prerequisites', subjectForm.prerequisites);
}

            if (editingSubject) {
                // Update subject
                await apiRequest(`/api/subjects/${editingSubject.id}`, {
                    method: 'PUT',
                    body: formData,
                    isFormData: true,
                });
                setSuccessMessage(`Subject "${subjectForm.name}" updated successfully`);
                setIsSubjectModalOpen(false);
                setSubjectForm({
                    name: '',
                    code: '',
                    domain: 'Testing',
                    mode: 'Online',
                    type: 'starter',
                    description: '',
                    duration: '',
                    image: '',
                    overview: '',
                    syllabus: '',
                    prerequisites: ''
                });
                await fetchSubjects();
                // Only fetch packages if subject name changed (might be displayed in package lists)
                if (editingSubject.name !== subjectForm.name) {
                    await fetchPackages();
                }
            } else {
                // Create subject
                await apiRequest('/api/subjects', {
                    method: 'POST',
                    body: formData,
                    isFormData: true,
                });
                setSuccessMessage(`Subject "${subjectForm.name}" created successfully`);
                setIsSubjectModalOpen(false);
                setSubjectForm({
                    name: '',
                    code: '',
                    domain: 'Testing',
                    mode: 'Online',
                    type: 'starter',
                    description: '',
                    duration: '',
                    image: '',
                    overview: '',
                    syllabus: '',
                    prerequisites: ''
                });
                await fetchSubjects();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error saving subject:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const deleteSubject = async (id: number) => {
        const subjectToDelete = subjects.find(s => s.id === id);
        if (!subjectToDelete) return;

        if (!confirm('Are you sure you want to delete this subject?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiRequest(`/api/subjects/${id}`, {
                method: 'DELETE',
            });

            // Find associated packages
            const associatedPackages = packages.filter(pkg =>
                pkg.Subjects.some(subject => subject.id === id)
            );

            let message = `Subject "${subjectToDelete.name}" deleted successfully`;
            if (associatedPackages.length > 0) {
                const packageNames = associatedPackages.map(pkg => pkg.name).join(', ');
                message += ` (was associated with package${associatedPackages.length > 1 ? 's' : ''}: ${packageNames})`;
            }

            setSuccessMessage(message);
            await fetchSubjects();
            await fetchPackages(); // Refresh packages as they might be affected
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete subject');
            console.error('Error deleting subject:', err);
        } finally {
            setLoading(false);
        }
    };

    // Package CRUD
    const openPackageModal = (pkg?: Package) => {
        if (pkg) {
            setEditingPackage(pkg);
            // Convert Subjects array to subjectIds array
            const subjectIds = pkg.Subjects.map(s => s.id);
            setPackageForm({
                name: pkg.name,
                code: pkg.code,
                domain: pkg.domain || 'Testing',
                mode: pkg.mode || 'Online',
                type: pkg.type || 'starter',
                description: pkg.description || '',
                duration: pkg.duration?.toString() || '',
                image: pkg.image || '',
                overview: pkg.overview || '',
                syllabus: pkg.syllabus || '',
                prerequisites: pkg.prerequisites || '',
                subjectIds,
            });
        } else {
            setEditingPackage(null);
            setPackageForm({ name: '', code: '', domain: 'Testing', mode: 'Online', type: 'starter', description: '', duration: '', image: '', overview: '', syllabus: '', prerequisites: '', subjectIds: [] });
        }
        setSubjectSearchQuery(''); // Reset search when opening modal
        setError(null);
        setSuccessMessage(null);
        setIsPackageModalOpen(true);
    };

    const savePackage = async () => {
        if (!packageForm.name || !packageForm.code) {
            setError('Package name and code are required');
            return;
        }

        if (!packageForm.subjectIds || packageForm.subjectIds.length === 0) {
            setError('⚠️ Subjects are mandatory - Please select at least one subject for this package');
            return;
        }

        if (formLoading) return; // Prevent multiple simultaneous saves

        setFormLoading(true);
        setError(null);

        try {
            const imageInput = document.querySelector('input[type="file"]#packageImageFile') as HTMLInputElement;
            const hasImageFile = imageInput?.files?.length ? imageInput.files.length > 0 : false;

            // Always use FormData for consistency
            const formData = new FormData();
            formData.append('name', packageForm.name);
            formData.append('code', packageForm.code);
            formData.append('domain', packageForm.domain || 'Testing');
            formData.append('mode', packageForm.mode || 'Online');
            formData.append('type', packageForm.type || 'starter');
            formData.append('description', packageForm.description || '');
            formData.append('duration', packageForm.duration || '');
            formData.append('overview', packageForm.overview || '');
            formData.append('syllabus', packageForm.syllabus || '');
            formData.append('prerequisites', packageForm.prerequisites || '');
            formData.append('subjectIds', JSON.stringify(packageForm.subjectIds || []));

            // Only append image if there's a new file
            if (hasImageFile) {
                formData.append('image', imageInput.files![0]);
            } else if (typeof packageForm.image === 'string' && packageForm.image.startsWith('http')) {
                // Keep existing image URL if no new file uploaded
                formData.append('image', packageForm.image);
            }

            const requestOptions: ApiRequestOptions = {
                method: editingPackage ? 'PUT' : 'POST',
                body: formData,
                isFormData: true,
            };

            if (editingPackage) {
                await apiRequest(`/api/packages/${editingPackage.id}`, requestOptions);
                setSuccessMessage(`Package "${packageForm.name}" updated successfully`);
            } else {
                await apiRequest('/api/packages', requestOptions);
                setSuccessMessage(`Package "${packageForm.name}" created successfully`);
            }

            await fetchPackages();
            setIsPackageModalOpen(false);
            setPackageForm({ name: '', code: '', domain: 'Testing', mode: 'Online', type: 'starter', description: '', duration: '', image: '', overview: '', syllabus: '', prerequisites: '', subjectIds: [] });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            
            // Check for subjectIds validation error
            if (errorMessage.includes('subjectIds must be a non-empty array')) {
                setError('Please select subject it is mandatory');
            } else {
                setError(errorMessage);
            }
            console.error('Error saving package:', err);
        } finally {
            setFormLoading(false);
        }
    };

    const deletePackage = async (id: number) => {
        const packageToDelete = packages.find(p => p.id === id);
        if (!packageToDelete) return;

        if (!confirm('Are you sure you want to delete this package?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiRequest(`/api/packages/${id}`, {
                method: 'DELETE',
            });
            setSuccessMessage(`Package "${packageToDelete.name}" deleted successfully`);
            await fetchPackages();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete package';
            
            // Check for foreign key constraint errors
            if (errorMessage.includes('foreign key constraint') || errorMessage.includes('enquiries_packageId_fkey')) {
                setError('Cannot delete this package because it is being used by existing enquiries. Please remove or reassign all enquiries using this package before deleting it.');
            } else {
                setError(errorMessage);
            }
            console.error('Error deleting package:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubjectSelection = (subjectId: number) => {
        setPackageForm(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.includes(subjectId)
                ? prev.subjectIds.filter(id => id !== subjectId)
                : [...prev.subjectIds, subjectId]
        }));
    };



    // Filter subjects based on search query
    const filteredSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(subjectSearchQuery.toLowerCase())
    );

    // Select/Deselect all filtered subjects
    const handleSelectAll = () => {
        const filteredSubjectIds = filteredSubjects.map(s => s.id);
        const allSelected = filteredSubjectIds.every(id => packageForm.subjectIds.includes(id));

        if (allSelected) {
            // Deselect all filtered subjects
            setPackageForm(prev => ({
                ...prev,
                subjectIds: prev.subjectIds.filter(id => !filteredSubjectIds.includes(id))
            }));
        } else {
            // Select all filtered subjects
            const newSubjectIds = [...new Set([...packageForm.subjectIds, ...filteredSubjectIds])];
            setPackageForm(prev => ({ ...prev, subjectIds: newSubjectIds }));
        }
    };

    const areAllFilteredSelected = () => {
        if (filteredSubjects.length === 0) return false;
        return filteredSubjects.every(subject => packageForm.subjectIds.includes(subject.id));
    };

    // Filter subjects and packages for table views
    const filteredTableSubjects = subjects.filter(subject =>
        subject.name.toLowerCase().includes(tableSubjectSearchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(tableSubjectSearchQuery.toLowerCase())
    );

    const filteredTablePackages = packages.filter(pkg =>
        pkg.name.toLowerCase().includes(tablePackageSearchQuery.toLowerCase()) ||
        pkg.code.toLowerCase().includes(tablePackageSearchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex gap-2 bg-white rounded-lg p-1 border border-slate-200">
                    <button
                        onClick={() => {
                            setActiveTab('subjects');
                            setError(null);
                            setSuccessMessage(null);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'subjects'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:text-indigo-600'
                            }`}
                    >
                        Subjects
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('packages');
                            setError(null);
                            setSuccessMessage(null);
                        }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'packages'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:text-indigo-600'
                            }`}
                    >
                        Packages
                    </button>
                </div>

                <button
                    onClick={() => activeTab === 'subjects' ? openSubjectModal() : openPackageModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon />
                    Add {activeTab === 'subjects' ? 'Subject' : 'Package'}
                </button>
            </div>

            {/* Error Message Popup - Only show when no modal is open */}
            {error && !isSubjectModalOpen && !isPackageModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800">Error</h3>
                            <button
                                onClick={() => setError(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-700">{error}</p>
                            </div>
                        </div>
                        <div className="flex justify-end px-6 py-4 border-t border-slate-200">
                            <button
                                onClick={() => setError(null)}
                                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message Popup */}
            {successMessage && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800">Success</h3>
                            <button
                                onClick={() => setSuccessMessage(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-slate-700">{successMessage}</p>
                            </div>
                        </div>
                        <div className="flex justify-end px-6 py-4 border-t border-slate-200">
                            <button
                                onClick={() => setSuccessMessage(null)}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination Controls - Top */}
            {activeTab === 'subjects' && (
                <>
                    {subjects.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-4">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by subject name or code..."
                                    value={tableSubjectSearchQuery}
                                    onChange={(e) => {
                                        setTableSubjectSearchQuery(e.target.value);
                                        setCurrentSubjectPage(1);
                                    }}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {tableSubjectSearchQuery && (
                                    <button
                                        onClick={() => {
                                            setTableSubjectSearchQuery('');
                                            setCurrentSubjectPage(1);
                                        }}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {filteredTableSubjects.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-600">
                                    Showing {Math.min((currentSubjectPage - 1) * itemsPerPage + 1, filteredTableSubjects.length)} to {Math.min(currentSubjectPage * itemsPerPage, filteredTableSubjects.length)} of {filteredTableSubjects.length} subjects
                                </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Rows per page:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentSubjectPage(1);
                                }}
                                className="px-2 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentSubjectPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentSubjectPage === 1}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.ceil(filteredTableSubjects.length / itemsPerPage) }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentSubjectPage(i + 1)}
                                    className={`px-2 py-1 rounded text-sm font-medium ${
                                        currentSubjectPage === i + 1
                                            ? 'bg-indigo-600 text-white'
                                            : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentSubjectPage(prev => Math.min(prev + 1, Math.ceil(filteredTableSubjects.length / itemsPerPage)))}
                            disabled={currentSubjectPage === Math.ceil(filteredTableSubjects.length / itemsPerPage)}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
                    )}
                </>
            )}

            {activeTab === 'packages' && (
                <>
                    {packages.length > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 mb-4 p-4">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by package name or code..."
                                    value={tablePackageSearchQuery}
                                    onChange={(e) => {
                                        setTablePackageSearchQuery(e.target.value);
                                        setCurrentPackagePage(1);
                                    }}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {tablePackageSearchQuery && (
                                    <button
                                        onClick={() => {
                                            setTablePackageSearchQuery('');
                                            setCurrentPackagePage(1);
                                        }}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    {filteredTablePackages.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-600">
                                    Showing {Math.min((currentPackagePage - 1) * itemsPerPage + 1, filteredTablePackages.length)} to {Math.min(currentPackagePage * itemsPerPage, filteredTablePackages.length)} of {filteredTablePackages.length} packages
                                </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-slate-600">Rows per page:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPackagePage(1);
                                }}
                                className="px-2 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPackagePage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPackagePage === 1}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.ceil(filteredTablePackages.length / itemsPerPage) }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPackagePage(i + 1)}
                                    className={`px-2 py-1 rounded text-sm font-medium ${
                                        currentPackagePage === i + 1
                                            ? 'bg-indigo-600 text-white'
                                            : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPackagePage(prev => Math.min(prev + 1, Math.ceil(filteredTablePackages.length / itemsPerPage)))}
                            disabled={currentPackagePage === Math.ceil(filteredTablePackages.length / itemsPerPage)}
                            className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
                    )}
                </>
            )}

            {/* Tables */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {activeTab === 'subjects' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Subject Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Subject Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Packages</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Image</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Overview</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Syllabus</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Prerequisites</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading && subjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                                            Loading subjects...
                                        </td>
                                    </tr>
                                ) : subjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                                            No subjects found. Click "Add Subject" to create one.
                                        </td>
                                    </tr>
                                ) : filteredTableSubjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                                            {subjects.length === 0 ? 'No subjects found. Click "Add Subject" to create one.' : 'No subjects match your search.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTableSubjects.slice((currentSubjectPage - 1) * itemsPerPage, currentSubjectPage * itemsPerPage).map((subject) => (
                                        <tr key={subject.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-800">{subject.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{subject.code}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                                                {packages.filter(pkg => pkg.Subjects?.some(s => s.id === subject.id)).map(p => p.name).join(', ') || 'No packages'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {subject.image ? (
                                                    <img 
                                                        src={subject.image} 
                                                        alt={subject.name}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <span className="text-slate-500">No image</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{typeof subject.overview === 'object' ? JSON.stringify(subject.overview) : (subject.overview || 'N/A')}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{typeof subject.syllabus === 'object' ? JSON.stringify(subject.syllabus) : (subject.syllabus || 'N/A')}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{typeof subject.prerequisites === 'object' ? JSON.stringify(subject.prerequisites) : (subject.prerequisites || 'N/A')}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => openSubjectModal(subject)}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded transition-colors"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => deleteSubject(subject.id)}
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
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Package Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Package Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Subjects</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Image</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Overview</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Syllabus</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Prerequisites</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>



                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading && packages.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                                            Loading packages...
                                        </td>
                                    </tr>
                                ) : filteredTablePackages.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500 text-sm">
                                            {packages.length === 0 ? 'No packages found. Click "Add Package" to create one.' : 'No packages match your search.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTablePackages.slice((currentPackagePage - 1) * itemsPerPage, currentPackagePage * itemsPerPage).map((pkg) => (
                                        <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-800">{pkg.name}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{pkg.code}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                                                {pkg.Subjects?.map(s => s.name).join(', ') || 'No subjects'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {pkg.image ? (
                                                    <img 
                                                        src={pkg.image} 
                                                        alt={pkg.name}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <span className="text-slate-500">No image</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{typeof pkg.overview === 'object' ? JSON.stringify(pkg.overview) : (pkg.overview || 'N/A')}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{typeof pkg.syllabus === 'object' ? JSON.stringify(pkg.syllabus) : (pkg.syllabus || 'N/A')}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{typeof pkg.prerequisites === 'object' ? JSON.stringify(pkg.prerequisites) : (pkg.prerequisites || 'N/A')}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => openPackageModal(pkg)}
                                                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded transition-colors"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => deletePackage(pkg.id)}
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
                )}
            </div>

            {/* Subject Modal */}
            {isSubjectModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingSubject ? 'Edit Subject' : 'Add Subject'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsSubjectModalOpen(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-6 px-6 py-4">
                            {/* Left Column - Form Fields */}
                            <div className="space-y-4">
                                {/* Error Message in Modal */}
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm flex items-start justify-between gap-4">
                                        <span>{error}</span>
                                        <button
                                            onClick={() => setError(null)}
                                            className="text-rose-700 hover:text-rose-900 flex-shrink-0"
                                            aria-label="Close error message"
                                        >
                                            <CloseIcon />
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Subject Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectForm.name}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Mathematics"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Subject Code <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectForm.code}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., MATH101"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Domain
                                    </label>
                                    <select
                                        value={subjectForm.domain}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, domain: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {domains.map((domainOption) => (
                                            <option key={domainOption.code} value={domainOption.name}>
                                                {domainOption.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mode
                                    </label>
                                    <select
                                        value={subjectForm.mode}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, mode: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={subjectForm.type}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="starter">Starter</option>
                                        <option value="advance">Advance</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectForm.description}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Basic testing concepts"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Duration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={subjectForm.duration}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, duration: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., 40"
                                        min="0"
                                        step="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Overview
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectForm.overview}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, overview: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="DESCRIPTION OF SUBJECT"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Syllabus
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectForm.syllabus}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, syllabus: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., SYLLABUS"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Prerequisites
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectForm.prerequisites}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, prerequisites: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., PREREQUISITES"
                                    />
                                </div>

                            </div>

                            {/* Right Column - Image */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Image
                                </label>

                                {/* Image Preview */}
                                {subjectForm.image && typeof subjectForm.image === 'string' && subjectForm.image.startsWith('http') && (
                                    <div className="mb-4">
                                        <img 
                                            src={subjectForm.image} 
                                            alt="Subject Preview" 
                                            className="w-full h-48 object-cover rounded-lg border border-slate-300"
                                        />
                                    </div>
                                )}

                                {subjectForm.image && typeof subjectForm.image === 'string' && subjectForm.image.startsWith('data:') && (
                                    <div className="mb-4">
                                        <img 
                                            src={subjectForm.image} 
                                            alt="Subject Preview" 
                                            className="w-full h-48 object-cover rounded-lg border border-slate-300"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="subjectImageFile"
                                        className="w-full border-2 border-dashed border-slate-300 rounded-lg px-4 py-8 text-center cursor-pointer hover:bg-slate-50 transition-colors block"
                                    >
                                        <span className="text-sm text-slate-600">
                                            Click to upload image
                                        </span>
                                    </label>

                                    <input
                                        type="file"
                                        id="subjectImageFile"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setSubjectForm({
                                                        ...subjectForm,
                                                        image: reader.result as string,
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
                            <button
                                onClick={() => {
                                    setIsSubjectModalOpen(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSubject}
                                disabled={formLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {formLoading ? 'Saving...' : editingSubject ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Package Modal */}
            {isPackageModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingPackage ? 'Edit Package' : 'Add Package'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsPackageModalOpen(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-6 px-6 py-4">
                            {/* Left Column - Form Fields */}
                            <div className="space-y-4">
                                {/* Error Message in Modal */}
                                {error && (
                                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm flex items-start justify-between gap-4">
                                        <span>{error}</span>
                                        <button
                                            onClick={() => setError(null)}
                                            className="text-rose-700 hover:text-rose-900 flex-shrink-0"
                                            aria-label="Close error message"
                                        >
                                            <CloseIcon />
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Package Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={packageForm.name}
                                        onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Science Package"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Package Code <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={packageForm.code}
                                        onChange={(e) => setPackageForm({ ...packageForm, code: e.target.value })}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., SCI001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Domain
                                    </label>
                                    <select
                                        value={packageForm.domain}
                                        onChange={(e) => setPackageForm({ ...packageForm, domain: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {domains.map((domainOption) => (
                                            <option key={domainOption.code} value={domainOption.name}>
                                                {domainOption.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Mode
                                    </label>
                                    <select
                                        value={packageForm.mode}
                                        onChange={(e) => setPackageForm({ ...packageForm, mode: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={packageForm.type}
                                        onChange={(e) => setPackageForm({ ...packageForm, type: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="starter">Starter</option>
                                        <option value="advance">Advance</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={packageForm.description}
                                        onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., Comprehensive package overview"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Duration (hours)
                                    </label>
                                    <input
                                        type="number"
                                        value={packageForm.duration}
                                        onChange={(e) => setPackageForm({ ...packageForm, duration: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., 120"
                                        min="0"
                                        step="1"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            Select Subjects <span className="text-rose-500">*</span>
                                        </label>
                                        {subjects.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={handleSelectAll}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                                            >
                                                {areAllFilteredSelected() ? 'Deselect All' : 'Select All'}
                                            </button>
                                        )}
                                    </div>
                                    {subjects.length > 0 && (
                                        <div className="relative mb-2">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <SearchIcon />
                                            </div>
                                            <input
                                                type="text"
                                                value={subjectSearchQuery}
                                                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                                placeholder="Search by name or code..."
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    )}

                                    <div className="border border-slate-300 rounded-lg max-h-48 overflow-y-auto">
                                        {subjects.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-slate-500 text-center">
                                                No subjects available. Create subjects first.
                                            </div>
                                        ) : filteredSubjects.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-slate-500 text-center">
                                                No subjects match your search.
                                            </div>
                                        ) : (
                                            filteredSubjects.map((subject) => (
                                                <label
                                                    key={subject.id}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={packageForm.subjectIds.includes(subject.id)}
                                                        onChange={() => toggleSubjectSelection(subject.id)}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700 flex-1">
                                                        {subject.name} <span className="text-slate-500">({subject.code})</span>
                                                    </span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Overview
                                    </label>
                                    <input
                                        type="text"
                                        value={packageForm.overview}
                                        onChange={(e) => setPackageForm({ ...packageForm, overview: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., OVERVIEW"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Syllabus
                                    </label>
                                    <input
                                        type="text"
                                        value={packageForm.syllabus}
                                        onChange={(e) => setPackageForm({ ...packageForm, syllabus: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., SYLLABUS"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Prerequisites
                                    </label>
                                    <input
                                        type="text"
                                        value={packageForm.prerequisites}
                                        onChange={(e) => setPackageForm({ ...packageForm, prerequisites: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="e.g., PREREQUISITES"
                                    />
                                </div>

                            </div>

                            {/* Right Column - Image */}
                            <div className="flex flex-col">
                                <label className="block text-sm font-medium text-slate-700 mb-3">
                                    Image
                                </label>

                                {/* Image Preview */}
                                {packageForm.image && typeof packageForm.image === 'string' && packageForm.image.startsWith('http') && (
                                    <div className="mb-4">
                                        <img 
                                            src={packageForm.image} 
                                            alt="Package Preview" 
                                            className="w-full h-48 object-cover rounded-lg border border-slate-300"
                                        />
                                    </div>
                                )}

                                {packageForm.image && typeof packageForm.image === 'string' && packageForm.image.startsWith('data:') && (
                                    <div className="mb-4">
                                        <img 
                                            src={packageForm.image} 
                                            alt="Package Preview" 
                                            className="w-full h-48 object-cover rounded-lg border border-slate-300"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="packageImageFile"
                                        className="w-full border-2 border-dashed border-slate-300 rounded-lg px-4 py-8 text-center cursor-pointer hover:bg-slate-50 transition-colors block"
                                    >
                                        <span className="text-sm text-slate-600">
                                            Click to upload image
                                        </span>
                                    </label>

                                    <input
                                        type="file"
                                        id="packageImageFile"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setPackageForm({
                                                        ...packageForm,
                                                        image: reader.result as string,
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 sticky bottom-0 bg-white">
                            <button
                                onClick={() => {
                                    setIsPackageModalOpen(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePackage}
                                disabled={formLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {formLoading ? 'Saving...' : editingPackage ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
