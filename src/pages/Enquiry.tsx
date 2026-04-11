import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';

// --- Interfaces ---

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface Package {
    id: number;
    name: string;
    code: string;
    subjects?: Subject[];
}

interface EnquiryFormData {
    candidateName: string;
    candidatePhone: string;
    candidateEmail: string;
    candidateLocation: string;
    packageId: number | null;
    subjectIds: number[];
    trainingMode: string;
    trainingTiming: string;
    startDate: string;
    professionalSituation: string;
    situationOther: string;
    qualification: string;
    qualificationOther: string;
    experience: string;
    source: string;
    sourceOther: string;
    agreed: boolean;
}

const INITIAL_FORM_STATE: EnquiryFormData = {
    candidateName: '',
    candidatePhone: '',
    candidateEmail: '',
    candidateLocation: '',
    packageId: null,
    subjectIds: [],
    trainingMode: '',
    trainingTiming: '',
    startDate: '',
    professionalSituation: '',
    situationOther: '',
    qualification: '',
    qualificationOther: '',
    experience: '',
    source: '',
    sourceOther: '',
    agreed: false,
};

// --- Options Constants ---

const TRAINING_MODES = ['Offline', 'Hybrid', 'Online'];

const TRAINING_TIMINGS = [
    'Morning',
    'Evening',
    'Anytime in Weekdays',
    'Weekends'
];

const START_DATES = [
    'Immediate',
    'After 10 days',
    'After 15 days',
    'After 1 Month'
];

const PROF_SITUATIONS = [
    'Fresher',
    'Currently Working',
    'Switching from Another Domain',
    'Other'
];

const QUALIFICATIONS = [
    'Diploma',
    "Bachelor's Degree",
    "Master's Degree",
    'Other'
];

const EXPERIENCES = [
    'Less than 1 Year or Fresher',
    '1-3 Years',
    '3-5 Years',
    '5+ Years'
];

const SOURCES = [
    'Instagram',
    'Youtube',
    'Whatsapp Channel',
    'Friend Reference',
    'Facebook',
    'College Reference',
    'Linkedin',
    'Other Social Network',
    'Other'
];

const PACKAGE_ID_OTHERS = -1;

// --- Icons ---

