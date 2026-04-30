import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import type { Enquiry, Package, Subject } from '../types';

interface LogEntry {
    id: number;
    title: string;
    description: string;
    author: string;
    createdAt: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

interface DetailsFormData extends Partial<Enquiry> {
    sourceOther?: string;
}

const TRAINING_MODES = ['Offline', 'Hybrid', 'Online'];
const TRAINING_TIMINGS = [
    'Morning',
    'Evening',
    'Anytime in Weekdays',
    'Weekends'
];
const START_DATES = ['Immediate', 'After 10 days', 'After 15 days', 'After 1 Month'];
const PROF_SITUATIONS = ['Fresher', 'Currently Working', 'Switching from Another Domain', 'Other'];
const QUALIFICATIONS = ['Diploma', "Bachelor's Degree", "Master's Degree", 'Other'];
const EXPERIENCES = ['Less than 1 Year or Fresher', '1-3 Years', '3-5 Years', '5+ Years'];
const SOURCES = ['Instagram', 'Youtube', 'Whatsapp Channel', 'Friend Reference', 'Facebook', 'College Reference', 'Linkedin', 'Other Social Network', 'Other'];
// hello
export default function CandidateDetails() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    // Extract the 'from' query parameter to determine where to navigate back to
    const getBackPath = () => {
        const params = new URLSearchParams(location.search);
        const fromParam = params.get('from');
        
        if (fromParam === 'demo-list') {
            return '/demo-list';
        }
        if (fromParam === 'enquiries') {
            return '/enquiries';
        }
        if (fromParam === 'class-list') {
            return '/class-list';
        }
        // Default to enquiries page if no parameter or unknown value
        return '/enquiries';
    };

