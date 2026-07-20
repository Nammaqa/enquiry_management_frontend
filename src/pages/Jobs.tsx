import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/api';

// ─── Enum Constants ───────────────────────────────────────────────────────────
const VALID_WORK_MODES = ['Remote', 'On-site', 'Hybrid'] as const;
const VALID_JOB_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'] as const;

// Types
type WorkMode = typeof VALID_WORK_MODES[number];
type JobType = typeof VALID_JOB_TYPES[number];

interface JobPost {
    id: number;
    companyName: string;
    companyLogo: string; // base64 data URL or empty string
    jobTitle: string;
    location: string;
    workMode: WorkMode;
    jobType: JobType;
    about: string;
    jobDescription: string;
    preferredExperience: string;
    technicalSkills: string[];
    postedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface ApiResponse<T> {
    status: string;
    data: T;
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="12.01" />
        <path d="M2 12h20" />
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const BuildingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="12" rx="1" />
        <path d="M8 21V9" /><path d="M16 21V9" />
        <path d="M3 13h18" /><path d="M3 17h18" />
        <path d="M7 3h10l2 6H5L7 3z" />
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const ALLOWED_ROLES = ['HR', 'COUNSELLOR', 'ADMIN'];

// ─── Badge helper ─────────────────────────────────────────────────────────────

function workModeBadge(mode: WorkMode) {
    const map: Record<WorkMode, string> = {
        'On-site': 'bg-blue-100 text-blue-700',
        'Remote': 'bg-green-100 text-green-700',
        'Hybrid': 'bg-purple-100 text-purple-700',
    };
    return map[mode];
}

function jobTypeBadge(type: JobType) {
    const map: Record<JobType, string> = {
        'Full-time': 'bg-indigo-100 text-indigo-700',
        'Part-time': 'bg-amber-100 text-amber-700',
        'Internship': 'bg-teal-100 text-teal-700',
        'Contract': 'bg-orange-100 text-orange-700',
    };
    return map[type];
}

// ─── Skill Suggestions ───────────────────────────────────────────────────────
const SKILL_SUGGESTIONS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Swift', 'Kotlin', 'Ruby', 'PHP', 'R', 'MATLAB', 'Scala', 'Dart', 'Elixir',
    'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'Nuxt.js', 'Remix',
    'Node.js', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'Flask', 'Spring Boot', 'ASP.NET', 'Laravel', 'Ruby on Rails',
    'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'SASS/SCSS', 'GraphQL', 'REST API',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Cassandra', 'DynamoDB', 'Elasticsearch', 'Firebase',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions',
    'Git', 'Linux', 'Bash', 'Nginx', 'Apache',
    'TensorFlow', 'PyTorch', 'scikit-learn', 'Pandas', 'NumPy', 'Keras', 'OpenCV', 'Hugging Face', 'LangChain', 'AI/ML',
     'React Native', 'Flutter', 'Android', 'iOS', 'Ionic',
    'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Agile', 'Scrum', 'Jira', 'Confluence', 'Notion',
    'TCP/IP', 'OAuth', 'JWT', 'WebSockets', 'gRPC', 'Kafka', 'RabbitMQ',
];

// ─── Component ────────────────────────────────────────────────────────────────

const renderTextWithBullets = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className="space-y-1">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (/^[•\-*]\s+/.test(trimmed)) {
                    return (
                        <div key={i} className="flex items-start gap-2 pl-2">
                            <span className="text-slate-400 select-none font-bold mt-0.5">•</span>
                            <span className="flex-1">{trimmed.replace(/^[•\-*]\s+/, '')}</span>
                        </div>
                    );
                } else if (trimmed === '') {
                    return <div key={i} className="h-2" />;
                }
                return <p key={i}>{line}</p>;
            })}
        </div>
    );
};