const UserIcon = () => (
    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const ContactIcon = () => (
    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LocationIcon = () => (
    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default function Enquiry() {
    const [packages, setPackages] = useState<Package[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const [phoneCheckLoading, setPhoneCheckLoading] = useState(false);
    const [phoneExists, setPhoneExists] = useState(false);
    const [formData, setFormData] = useState<EnquiryFormData>(INITIAL_FORM_STATE);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pkgData, subData] = await Promise.all([
                    apiRequest<Package[]>('/api/packages', { method: 'GET' }),
                    apiRequest<Subject[]>('/api/subjects', { method: 'GET' })
                ]);
                setPackages(pkgData);
                setSubjects(subData);
            } catch (err) {
                setError('Failed to load initial data. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePackageSelect = async (pkgId: number) => {
        setFormData(prev => ({ ...prev, packageId: pkgId }));

        if (pkgId === PACKAGE_ID_OTHERS) {
            setFormData(prev => ({ ...prev, subjectIds: [] }));
            return;
        }

        // Find the selected package from the already loaded packages
        const selectedPackage = packages.find(pkg => pkg.id === pkgId);
        if (selectedPackage && selectedPackage.subjects) {
            const includedSubjectIds = selectedPackage.subjects.map(s => s.id);
            setFormData(prev => ({ ...prev, subjectIds: includedSubjectIds }));
        } else {
            setFormData(prev => ({ ...prev, subjectIds: [] }));
        }
    };

    const handleSubjectToggle = (subjectId: number) => {
        setFormData(prev => {
            const currentIds = prev.subjectIds;
            const newIds = currentIds.includes(subjectId)
                ? currentIds.filter(id => id !== subjectId)
                : [...currentIds, subjectId];
            return { ...prev, subjectIds: newIds };
        });
    };

    // Validate phone number format
    const validatePhoneNumber = (phone: string): string => {
        if (!phone) return '';
        
        // Check if it contains only digits
        if (!/^\d+$/.test(phone)) {
            return 'Phone number must contain only digits';
        }
        
        // Check if it's exactly 10 digits
        if (phone.length !== 10) {
            return 'Phone number must be exactly 10 digits';
        }
        
        // Check if it starts with 9, 8, 7, or 6
        const firstDigit = phone.charAt(0);
        if (!['9', '8', '7', '6'].includes(firstDigit)) {
            return 'Phone number must start with 9, 8, 7, or 6';
        }
        
        return '';
    };

    // Check if phone number already exists
    const checkPhoneExists = async (phone: string) => {
        if (!phone || phone.length !== 10) {
            setPhoneExists(false);
            return;
        }

        setPhoneCheckLoading(true);
        try {
            const response = await apiRequest<any>('/api/enquiries/check-phone', {
                method: 'POST',
                body: { phone }
            });
            setPhoneExists(response?.exists || false);
        } catch (err) {
            console.error('Error checking phone:', err);
            setPhoneExists(false);
        } finally {
            setPhoneCheckLoading(false);
        }
    };

    // Handle full name input - allow only alphabets and spaces, max 25 characters
    const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25); // Allow only letters and spaces, max 25 chars
        setFormData({ ...formData, candidateName: value });
    };

    // Handle phone input - allow only digits, max 10
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10); // Allow only digits, max 10
        setFormData({ ...formData, candidatePhone: value });
        
        // Clear previous error
        if (fieldErrors.phone) {
            setFieldErrors(prev => ({ ...prev, phone: '' }));
        }
        
        // Validate format
        const phoneError = validatePhoneNumber(value);
        if (phoneError) {
            setFieldErrors(prev => ({ ...prev, phone: phoneError }));
            setPhoneExists(false);
        }
        
        // Check for duplicates if valid format
        if (!phoneError && value.length === 10) {
            checkPhoneExists(value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate phone number
        const phoneError = validatePhoneNumber(formData.candidatePhone);
        if (phoneError) {
            setFieldErrors({ ...fieldErrors, phone: phoneError });
            return;
        }
        
        // Check if phone already exists
        if (phoneExists) {
            setFieldErrors({ ...fieldErrors, phone: 'Phone number already exists' });
            return;
        }
        
        if (!formData.agreed) {
            alert('Please agree to the terms to proceed.');
            return;
        }
        if (formData.packageId === null) {
            alert('Please select a package or "Others".');
            return;
        }

        if (formData.packageId === PACKAGE_ID_OTHERS && formData.subjectIds.length === 0) {
            alert('Please select at least one subject.');
            return;
        }

        setSubmitting(true);
        setFieldErrors({});
        try {
            const payload = {
                name: formData.candidateName,
                email: formData.candidateEmail,
                phone: formData.candidatePhone,
                current_location: formData.candidateLocation,
                packageId: formData.packageId === PACKAGE_ID_OTHERS ? null : formData.packageId,
                subjectIds: formData.subjectIds,
                trainingMode: formData.trainingMode,
                trainingTime: formData.trainingTiming,
                startTime: formData.startDate,
                profession: formData.professionalSituation === 'Other' ? formData.situationOther : formData.professionalSituation,
                qualification: formData.qualification === 'Other' ? formData.qualificationOther : formData.qualification,
                experience: formData.experience,
                referral: formData.source === 'Other' ? formData.sourceOther : formData.source,
                consent: formData.agreed,
                candidateStatus: 'enquiry stage'
            };

            await apiRequest('/api/enquiries', {
                method: 'POST',
                body: payload
            });
            alert('Enquiry submitted successfully!');
            setFormData(INITIAL_FORM_STATE);
            setFieldErrors({});
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.message || 'Failed to submit enquiry. Please try again.';
            
            // Set field-specific errors
            const errors: { [key: string]: string } = {};
            if (errorMessage.toLowerCase().includes('email')) {
                errors.email = 'Email address already exists. Please use a different email.';
            }
            if (errorMessage.toLowerCase().includes('phone')) {
                errors.phone = 'Phone number already exists. Please use a different phone number.';
            }
            if (Object.keys(errors).length === 0) {
                setError(errorMessage);
            } else {
                setError(null);
            }
            setFieldErrors(errors);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the form?')) {
            setFormData(INITIAL_FORM_STATE);
            setFieldErrors({});
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-indigo-600 font-medium animate-pulse">Loading enquiry form...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">New Enquiry</h1>
                <p className="text-slate-500 mt-2">Fill in the details below to register a new student enquiry.</p>
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Candidate Personal Info */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <UserIcon />
                        Candidate Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Full Name <span className="text-rose-500 font-semibold">*</span></label>
                            <input
                                required
                                type="text"
                                value={formData.candidateName}
                                onChange={handleFullNameChange}
                                maxLength={25}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Enter full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 mt-0.5">Phone Number <span className="text-rose-500 font-semibold">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </span>
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={formData.candidatePhone}
                                    onChange={handlePhoneChange}
                                    className={`w-full pl-10 pr-12 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${
                                        fieldErrors.phone || phoneExists ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                                    }`}
                                    placeholder="Enter 10-digit phone"
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400">
                                    {formData.candidatePhone.length}/10
                                </span>
                            </div>
                            {fieldErrors.phone && (
                                <p className="text-sm text-rose-600 mt-1">{fieldErrors.phone}</p>
                            )}
                            {phoneCheckLoading && (
                                <p className="text-sm text-blue-600 mt-1">Checking phone availability...</p>
                            )}
                            {phoneExists && !fieldErrors.phone && (
                                <p className="text-sm text-rose-600 mt-1 font-semibold">⚠️ Phone number already exists</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email Address <span className="text-rose-500 font-semibold">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400">
                                    <ContactIcon />
                                </span>
                                <input
                                    required
                                    type="email"
                                    value={formData.candidateEmail}
                                    onChange={e => setFormData({ ...formData, candidateEmail: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="Enter email address"
                                />
                            </div>
                            {fieldErrors.email && (
                                <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Current Location <span className="text-rose-500 font-semibold">*</span></label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-400">
                                    <LocationIcon />
                                </span>
                                <input
                                    required
                                    type="text"
                                    value={formData.candidateLocation}
                                    onChange={e => setFormData({ ...formData, candidateLocation: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    placeholder="City, Area"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Package & Subjects */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Course Packaging</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-3">Select Package <span className="text-rose-500 font-semibold">*</span></label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {packages.map(pkg => (
                                <label
                                    key={pkg.id}
                                    className={`
                                        flex items-center p-3 rounded-lg border cursor-pointer transition-all
                                        ${formData.packageId === pkg.id
                                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name="package"
                                        value={pkg.id}
                                        checked={formData.packageId === pkg.id}
                                        onChange={() => handlePackageSelect(pkg.id)}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-slate-700">{pkg.name}</span>
                                </label>
                            ))}
                            <label
                                className={`
                                        flex items-center p-3 rounded-lg border cursor-pointer transition-all
                                        ${formData.packageId === PACKAGE_ID_OTHERS
                                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                                        : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}
                                    `}
                            >
                                <input
                                    type="radio"
                                    name="package"
                                    value={PACKAGE_ID_OTHERS}
                                    checked={formData.packageId === PACKAGE_ID_OTHERS}
                                    onChange={() => handlePackageSelect(PACKAGE_ID_OTHERS)}
                                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-sm font-medium text-slate-700">Others</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">Included Subjects</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {subjects.map(subject => (
                                <label
                                    key={subject.id}
                                    className="flex items-center space-x-2 text-sm text-slate-700 hover:text-indigo-600 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.subjectIds.includes(subject.id)}
                                        onChange={() => handleSubjectToggle(subject.id)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span>{subject.name}</span>
                                </label>
                            ))}
                        </div>
                        {formData.subjectIds.length === 0 && formData.packageId === PACKAGE_ID_OTHERS && (
                            <p className="text-xs text-red-500 mt-2">Please select at least one subject.</p>
                        )}
                        {formData.subjectIds.length === 0 && formData.packageId !== PACKAGE_ID_OTHERS && formData.packageId !== null && (
                            <p className="text-xs text-amber-500 mt-2">Subjects will be auto-selected based on the package.</p>
                        )}
                        {formData.subjectIds.length === 0 && formData.packageId === null && (
                            <p className="text-xs text-amber-500 mt-2">No subjects selected. Please select a package or manually check subjects.</p>
                        )}
                    </div>
                </div>

                {/* 3. Training Preferences */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Training Preferences</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Preferred Training Mode</label>
                            <div className="flex flex-wrap gap-4">
                                {TRAINING_MODES.map(mode => (
                                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="trainingMode"
                                            value={mode}
                                            checked={formData.trainingMode === mode}
                                            onChange={e => setFormData({ ...formData, trainingMode: e.target.value })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700">{mode}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Preferred Timings</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {TRAINING_TIMINGS.map(timing => (
                                    <label key={timing} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="trainingTiming"
                                            value={timing}
                                            checked={formData.trainingTiming === timing}
                                            onChange={e => setFormData({ ...formData, trainingTiming: e.target.value })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700">{timing}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Ideally Start By</label>
                            <div className="flex flex-wrap gap-4">
                                {START_DATES.map(date => (
                                    <label key={date} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="startDate"
                                            value={date}
                                            checked={formData.startDate === date}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700">{date}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Professional Background */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Profession</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Current Situation</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {PROF_SITUATIONS.map(sit => (
                                    <label key={sit} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="situation"
                                            value={sit}
                                            checked={formData.professionalSituation === sit}
                                            onChange={e => setFormData({ ...formData, professionalSituation: e.target.value })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700">{sit}</span>
                                    </label>
                                ))}
                            </div>
                            {formData.professionalSituation === 'Other' && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Please Specify</label>
                                    <input
                                        type="text"
                                        value={formData.situationOther}
                                        onChange={e => setFormData({ ...formData, situationOther: e.target.value })}
                                        placeholder="Enter your current situation"
                                        className="w-full sm:w-1/2 px-4 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Highest Qualification</label>
                            <div className="flex flex-wrap gap-4">
                                {QUALIFICATIONS.map(qual => (
                                    <label key={qual} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="qualification"
                                            value={qual}
                                            checked={formData.qualification === qual}
                                            onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700">{qual}</span>
                                    </label>
                                ))}
                            </div>
                            {formData.qualification === 'Other' && (
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Please Specify</label>
                                    <input
                                        type="text"
                                        value={formData.qualificationOther}
                                        onChange={e => setFormData({ ...formData, qualificationOther: e.target.value })}
                                        placeholder="Enter your qualification"
                                        className="w-full sm:w-1/2 px-4 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">Experience</label>
                            <div className="flex flex-wrap gap-4">
                                {EXPERIENCES.map(exp => (
                                    <label key={exp} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="experience"
                                            value={exp}
                                            checked={formData.experience === exp}
                                            onChange={e => setFormData({ ...formData, experience: e.target.value })}
                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-slate-700">{exp}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Source & Consent */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Other Details</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-3">How did you hear about NammaQA?</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {SOURCES.map(source => (
                                <label key={source} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="source"
                                        value={source}
                                        checked={formData.source === source}
                                        onChange={e => setFormData({ ...formData, source: e.target.value })}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-slate-700">{source}</span>
                                </label>
                            ))}
                        </div>
                        {formData.source === 'Other' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={formData.sourceOther}
                                    onChange={e => setFormData({ ...formData, sourceOther: e.target.value })}
                                    placeholder="Please specify"
                                    className="w-full sm:w-1/2 px-4 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.agreed}
                                onChange={e => setFormData({ ...formData, agreed: e.target.checked })}
                                className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors leading-relaxed">
                                I agree to be contacted via phone, WhatsApp, email, Newsletters regarding NammaQA Training Community program and offers. Terms & Conditions applied.
                            </span>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium transition-colors"
                    >
                        Clear Form
                    </button>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full sm:w-auto px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving...' : 'Save Enquiry'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}