    const [enquiry, setEnquiry] = useState<Enquiry | null>(location.state?.enquiry || null);
    const [loading, setLoading] = useState(!location.state?.enquiry);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [savingStatus, setSavingStatus] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [packages, setPackages] = useState<Package[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [expandedSections, setExpandedSections] = useState({
        details: true,
        logs: false,
        status: false,
        fees: false,
        payment: false,
        movement: false,
    });
    const [isEditingDetails, setIsEditingDetails] = useState(false);
    const [detailsForm, setDetailsForm] = useState<DetailsFormData>({});
    const [feesByPackage, setFeesByPackage] = useState<Record<number, string>>({});
    const [feesBySubject, setFeesBySubject] = useState<Record<number, string>>({});
    const [newSubjectToAdd, setNewSubjectToAdd] = useState<number | null>(null);
    const [logForm, setLogForm] = useState({ title: '', description: '' });
    const [submittingLog, setSubmittingLog] = useState(false);
    const [logError, setLogError] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [applyDiscount, setApplyDiscount] = useState<boolean>(false);

    const role = localStorage.getItem('userRole');
    const isCounsellor = role === 'COUNSELLOR';
    const isAccounts = role === 'ACCOUNTS';
    const statusOptions = isCounsellor
        ? ['enquiry stage', 'demo']
        : ['enquiry stage', 'demo', 'qualified demo', 'class', 'class qualified'];
    const isDemoCandidate = enquiry?.candidateStatus === 'demo';
    const canMoveCandidate = enquiry?.candidateStatus === 'demo' || enquiry?.candidateStatus === 'qualified demo';


    useEffect(() => {
        if (isDemoCandidate && isEditingDetails) {
            setIsEditingDetails(false);
        }
    }, [isDemoCandidate, isEditingDetails]);

    const loadPackageSubjectOptions = async () => {
        if (packages.length > 0 && subjects.length > 0) return;

        try {
            const [pkgResponse, subjectResponse] = await Promise.all([
                apiRequest<Package[]>('/api/packages', { method: 'GET' }),
                apiRequest<Subject[]>('/api/subjects', { method: 'GET' }),
            ]);
            setPackages(pkgResponse);
            setSubjects(subjectResponse);
        } catch (err) {
            console.error('Failed to load package/subject options:', err);
        }
    };

    const getSelectedPackageFee = (packageId: number | null | undefined) => {
        if (!packageId) return 0;
        return Number(feesByPackage[packageId] || 0);
    };

    const getSubjectFee = (subjectId: number) => {
        return Number(feesBySubject[subjectId] || 0);
    };

    const getPackageName = (packageId: number | null | undefined) => {
        if (packageId === null) return 'Others';
        if (packageId === undefined) return '-';
        const pkg = packages.find(p => p.id === packageId);
        return pkg ? pkg.name : `Package ${packageId}`;
    };

    const buildTargetedFees = (subjectIds: number[]) => {
        return subjectIds.reduce<Record<string, number>>((acc, subjectId) => {
            const subjectName = subjects.find(subject => subject.id === subjectId)?.name || `Subject ${subjectId}`;
            acc[subjectName] = Number(feesBySubject[subjectId] || 0);
            return acc;
        }, {});
    };

    const savePackageSubjectUpdate = async (packageId: number | null, subjectIds: number[]) => {
        if (!enquiry) return;

        setUpdateError(null);

        try {
            const response = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                method: 'PUT',
                body: {
                    packageId: packageId ?? null,
                    subjectIds,
                    targetedFees: buildTargetedFees(subjectIds),
                },
            });

            setEnquiry(prev => prev ? ({ ...prev, ...(response || {}), packageId: packageId ?? null, subjectIds }) : prev);
            setSuccessMessage('Package and subject selection updated successfully');
        } catch (err) {
            console.error('Failed to update package/subject selection:', err);
            if (err instanceof Error) {
                setUpdateError(err.message || 'Failed to update package and subject selection.');
            } else {
                setUpdateError('Failed to update package and subject selection.');
            }
        }
    };

    const handleAddSubject = async () => {
        if (!newSubjectToAdd) return;
        if (detailsForm.subjectIds?.includes(newSubjectToAdd)) return;

        const updatedSubjectIds = [...(detailsForm.subjectIds || []), newSubjectToAdd];
        setDetailsForm(prev => ({
            ...prev,
            subjectIds: updatedSubjectIds,
        }));
        setFeesBySubject(prev => ({ ...prev, [newSubjectToAdd]: '' }));
        setNewSubjectToAdd(null);

        await savePackageSubjectUpdate(detailsForm.packageId ?? null, updatedSubjectIds);
    };

    const handleRemoveSubject = async (subjectId: number) => {
        const updatedSubjectIds = (detailsForm.subjectIds || []).filter(id => id !== subjectId);
        setDetailsForm(prev => ({
            ...prev,
            subjectIds: updatedSubjectIds,
        }));
        setFeesBySubject(prev => {
            const next = { ...prev };
            delete next[subjectId];
            return next;
        });

        await savePackageSubjectUpdate(detailsForm.packageId ?? null, updatedSubjectIds);
    };

    const availableAdditionalSubjects = subjects.filter(subject => !(detailsForm.subjectIds || []).includes(subject.id));

    const getSubjectNames = (subjectIds: number[] | undefined) => {
        if (!subjectIds?.length) return '-';
        return subjectIds
            .map(id => subjects.find(s => s.id === id)?.name || `Subject ${id}`)
            .join(', ');
    };

    const getPackageCost = (packageId: number | null): number => {
        if (!packageId) return 0;
        const pkg = packages.find(p => p.id === packageId);
        return pkg ? pkg.cost || 0 : 0;
    };

    const calculatePaymentDetails = (enquiry: Enquiry) => {
        let packageCost = 0;
        if (enquiry.packageId) {
            packageCost = getSelectedPackageFee(enquiry.packageId) || getPackageCost(enquiry.packageId);
        } else {
            // For "others", sum the entered fees for selected subjects
            packageCost = enquiry.subjectIds.reduce((sum, subjectId) => {
                return sum + getSubjectFee(subjectId);
            }, 0);
        }
        const discount = applyDiscount ? discountAmount : 0;
        const baseCost = packageCost - discount;
        const gstRate = 18;
        const gstAmount = baseCost * (gstRate / 100);
        const totalCost = baseCost + gstAmount;
        const paidAmount = enquiry.billing ? parseFloat(enquiry.billing.amountPaid) || 0 : 0;
        const balance = totalCost - paidAmount;

        return {
            packageCost,
            discount,
            baseCost: Math.round(baseCost * 100) / 100,
            gstRate,
            gstAmount: Math.round(gstAmount * 100) / 100,
            totalCost: Math.round(totalCost * 100) / 100,
            paidAmount,
            balance: Math.max(0, Math.round(balance * 100) / 100),
        };
    };

    const handlePayment = async () => {
        if (!enquiry) return;

        if (paymentAmount < 1) {
            alert('Payment amount must be at least ₹1');
            return;
        }

        const paymentDetails = calculatePaymentDetails(enquiry);
        if (paymentAmount > paymentDetails.balance) {
            alert('Payment amount cannot exceed the balance amount');
            return;
        }

        setProcessingPayment(true);
        try {
            // Create or update billing record
            const billingData = {
                enquiryId: enquiry.id,
                packageCost: paymentDetails.packageCost,
                discount: paymentDetails.discount,
                gst: paymentDetails.gstRate,
                gstAmount: paymentDetails.gstAmount,
                amountPaid: paymentAmount,
                balance: paymentDetails.balance,
            };

            if (enquiry.billing?.id) {
                // Update existing billing
                await apiRequest(`/api/billings/${enquiry.billing.id}`, {
                    method: 'PUT',
                    body: billingData,
                });
            } else {
                // Create new billing
                await apiRequest('/api/billings', {
                    method: 'POST',
                    body: billingData,
                });
            }

            // Move candidate to class list
            try {
                await apiRequest<Enquiry>(`/api/enquiries/change-status`, {
                    method: 'POST',
                    body: {
                        enquiryId: enquiry.id,
                        newStatus: 'class',
                    },
                });
            } catch (statusErr) {
                console.warn('Status change endpoint failed, falling back to direct enquiry update', statusErr);
                // If change-status is restricted, try direct update instead.
                await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                    method: 'PUT',
                    body: {
                        candidateStatus: 'class',
                    },
                });
            }

            // Refresh enquiry data
            const updatedEnquiry = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, { method: 'GET' });
            setEnquiry(updatedEnquiry);

            setPaymentAmount(0);
            setSuccessMessage(`Payment of ₹${paymentAmount} processed successfully! Candidate moved to Class List.`);
        } catch (err) {
            console.error('Payment processing failed:', err);
            if (err instanceof Error) {
                setUpdateError(err.message || 'Failed to process payment. Please try again.');
            } else {
                setUpdateError('Failed to process payment. Please try again.');
            }
        } finally {
            setProcessingPayment(false);
        }
    };

    useEffect(() => {
        if (enquiry) {
            const referralValue = SOURCES.includes(enquiry.referral) ? enquiry.referral : 'Other';
            setSelectedStatus(enquiry.candidateStatus || 'enquiry stage');
            // Clean phone and name data on initial load
            const cleanedName = (enquiry.name || '').replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
            const cleanedPhone = (enquiry.phone || '').replace(/\D/g, '').slice(0, 10);
            setDetailsForm({
                name: cleanedName,
                email: enquiry.email,
                phone: cleanedPhone,
                current_location: enquiry.current_location,
                profession: enquiry.profession,
                referral: referralValue,
                sourceOther: referralValue === 'Other' ? enquiry.referral : '',
                consent: enquiry.consent,
                trainingMode: enquiry.trainingMode,
                trainingTime: enquiry.trainingTime,
                startTime: enquiry.startTime,
                qualification: enquiry.qualification,
                experience: enquiry.experience,
                packageId: enquiry.packageId,
                subjectIds: enquiry.subjectIds || [],
            });
            loadPackageSubjectOptions();
        }
    }, [enquiry]);

    useEffect(() => {
        if (!enquiry?.targetedFees || subjects.length === 0) return;

        const feeLookup = Object.fromEntries(
            Object.entries(enquiry.targetedFees).map(([name, fee]) => [name.toLowerCase(), fee])
        );

        const mappedFees = (enquiry.subjectIds || []).reduce<Record<number, string>>((acc, subjectId) => {
            const subjectName = subjects.find(subject => subject.id === subjectId)?.name;
            if (!subjectName) return acc;
            const fee = feeLookup[subjectName.toLowerCase()];
            if (fee !== undefined) acc[subjectId] = fee.toString();
            return acc;
        }, {});

        setFeesBySubject(prev => ({ ...mappedFees, ...prev }));
    }, [enquiry?.targetedFees, enquiry?.subjectIds, subjects]);

    // Validate phone number format (10 digits starting with 9, 8, 7, or 6)
    const validatePhoneNumber = (phone: string): string | null => {
        if (!phone) return null;
        if (phone.length !== 10) return 'Phone number must be exactly 10 digits';
        if (!/^[6789]/.test(phone)) return 'Phone number must start with 6, 7, 8, or 9';
        return null;
    };

    // Handle full name input - allow only alphabets and spaces, max 25 characters
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
        setDetailsForm(prev => ({ ...prev, name: value }));
    };

    // Handle phone input - allow only digits, max 10
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setDetailsForm(prev => ({ ...prev, phone: value }));
    };

    const handleUpdateCandidate = async () => {
        if (!enquiry) return;

        setUpdateError(null); // Clear any previous update errors

        // Validate phone number before updating
        const phoneError = validatePhoneNumber(detailsForm.phone || '');
        if (detailsForm.phone && phoneError) {
            setUpdateError(phoneError);
            return;
        }

        const payload: Partial<Enquiry> = {
            name: detailsForm.name,
            email: detailsForm.email,
            phone: detailsForm.phone,
            current_location: detailsForm.current_location,
            profession: detailsForm.profession,
            referral: detailsForm.referral === 'Other' ? (detailsForm.sourceOther || 'Other') : detailsForm.referral,
            consent: detailsForm.consent,
            trainingMode: detailsForm.trainingMode,
            trainingTime: detailsForm.trainingTime,
            startTime: detailsForm.startTime,
            qualification: detailsForm.qualification,
            experience: detailsForm.experience,
            packageId: detailsForm.packageId ?? null,
            subjectIds: detailsForm.subjectIds || [],
        };

        try {
            const response = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                method: 'PUT',
                body: payload,
            });

            setEnquiry({ ...enquiry, ...payload, ...(response || {}) });
            setIsEditingDetails(false);
            setUpdateError(null); // Clear any errors on success
            setSuccessMessage('Candidate details updated successfully');
        } catch (err) {
            console.error('Failed to update candidate details:', err);

            // Check for duplicate contact error
            if (err instanceof Error) {
                const errorMessage = err.message.toLowerCase();
                const status = (err as any).status;

                if (errorMessage.includes('contact already exists') ||
                    errorMessage.includes('duplicate contact') ||
                    errorMessage.includes('contact exists') ||
                    status === 409) {
                    setUpdateError('Contact already exists. Please use a different email or phone number.');
                } else if (status === 400) {
                    // Validation error - show the specific backend message
                    const serverMessage = err.message;
                    if (serverMessage && serverMessage.length < 100) {
                        setUpdateError(serverMessage);
                    } else {
                        setUpdateError('Invalid data provided. Please check all fields and try again.');
                    }
                } else if (status === 401 || status === 403) {
                    // Authentication/Authorization error
                    setUpdateError('You do not have permission to update this enquiry.');
                } else if (status === 404) {
                    // Not found error
                    setUpdateError('Enquiry not found. It may have been deleted.');
                } else if (status >= 500) {
                    // Server error
                    setUpdateError('Server error occurred. Please try again later.');
                } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                    // Network error
                    setUpdateError('Network error. Please check your connection and try again.');
                } else if (errorMessage.includes('timeout')) {
                    // Timeout error
                    setUpdateError('Request timed out. Please try again.');
                } else {
                    // Show server-provided error message if it's user-friendly, otherwise use generic message
                    const serverMessage = err.message;
                    if (serverMessage && serverMessage.length < 100 && !serverMessage.includes('HTTP')) {
                        setUpdateError(serverMessage);
                    } else {
                        setUpdateError('Failed to update candidate details. Please try again.');
                    }
                }
            } else {
                setUpdateError('An unexpected error occurred. Please try again.');
            }
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
                if (response.enquiry.candidateStatus === 'demo' && isCounsellor) {
                    setSuccessMessage('Moved to demo successfully');
                } else {
                    setSuccessMessage('Status updated successfully');
                }
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            setEnquiry(prev => prev ? ({ ...prev, candidateStatus: previousStatus }) : prev);
            alert('Failed to update status. Please try again.');
        } finally {
            setSavingStatus(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!enquiry) return;
        if (!logForm.title.trim()) {
            setLogError('Call title is required');
            return;
        }
        if (!logForm.description.trim()) {
            setLogError('Call description is required');
            return;
        }

        setSubmittingLog(true);
        setLogError(null);

        try {
            const response = await apiRequest<{ message: string; log: LogEntry }>('/api/logs', {
                method: 'POST',
                body: {
                    enquiryId: enquiry.id,
                    title: logForm.title.trim(),
                    description: logForm.description.trim(),
                },
            });

            if (response?.log) {
                setLogs(prev => [response.log, ...prev]);
                setLogForm({ title: '', description: '' });
                setSuccessMessage('Call log added successfully');
            }
        } catch (err) {
            console.error('Failed to add log:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to add call log. Please try again.';
            setLogError(errorMessage);
        } finally {
            setSubmittingLog(false);
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
                    onClick={() => navigate(getBackPath())}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                    Back to List
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 -m-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(getBackPath())}
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

            {successMessage && (
                <div className="mb-4 rounded-3xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                    <div className="flex items-center justify-between gap-3">
                        <span>{successMessage}</span>
                        <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-green-700 font-semibold hover:text-green-900"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, details: !prev.details }))}
                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Candidate Details</h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {isDemoCandidate ? 'Review candidate details (read-only).' : 'Review and edit core enquiry details.'}
                            </p>
                        </div>
                        <span className="text-2xl font-bold text-slate-400">
                            {expandedSections.details ? '-' : '+'}
                        </span>
                    </button>
                    {expandedSections.details && (
                        <div className="px-6 pb-6 space-y-6 border-t border-slate-200">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-sm text-slate-500">
                                    {isDemoCandidate ? 'Read-only details for demo candidates.' : 'Fields marked with * are mandatory and editable.'}
                                </div>
                                {!isDemoCandidate && !isEditingDetails && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingDetails(true);
                                            setUpdateError(null); // Clear any previous update errors when starting to edit
                                            setSuccessMessage(null); // Clear any previous success messages when starting to edit
                                            loadPackageSubjectOptions();
                                        }}
                                        className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        Edit details
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-4">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Name * </label>
                                    <input
                                        type="text"
                                        value={detailsForm.name || ''}
                                        disabled={!isEditingDetails}
                                        onChange={handleNameChange}
                                        maxLength={25}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                        placeholder="Enter full name (alphabets and spaces only)"
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
                                        onChange={handlePhoneChange}
                                        inputMode="numeric"
                                        maxLength={10}
                                        className={`w-full rounded-3xl border bg-white px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 ${
                                            detailsForm.phone && validatePhoneNumber(detailsForm.phone)
                                                ? 'border-rose-500 focus:border-rose-500'
                                                : 'border-slate-200 focus:border-indigo-500'
                                        }`}
                                        placeholder="Enter 10-digit phone number"
                                    />
                                    {detailsForm.phone && validatePhoneNumber(detailsForm.phone) && (
                                        <p className="text-xs text-rose-600 mt-1">{validatePhoneNumber(detailsForm.phone)}</p>
                                    )}

                                    <label className="block text-xs font-semibold text-slate-500 uppercase">Location *</label>
                                    <input
                                        type="text"
                                        value={detailsForm.current_location || ''}
                                        disabled={!isEditingDetails}
                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, current_location: e.target.value }))}
                                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                    />
                                </div>

                                {!isEditingDetails && (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">Package</p>
                                            <p className="text-sm font-semibold text-slate-900">{getPackageName(detailsForm.packageId)}</p>
                                        </div>
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">Subjects</p>
                                            <p className="text-sm font-semibold text-slate-900">{getSubjectNames(detailsForm.subjectIds)}</p>
                                        </div>
                                    </div>
                                )}

                                {isEditingDetails && (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Package</label>
                                            {packages.length === 0 ? (
                                                <div className="text-sm text-slate-500">Loading package options…</div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {packages.map(pkg => (
                                                        <label
                                                            key={pkg.id}
                                                            className={`flex items-center gap-2 rounded-3xl border px-4 py-3 cursor-pointer transition-all ${detailsForm.packageId === pkg.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="package"
                                                                value={pkg.id}
                                                                checked={detailsForm.packageId === pkg.id}
                                                                onChange={() => {
                                                                    const packageSubjects = ((pkg as any).subjects as Subject[] | undefined) ?? pkg.Subjects;
                                                                    setDetailsForm(prev => ({
                                                                        ...prev,
                                                                        packageId: pkg.id,
                                                                        subjectIds: packageSubjects?.map(s => s.id) ?? [],
                                                                    }));
                                                                }}
                                                                className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm font-medium text-slate-700">{pkg.name}</span>
                                                        </label>
                                                    ))}
                                                    <label
                                                        className={`flex items-center gap-2 rounded-3xl border px-4 py-3 cursor-pointer transition-all ${detailsForm.packageId === null ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="package"
                                                            value="null"
                                                            checked={detailsForm.packageId === null}
                                                            onChange={() => setDetailsForm(prev => ({ ...prev, packageId: null, subjectIds: [] }))}
                                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm font-medium text-slate-700">Others</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Included Subjects</label>
                                            {subjects.length === 0 ? (
                                                <div className="text-sm text-slate-500">Loading subjects…</div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {subjects.map(subject => (
                                                        <label key={subject.id} className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 cursor-pointer transition-all hover:border-indigo-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={detailsForm.subjectIds?.includes(subject.id) || false}
                                                                disabled={!isEditingDetails}
                                                                onChange={(e) => {
                                                                    const currentIds = detailsForm.subjectIds || [];
                                                                    const newIds = e.target.checked
                                                                        ? [...currentIds, subject.id]
                                                                        : currentIds.filter(id => id !== subject.id);
                                                                    setDetailsForm(prev => ({ ...prev, subjectIds: newIds }));
                                                                }}
                                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                            />
                                                            <span className="text-sm text-slate-700">{subject.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Current Situation</label>
                                        <div className="grid gap-2">
                                            {PROF_SITUATIONS.map(situation => (
                                                <label key={situation} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="profession"
                                                        value={situation}
                                                        checked={detailsForm.profession === situation}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, profession: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{situation}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Highest Qualification</label>
                                        <div className="flex flex-wrap gap-3">
                                            {QUALIFICATIONS.map(qualification => (
                                                <label key={qualification} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="qualification"
                                                        value={qualification}
                                                        checked={detailsForm.qualification === qualification}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, qualification: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{qualification}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Experience</label>
                                        <div className="flex flex-wrap gap-3">
                                            {EXPERIENCES.map(experience => (
                                                <label key={experience} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="experience"
                                                        value={experience}
                                                        checked={detailsForm.experience === experience}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, experience: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{experience}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={detailsForm.consent || false}
                                            disabled={!isEditingDetails}
                                            onChange={(e) => setDetailsForm(prev => ({ ...prev, consent: e.target.checked }))}
                                            className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                        />
                                        <label className="text-sm text-slate-600 leading-relaxed">
                                            I agree to be contacted via phone, WhatsApp, email, Newsletters regarding NammaQA Training Community program and offers.
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Preferred Training Mode</label>
                                        <div className="flex flex-wrap gap-3">
                                            {TRAINING_MODES.map(mode => (
                                                <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="trainingMode"
                                                        value={mode}
                                                        checked={detailsForm.trainingMode === mode}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, trainingMode: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{mode}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Preferred Timings</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {TRAINING_TIMINGS.map(timing => (
                                                <label key={timing} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="trainingTiming"
                                                        value={timing}
                                                        checked={detailsForm.trainingTime === timing}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, trainingTime: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{timing}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Ideally Start By</label>
                                        <div className="flex flex-wrap gap-3">
                                            {START_DATES.map(startDate => (
                                                <label key={startDate} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="startTime"
                                                        value={startDate}
                                                        checked={detailsForm.startTime === startDate}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, startTime: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{startDate}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">How did you hear about us?</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {SOURCES.map(source => (
                                                <label key={source} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="referral"
                                                        value={source}
                                                        checked={detailsForm.referral === source}
                                                        disabled={!isEditingDetails}
                                                        onChange={(e) => setDetailsForm(prev => ({ ...prev, referral: e.target.value }))}
                                                        className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">{source}</span>
                                                </label>
                                            ))}
                                        </div>
                                        {detailsForm.referral === 'Other' && (
                                            <input
                                                type="text"
                                                value={detailsForm.sourceOther || ''}
                                                disabled={!isEditingDetails}
                                                onChange={(e) => setDetailsForm(prev => ({ ...prev, sourceOther: e.target.value }))}
                                                placeholder="Please specify"
                                                className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                            />
                                        )}
                                    </div>
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
                                            setUpdateError(null); // Clear any update errors when canceling
                                            setSuccessMessage(null); // Clear any success messages when canceling
                                            if (enquiry) {
                                                const referralValue = SOURCES.includes(enquiry.referral) ? enquiry.referral : 'Other';
                                                setDetailsForm({
                                                    name: enquiry.name,
                                                    email: enquiry.email,
                                                    phone: enquiry.phone,
                                                    current_location: enquiry.current_location,
                                                    profession: enquiry.profession,
                                                    referral: referralValue,
                                                    sourceOther: referralValue === 'Other' ? enquiry.referral : '',
                                                    consent: enquiry.consent,
                                                    trainingMode: enquiry.trainingMode,
                                                    trainingTime: enquiry.trainingTime,
                                                    startTime: enquiry.startTime,
                                                    qualification: enquiry.qualification,
                                                    experience: enquiry.experience,
                                                    packageId: enquiry.packageId,
                                                    subjectIds: enquiry.subjectIds || [],
                                                });
                                            }
                                        }}
                                        className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            {updateError && (
                                <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-3xl">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-sm font-medium text-rose-800">{updateError}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, logs: !prev.logs }))}
                        className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Call Logs</h2>
                            <p className="text-sm text-slate-500 mt-1">{isDemoCandidate ? 'View call notes for this enquiry.' : 'Add and view call notes for this enquiry.'}</p>
                        </div>
                        <span className="text-2xl font-bold text-slate-400">
                            {expandedSections.logs ? '-' : '+'}
                        </span>
                    </button>
                {expandedSections.logs && (
                    <div className="px-6 pb-6 space-y-6 border-t border-slate-200">
                        {!isDemoCandidate && (
                            <form onSubmit={handleAddLog} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-semibold text-slate-900 text-sm">Add a Call Log</h3>
                                
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Call Title</label>
                                    <input
                                        type="text"
                                        value={logForm.title}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter call title"
                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        disabled={submittingLog}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Add a note about the call</label>
                                    <textarea
                                        value={logForm.description}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter call details and notes..."
                                        rows={4}
                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        disabled={submittingLog}
                                    />
                                </div>

                                {logError && (
                                    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-3">
                                        <p className="text-xs text-rose-700 font-medium">{logError}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLogForm({ title: '', description: '' });
                                            setLogError(null);
                                        }}
                                        disabled={submittingLog}
                                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingLog}
                                        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                                    >
                                        {submittingLog ? 'Saving...' : 'Save Log'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {(isAccounts || !isDemoCandidate) && (
                            <form onSubmit={handleAddLog} className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                <h3 className="font-semibold text-slate-900 text-sm">Add a Call Log</h3>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Call Title</label>
                                    <input
                                        type="text"
                                        value={logForm.title}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Enter call title"
                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        disabled={submittingLog}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Add a note about the call</label>
                                    <textarea
                                        value={logForm.description}
                                        onChange={(e) => setLogForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Enter call details and notes..."
                                        rows={4}
                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                                        disabled={submittingLog}
                                    />
                                </div>

                                {logError && (
                                    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-3">
                                        <p className="text-xs text-rose-700 font-medium">{logError}</p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLogForm({ title: '', description: '' });
                                            setLogError(null);
                                        }}
                                        disabled={submittingLog}
                                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingLog}
                                        className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                                    >
                                        {submittingLog ? 'Saving...' : 'Save Log'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <div>
                            <h3 className="font-semibold text-slate-900 text-sm mb-4">
                                Existing Logs
                                {logs.length > 0 && <span className="text-slate-500 font-normal ml-2">{logs.length} total</span>}
                            </h3>
                            {logs.length === 0 ? (
                                <div className="text-sm text-slate-500 py-4">No call logs available yet.</div>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map(log => {
                                        const createdDate = log.createdAt ? new Date(log.createdAt) : null;
                                        const formattedDate = createdDate && !isNaN(createdDate.getTime())
                                            ? createdDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                            : '-';
                                        const displayUser = log.user?.name || log.author || 'Unknown user';
                                        return (
                                            <div key={log.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <p className="font-semibold text-slate-900">{log.title}</p>
                                                    <div className="text-xs text-slate-500 text-right">
                                                        <div>{formattedDate}</div>
                                                        <div>by {displayUser}</div>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{log.description}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

                {!isDemoCandidate && (
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExpandedSections(prev => ({ ...prev, status: !prev.status }))}
                            className="w-full flex items-center justify-between px-6 py-5 text-left"
                    >
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">Status</h2>
                            <p className="text-sm text-slate-500 mt-1">Manage the candidate's stage and demo status.</p>
                        </div>
                        <span className="text-2xl font-bold text-slate-400">
                            {expandedSections.status ? '-' : '+'}
                        </span>
                    </button>
                    {expandedSections.status && (
                        <div className="px-6 pb-6 border-t border-slate-200">
                            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-6">
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Select Status</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none"
                                        >
                                            {statusOptions.map(status => (
                                                <option key={status} value={status}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current status</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900">{enquiry.candidateStatus || 'Not set'}</p>
                                        </div>
                                    </div>
                                </div>

                                {isCounsellor && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleStageUpdate}
                                            disabled={savingStatus || selectedStatus === enquiry.candidateStatus}
                                            className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingStatus ? 'Saving...' : 'Save Status'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    </section>
                )}

                {isCounsellor && isDemoCandidate && (
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExpandedSections(prev => ({ ...prev, fees: !prev.fees }))}
                            className="w-full flex items-center justify-between px-6 py-5 text-left"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Fees</h2>
                                <p className="text-sm text-slate-500 mt-1">Enter fees for the selected package and subjects.</p>
                            </div>
                            <span className="text-2xl font-bold text-slate-400">
                                {expandedSections.fees ? '-' : '+'}
                            </span>
                        </button>
                        {expandedSections.fees && (
                            <div className="px-6 pb-6 border-t border-slate-200">
                                <div className="space-y-4">
                                    {detailsForm.packageId !== null && detailsForm.packageId !== undefined ? (
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Package</p>
                                                    <p className="text-sm font-semibold text-slate-900">{getPackageName(detailsForm.packageId)}</p>
                                                </div>
                                                <div className="flex-1 min-w-[160px]">
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Fee (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={detailsForm.packageId ? feesByPackage[detailsForm.packageId] || '' : ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (detailsForm.packageId) {
                                                                setFeesByPackage(prev => ({ ...prev, [detailsForm.packageId as number]: value }));
                                                            }
                                                        }}
                                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                        placeholder="Enter package fee"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                            No package selected.
                                        </div>
                                    )}

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="mb-4">
                                            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Subjects</p>
                                            <p className="text-sm font-semibold text-slate-900">Assigned Subjects</p>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-[1fr_150px] items-end mb-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Add Subject</label>
                                                <select
                                                    value={newSubjectToAdd ?? ''}
                                                    onChange={(e) => setNewSubjectToAdd(Number(e.target.value) || null)}
                                                    className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="">Select subject</option>
                                                    {availableAdditionalSubjects.map(subject => (
                                                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleAddSubject}
                                                disabled={!newSubjectToAdd}
                                                className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
                                            >
                                                Add Subject
                                            </button>
                                        </div>
                                        {enquiry?.targetedFees && Object.keys(enquiry.targetedFees).length > 0 && (
                                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 mb-4">
                                                <p className="text-sm font-semibold text-slate-900 mb-3">Existing targeted fees</p>
                                                <div className="grid gap-2">
                                                    {Object.entries(enquiry.targetedFees).map(([name, fee]) => (
                                                        <div key={name} className="flex justify-between text-sm text-slate-700">
                                                            <span>{name}</span>
                                                            <span>₹{fee}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {detailsForm.subjectIds?.length ? (
                                            <div className="space-y-3">
                                                {detailsForm.subjectIds.map(subjectId => (
                                                    <div key={subjectId} className="grid gap-3 sm:grid-cols-[1fr_180px] items-center rounded-3xl border border-slate-200 bg-white p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <p className="text-sm font-medium text-slate-800">{subjects.find(subject => subject.id === subjectId)?.name || `Subject ${subjectId}`}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveSubject(subjectId)}
                                                                className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Fee (₹)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={feesBySubject[subjectId] || ''}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    setFeesBySubject(prev => ({ ...prev, [subjectId]: value }));
                                                                }}
                                                                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                                                placeholder="Enter subject fee"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-600">No subjects selected.</div>
                                        )}
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                                        <div className="flex justify-between gap-3">
                                            <span className="font-medium">Total entered fees</span>
                                            <span className="font-semibold text-slate-900">₹{(
                                                (detailsForm.packageId ? getSelectedPackageFee(detailsForm.packageId) : 0) +
                                                (detailsForm.subjectIds || []).reduce((sum, id) => sum + getSubjectFee(id), 0)
                                            ).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => savePackageSubjectUpdate(detailsForm.packageId ?? null, detailsForm.subjectIds || [])}
                                            className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                        >
                                            Save subjects
                                        </button>
                                        <p className="text-sm text-slate-500">Saving will update the candidate fields and persist selected subjects.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {isAccounts && enquiry?.candidateStatus === 'demo' && (
                    <>
                        {/* Payment Section */}
                        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setExpandedSections(prev => ({ ...prev, payment: !prev.payment }))}
                                className="w-full flex items-center justify-between px-6 py-5 text-left"
                            >
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
                                    <p className="text-sm text-slate-500 mt-1">Manage payment and billing details.</p>
                                </div>
                                <span className="text-2xl font-bold text-slate-400">
                                    {expandedSections.payment ? '-' : '+'}
                                </span>
                            </button>
                            {expandedSections.payment && (
                                <div className="px-6 pb-6 border-t border-slate-200">
                                    <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-6">
                                        {enquiry && calculatePaymentDetails(enquiry).packageCost > 0 ? (
                                            <>
                                                {/* Package Cost Display */}
                                                <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-200">
                                                    <span className="text-slate-600">Package Cost:</span>
                                                    <span className="font-semibold text-slate-900">₹{calculatePaymentDetails(enquiry).packageCost}</span>
                                                </div>

                                                {/* Discount Section */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id="applyDiscount"
                                                            checked={applyDiscount}
                                                            onChange={(e) => setApplyDiscount(e.target.checked)}
                                                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor="applyDiscount" className="text-sm font-medium text-slate-700">
                                                            Apply Discount
                                                        </label>
                                                    </div>

                                                    {applyDiscount && (
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Discount Amount (₹)</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={calculatePaymentDetails(enquiry).packageCost}
                                                                value={discountAmount || ''}
                                                                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                                                placeholder="Enter discount amount"
                                                                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Cost Breakdown */}
                                                <div className="space-y-3">
                                                    {calculatePaymentDetails(enquiry).discount > 0 && (
                                                        <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-200">
                                                            <span className="text-slate-600">Discount:</span>
                                                            <span className="font-semibold text-green-600">-₹{calculatePaymentDetails(enquiry).discount}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-200">
                                                        <span className="text-slate-600">Base Amount:</span>
                                                        <span className="font-semibold text-slate-900">₹{calculatePaymentDetails(enquiry).baseCost}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-200">
                                                        <span className="text-slate-600">GST (18%):</span>
                                                        <span className="font-semibold text-red-600">-₹{calculatePaymentDetails(enquiry).gstAmount}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2 pb-2 border-b border-slate-200">
                                                        <span className="text-slate-900 font-semibold">Total Amount:</span>
                                                        <span className="text-lg font-bold text-indigo-600">₹{calculatePaymentDetails(enquiry).totalCost}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm py-2">
                                                        <span className="text-slate-600">Amount Paid:</span>
                                                        <span className="font-semibold text-green-600">₹{calculatePaymentDetails(enquiry).paidAmount}</span>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm py-2 border-t border-slate-200">
                                                        <span className="text-slate-900 font-semibold">Balance Amount:</span>
                                                        <span className="text-lg font-bold text-red-600">₹{calculatePaymentDetails(enquiry).balance}</span>
                                                    </div>
                                                </div>

                                                {/* Payment Input */}
                                                <div className="pt-4 space-y-3">
                                                    <label className="block text-sm font-medium text-slate-700">
                                                        Payment Amount (₹1 - ₹{calculatePaymentDetails(enquiry).balance}):
                                                    </label>
                                                    <div className="flex gap-3">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={calculatePaymentDetails(enquiry).balance}
                                                            value={paymentAmount || ''}
                                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                                            placeholder="Enter payment amount"
                                                            className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                        <button
                                                            onClick={handlePayment}
                                                            disabled={processingPayment || paymentAmount < 1 || paymentAmount > calculatePaymentDetails(enquiry).balance}
                                                            className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-3xl hover:bg-indigo-700 disabled:bg-slate-400 transition-colors"
                                                        >
                                                            {processingPayment ? 'Processing...' : 'Pay & Move to Class'}
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        Payment will automatically move the candidate to Class List.
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-slate-600 py-4 text-center">
                                                No package selected or package cost not available.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {isAccounts && canMoveCandidate && (
                    <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setExpandedSections(prev => ({ ...prev, movement: !prev.movement }))}
                            className="w-full flex items-center justify-between px-6 py-5 text-left"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Move Candidate</h2>
                                <p className="text-sm text-slate-500 mt-1">Move candidate to different stages.</p>
                            </div>
                            <span className="text-2xl font-bold text-slate-400">
                                {expandedSections.movement ? '-' : '+'}
                            </span>
                        </button>
                        {expandedSections.movement && (
                            <div className="px-6 pb-6 border-t border-slate-200">
                                <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-[0.16em] mb-2">Select Status</label>
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none"
                                        >
                                            {statusOptions.filter(status => status !== enquiry?.candidateStatus).map(status => (
                                                <option key={status} value={status}>
                                                    {status === 'enquiry stage'
                                                        ? 'Enquiry Stage'
                                                        : status === 'class'
                                                        ? 'Class List'
                                                        : status === 'qualified demo'
                                                        ? 'Qualified Demo'
                                                        : status
                                                    }
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Current status</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">{enquiry?.candidateStatus || 'Not set'}</p>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleStageUpdate}
                                            disabled={savingStatus || selectedStatus === enquiry?.candidateStatus}
                                            className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingStatus ? 'Saving...' : 'Save Status'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