export default function Jobs() {
    const userRole = localStorage.getItem('userRole') ?? '';
    const isAllowed = ALLOWED_ROLES.includes(userRole);

    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof JobPost, string>>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const skillWrapperRef = useRef<HTMLDivElement>(null);
    const skillInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        companyName: '',
        companyLogo: '',
        jobTitle: '',
        location: '',
        workMode: '' as WorkMode,
        jobType: '' as JobType,
        about: '',
        jobDescription: '',
        preferredExperience: '',
        technicalSkills: [] as string[],
    });

    const [skillInput, setSkillInput] = useState('');
    const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
    const [skillActiveIdx, setSkillActiveIdx] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSkills = skillInput.trim().length > 0
        ? SKILL_SUGGESTIONS.filter(
            s => s.toLowerCase().includes(skillInput.toLowerCase()) && !form.technicalSkills.includes(s)
        ).slice(0, 8)
        : [];

    // Filter jobs by company name, job title, and location
    const filteredJobs = jobs.filter(job =>
        searchQuery.trim() === '' ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addSkill = (raw: string) => {
        const skill = raw.trim();
        if (skill && !form.technicalSkills.includes(skill)) {
            setForm(prev => ({ ...prev, technicalSkills: [...prev.technicalSkills, skill] }));
            setErrors(prev => ({ ...prev, technicalSkills: undefined }));
            setActionError(null);
        }
        setSkillInput('');
        setSkillDropdownOpen(false);
        setSkillActiveIdx(-1);
        skillInputRef.current?.focus();
    };

    const removeSkill = (skill: string) => {
        setActionError(null);
        setForm(prev => ({ ...prev, technicalSkills: prev.technicalSkills.filter(s => s !== skill) }));
    };

    const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSkillActiveIdx(i => Math.min(i + 1, filteredSkills.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSkillActiveIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (skillActiveIdx >= 0 && filteredSkills[skillActiveIdx]) {
                addSkill(filteredSkills[skillActiveIdx]);
            } else {
                addSkill(skillInput);
            }
        } else if (e.key === 'Escape') {
            setSkillDropdownOpen(false);
            setSkillActiveIdx(-1);
        } else if (e.key === 'Backspace' && skillInput === '' && form.technicalSkills.length > 0) {
            removeSkill(form.technicalSkills[form.technicalSkills.length - 1]);
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (skillWrapperRef.current && !skillWrapperRef.current.contains(e.target as Node)) {
                setSkillDropdownOpen(false);
                setSkillActiveIdx(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (isAllowed) {
            fetchJobs();
        }
    }, [isAllowed]);

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest<ApiResponse<JobPost[]>>('/api/job-posts');
            if (response.status === 'success') {
                setJobs(response.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching jobs');
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const set = (key: keyof typeof form, value: string) => {
        setActionError(null);
        setErrors(prev => ({ ...prev, [key]: undefined }));
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            setLogoPreview(result);
            setForm(prev => ({ ...prev, companyLogo: result }));
        };
        reader.readAsDataURL(file);
    };

    const clearLogo = () => {
        setLogoPreview('');
        setForm(prev => ({ ...prev, companyLogo: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validate = () => {
        const e: Partial<Record<keyof typeof form, string>> = {};
        if (!form.companyName.trim()) {
            e.companyName = 'Required';
        }

        if (!form.jobTitle.trim()) e.jobTitle = 'Required';
        if (!form.location.trim()) e.location = 'Required';
        if (!form.workMode) e.workMode = 'Required';
        if (!form.jobType) e.jobType = 'Required';
        if (!form.about.trim()) e.about = 'Required';
        if (!form.jobDescription.trim()) e.jobDescription = 'Required';
        if (!form.preferredExperience.trim()) e.preferredExperience = 'Required';
        if (form.technicalSkills.length === 0) e.technicalSkills = 'Required';
        return e;
    };

    const handleEdit = (job: JobPost) => {
        setEditingId(job.id);
        setForm({
            companyName: job.companyName,
            companyLogo: job.companyLogo,
            jobTitle: job.jobTitle,
            location: job.location,
            workMode: job.workMode,
            jobType: job.jobType,
            about: job.about,
            jobDescription: job.jobDescription,
            preferredExperience: job.preferredExperience,
            technicalSkills: job.technicalSkills || [],
        });
        setSkillInput('');
        setActionError(null);
        setErrors({});
        setLogoPreview(job.companyLogo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            companyName: '',
            companyLogo: '',
            jobTitle: '',
            location: '',
            workMode: '' as WorkMode,
            jobType: '' as JobType,
            about: '',
            jobDescription: '',
            preferredExperience: '',
            technicalSkills: [],
        });
        setSkillInput('');
        setActionError(null);
        setErrors({});
        setLogoPreview('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            setActionError('Mandatory fields are missing');
            return;
        }
        setErrors({});
        setActionError(null);
        setLoading(true);
        setError(null);

        try {
            if (editingId) {
                // Update implementation
                const response = await apiRequest<ApiResponse<JobPost>>(`/api/job-posts/${editingId}`, {
                    method: 'PUT',
                    body: form,
                });

                if (response.status === 'success') {
                    setJobs(prev => prev.map(j => j.id === editingId ? response.data : j));
                    cancelEdit();
                    setSuccessMessage('Job updated successfully');
                }
            } else {
                // Create implementation
                const response = await apiRequest<ApiResponse<JobPost>>('/api/job-posts', {
                    method: 'POST',
                    body: form,
                });

                if (response.status === 'success') {
                    setJobs(prev => [response.data, ...prev]);
                    setForm({
                        companyName: '',
                        companyLogo: '',
                        jobTitle: '',
                        location: '',
                        workMode: '' as WorkMode,
                        jobType: '' as JobType,
                        about: '',
                        jobDescription: '',
                        preferredExperience: '',
                        technicalSkills: [],
                    });
                    setSkillInput('');
                    setLogoPreview('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    setSuccessMessage('Job posted successfully');
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while saving the job');
            console.error('Error saving job:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (id: number) => {
        if (!confirm('Are you sure you want to delete this job posting?')) return;
        setLoading(true);
        setError(null);
        try {
            await apiRequest(`/api/job-posts/${id}`, {
                method: 'DELETE',
            });
            setJobs(prev => prev.filter(j => j.id !== id));
            setSuccessMessage('Job deleted successfully');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while deleting the job');
            console.error('Error deleting job:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Access Denied ──────────────────────────────────────────────────────────
    if (!isAllowed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <LockIcon />
                <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
                <p className="text-slate-500 max-w-sm text-sm">
                    This page is only available to <span className="font-semibold text-indigo-600">HR Admin</span> and <span className="font-semibold text-indigo-600">Counsellor</span> roles.
                </p>
            </div>
        );
    }

    // ── Main Page ──────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 max-w-4xl mx-auto">

            {/* ── Post a Job Form ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center gap-3">
                    <span className="p-2 bg-indigo-600 text-white rounded-xl">
                        <BriefcaseIcon />
                    </span>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Job Posting' : 'Post a Job'}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {editingId ? 'Updating the details for the existing job listing' : 'Fill in the details below to publish a job listing for students'}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">

                    {/* API Error Banner */}
                    {error && (
                        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {error}
                        </div>
                    )}



                    {/* Company Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo</label>
                        <div className="flex items-center gap-4">
                            {/* Preview */}
                            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Company logo" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                        <rect x="3" y="9" width="18" height="12" rx="1" />
                                        <path d="M8 21V9" /><path d="M16 21V9" />
                                        <path d="M3 13h18" /><path d="M3 17h18" />
                                        <path d="M7 3h10l2 6H5L7 3z" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                    id="company-logo-input"
                                />
                                <label
                                    htmlFor="company-logo-input"
                                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 transition-all duration-150"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                </label>
                                {logoPreview && (
                                    <button type="button" onClick={clearLogo} className="ml-2 text-xs text-rose-500 hover:text-rose-700 underline">
                                        Remove
                                    </button>
                                )}
                                <p className="text-xs text-slate-400 mt-1.5"></p>
                            </div>
                        </div>
                    </div>

                    {/* Row 1 — Company + Job Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Company Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.companyName}
                                onChange={e => set('companyName', e.target.value)}
                                placeholder="e.g. Netflix"
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.companyName ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                            />
                            {errors.companyName && <p className="text-xs text-rose-500 mt-1">{errors.companyName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Job Title <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.jobTitle}
                                onChange={e => {
                                    const val = e.target.value;
                                    // Allow any input, including clearing the field completely
                                    set('jobTitle', val);
                                }}
                                placeholder="e.g. AI/ML Engineer"
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.jobTitle ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                            />
                            {errors.jobTitle && <p className="text-xs text-rose-500 mt-1">{errors.jobTitle}</p>}
                        </div>
                    </div>

                    {/* Row 2 — Location + Work Mode + Job Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Location <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '' || /^[a-zA-Z\s]+$/.test(val)) {
                                        set('location', val);
                                    }
                                }}
                                placeholder="e.g. Bengaluru"
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.location ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                            />
                            {errors.location && <p className="text-xs text-rose-500 mt-1">{errors.location}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Work Mode <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={form.workMode}
                                onChange={e => set('workMode', e.target.value as WorkMode)}
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.workMode ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                            >
                                <option value="" disabled>Select Work Mode</option>
                                {VALID_WORK_MODES.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            {errors.workMode && <p className="text-xs text-rose-500 mt-1">{errors.workMode}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Job Type <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={form.jobType}
                                onChange={e => set('jobType', e.target.value as JobType)}
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.jobType ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                            >
                                <option value="" disabled>Select Job Type</option>
                                {VALID_JOB_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {errors.jobType && <p className="text-xs text-rose-500 mt-1">{errors.jobType}</p>}
                        </div>
                    </div>

                    {/* About the Company */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            About <span className="text-rose-500">*</span>
                            <span className="font-normal text-slate-400 ml-1">(About the company)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={form.about}
                            onChange={e => set('about', e.target.value)}
                            placeholder="Brief overview of the company, its mission, and culture..."
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.about ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                        />
                        {errors.about && <p className="text-xs text-rose-500 mt-1">{errors.about}</p>}
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Job Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={5}
                            value={form.jobDescription}
                            onChange={e => set('jobDescription', e.target.value)}
                            placeholder={"• Responsible for designing and deploying ML models\n• Collaborate with cross-functional teams\n• "}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono ${errors.jobDescription ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                        />
                        {errors.jobDescription && <p className="text-xs text-rose-500 mt-1">{errors.jobDescription}</p>}
                        <p className="text-xs text-slate-400 mt-1">Tip: Start each bullet with "• " for formatting</p>
                    </div>

                    {/* Preferred Technical & Professional Experience */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Preferred Technical &amp; Professional Experience <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={form.preferredExperience}
                            onChange={e => set('preferredExperience', e.target.value)}
                            placeholder={"• 2+ years of experience in Python/TensorFlow\n• Strong understanding of data pipelines\n• "}
                            className={`w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono ${errors.preferredExperience ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                        />
                        {errors.preferredExperience && <p className="text-xs text-rose-500 mt-1">{errors.preferredExperience}</p>}
                    </div>

                    {/* Technical Skills */}
                    <div ref={skillWrapperRef} className="relative">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Technical Skills <span className="text-rose-500">*</span>
                        </label>
                        {/* Tag box */}
                        <div
                            className={`flex flex-wrap gap-2 rounded-lg border px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white cursor-text ${errors.technicalSkills ? 'border-rose-400 bg-rose-50' : 'border-slate-300'}`}
                            onClick={() => skillInputRef.current?.focus()}
                        >
                            {form.technicalSkills.map(skill => (
                                <span
                                    key={skill}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); removeSkill(skill); }}
                                        className="ml-0.5 hover:text-indigo-900 focus:outline-none"
                                        aria-label={`Remove ${skill}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                ref={skillInputRef}
                                type="text"
                                maxLength={100}
                                value={skillInput}
                                onChange={e => {
                                    setSkillInput(e.target.value);
                                    setSkillDropdownOpen(true);
                                    setSkillActiveIdx(-1);
                                }}
                                onFocus={() => skillInput.trim() && setSkillDropdownOpen(true)}
                                onKeyDown={handleSkillKeyDown}
                                placeholder={form.technicalSkills.length === 0 ? 'Type a skill… (e.g. React, Python)' : ''}
                                className="flex-1 min-w-[160px] text-sm outline-none bg-transparent placeholder:text-slate-400 py-0.5"
                                autoComplete="off"
                            />
                        </div>

                        {/* Autocomplete Dropdown */}
                        {skillDropdownOpen && (filteredSkills.length > 0 || skillInput.trim().length > 0) && (
                            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                                {filteredSkills.map((skill, idx) => (
                                    <li
                                        key={skill}
                                        onMouseDown={e => { e.preventDefault(); addSkill(skill); }}
                                        onMouseEnter={() => setSkillActiveIdx(idx)}
                                        className={`flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors ${idx === skillActiveIdx
                                                ? 'bg-indigo-50 text-indigo-700'
                                                : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                        {/* Bold the matching part */}
                                        {skill.split(new RegExp(`(${skillInput})`, 'gi')).map((part, i) =>
                                            part.toLowerCase() === skillInput.toLowerCase()
                                                ? <strong key={i} className="font-semibold">{part}</strong>
                                                : <span key={i}>{part}</span>
                                        )}
                                    </li>
                                ))}
                                {/* Show custom skill option if input doesn't match suggestions */}
                                {skillInput.trim().length > 0 && filteredSkills.length === 0 && (
                                    <li
                                        onMouseDown={e => { e.preventDefault(); addSkill(skillInput); }}
                                        className="flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-t border-slate-100"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                        <span>
                                            <strong>Add custom skill:</strong> "{skillInput.trim()}"
                                        </span>
                                    </li>
                                )}
                            </ul>
                        )}
                        {errors.technicalSkills && <p className="text-xs text-rose-500 mt-1">{errors.technicalSkills}</p>}
                       </div>

                    {/* Submit */}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
                        {actionError && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 sm:whitespace-nowrap">
                                {actionError}
                            </div>
                        )}
                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all duration-200"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading || Object.keys(validate()).length > 0}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                {loading ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                )}
                            </svg>
                            {loading ? (editingId ? 'Updating...' : 'Posting...') : (editingId ? 'Update Job' : 'Post Job')}
                        </button>
                    </div>
                </form>
            </div>

            {/* ── Posted Jobs List ── */}
            {jobs.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            Posted Jobs ({filteredJobs.length} of {jobs.length})
                        </h3>

                        {/* Search Bar */}
                        <div className="w-full sm:w-96 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by title, company, or location…"
                                className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <svg className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {filteredJobs.length > 0 ? (
                    <div className="space-y-4">
                    {filteredJobs.map(job => (
                        <div
                            key={job.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                        >
                            {/* Card Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    {/* Company Logo */}
                                    <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {job.companyLogo ? (
                                            <img src={job.companyLogo} alt={job.companyName} className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <BuildingIcon />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1">
                                            {job.companyName}
                                        </p>
                                        <h4 className="text-lg font-bold text-slate-800 mt-0.5">{job.jobTitle}</h4>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <MapPinIcon /> {job.location}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${workModeBadge(job.workMode)}`}>
                                                {job.workMode}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${jobTypeBadge(job.jobType)}`}>
                                                {job.jobType}
                                            </span>
                                            <span className="text-slate-400">
                                                Posted: {job.postedAt ? new Date(job.postedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : (job.createdAt ? new Date(job.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now')}
                                            </span>
                                        </div>
                                        {job.technicalSkills && job.technicalSkills.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {job.technicalSkills.map(skill => (
                                                    <span
                                                        key={skill}
                                                        className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-medium"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                        onClick={() => handleEdit(job)}
                                        disabled={loading}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Edit job"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        onClick={() => deleteJob(job.id)}
                                        disabled={loading}
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Delete job"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="px-6 py-4 space-y-4 text-sm text-slate-700">
                                {job.about && (
                                    <div>
                                        <p className="font-semibold text-slate-800 mb-1">About</p>
                                        <div className="text-slate-600 leading-relaxed">
                                            {renderTextWithBullets(job.about)}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-slate-800 mb-1">Job Description</p>
                                    <div className="font-sans text-slate-600 leading-relaxed">
                                        {renderTextWithBullets(job.jobDescription)}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800 mb-1">Preferred Technical &amp; Professional Experience</p>
                                    <div className="font-sans text-slate-600 leading-relaxed">
                                        {renderTextWithBullets(job.preferredExperience)}
                                    </div>
                                </div>
                                {job.technicalSkills && job.technicalSkills.length > 0 && (
                                    <div>
                                        <p className="font-semibold text-slate-800 mb-2">Technical Skills</p>
                                        <div className="flex flex-wrap gap-2">
                                            {job.technicalSkills.map(skill => (
                                                <span
                                                    key={skill}
                                                    className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-slate-500 text-sm">No jobs found matching "{searchQuery}"</p>
                            <p className="text-slate-400 text-xs mt-1">Try searching with a different company name or location</p>
                        </div>
                    )}
                </div>
            )}

            {/* Success Modal */}
            {successMessage && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800">Success</h3>
                                <p className="text-slate-600 text-sm mt-1">{successMessage}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {jobs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <BriefcaseIcon />
                    <p className="mt-2 text-sm">No jobs posted yet. Use the form above to post your first listing.</p>
                </div>
            )}
        </div>
    );
}
