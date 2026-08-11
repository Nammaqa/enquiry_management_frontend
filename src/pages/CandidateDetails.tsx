import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import type { Enquiry, Package, Subject } from '../types';
import InvoiceModal from '../components/InvoiceModal';
import PaymentHistoryAccordion from '../components/PaymentHistoryAccordion';

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
    professionOther?: string;
    qualificationOther?: string;
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
        if (fromParam === 'paid-list') {
            return '/paid-list';
        }
        // Default to enquiries page if no parameter or unknown value
        return '/enquiries';
    };

    const isClassListOrigin = new URLSearchParams(location.search).get('from') === 'class-list';

    const [enquiry, setEnquiry] = useState<Enquiry | null>(location.state?.enquiry || null);
    const [loading, setLoading] = useState(!location.state?.enquiry);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [savingStatus, setSavingStatus] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);
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
    const [isEditingFees, setIsEditingFees] = useState(false);
    const [detailsForm, setDetailsForm] = useState<DetailsFormData>({});
    const [manuallyAddedSubjectIds, setManuallyAddedSubjectIds] = useState<number[]>([]);
    const [feesByPackage, setFeesByPackage] = useState<Record<number, string>>({});
    const [feesBySubject, setFeesBySubject] = useState<Record<number, string>>({});
    const [savingFees, setSavingFees] = useState(false);
    const [hasUnsavedFeesDraft, setHasUnsavedFeesDraft] = useState(false);
    const [newSubjectToAdd, setNewSubjectToAdd] = useState<number | null>(null);
    const [logForm, setLogForm] = useState({ title: '', description: '' });
    const [submittingLog, setSubmittingLog] = useState(false);
    const [logError, setLogError] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [addingDiscountState, setAddingDiscountState] = useState(false);
    const [billingData, setBillingData] = useState<any>(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [selectedPaymentForInvoice, setSelectedPaymentForInvoice] = useState<any>(null);
    const [paymentMode, setPaymentMode] = useState<string>('UPI');
    const [transactionId, setTransactionId] = useState<string>('');
    const [denomination, setDenomination] = useState<string>('');
    const [posReceiptFile, setPosReceiptFile] = useState<File | null>(null);
    const [paymentHistoryRefreshTrigger, setPaymentHistoryRefreshTrigger] = useState(0);
    const [modalMessage, setModalMessage] = useState<{ type: 'success' | 'error'; message: string; onClose?: () => void } | null>(null);

    const role = localStorage.getItem('userRole');
    const isCounsellor = role === 'COUNSELLOR';
    const isAccounts = role === 'ACCOUNTS';
    const isDemoCandidate = enquiry?.candidateStatus === 'demo';
    const canMoveCandidate = enquiry?.candidateStatus === 'demo' || enquiry?.candidateStatus === 'qualified demo';
    const statusOptions = isCounsellor
        ? enquiry?.candidateStatus === 'enquiry stage'
            ? ['demo']
            : ['enquiry stage', 'demo']
        : isAccounts && isDemoCandidate
            ? ['enquiry stage', 'demo']
            : ['enquiry stage', 'demo', 'qualified demo', 'class', 'class qualified'];

    const mapOtherValue = (value: string | undefined, options: string[]) => ({
        selected: value && options.includes(value) ? value : value ? 'Other' : '',
        other: value && !options.includes(value) ? value : '',
    });

    useEffect(() => {
        if (enquiry && packages.length > 0) {
            const pkg = packages.find(p => p.id === enquiry.packageId);
            const pkgSubjects = pkg ? (((pkg as any).subjects as Subject[] | undefined) ?? (pkg as any).Subjects) : [];
            const pkgSubjectIds = pkgSubjects?.map((s: any) => s.id) ?? [];
            setManuallyAddedSubjectIds((enquiry.subjectIds || []).filter(id => !pkgSubjectIds.includes(id)));
        }
    }, [enquiry, packages]);

    useEffect(() => {
        if (isDemoCandidate && isEditingDetails) {
            setIsEditingDetails(false);
        }
    }, [isDemoCandidate, isEditingDetails]);

    useEffect(() => {
        if (selectedStatus && !statusOptions.includes(selectedStatus)) {
            setSelectedStatus('');
        }
    }, [statusOptions, selectedStatus]);

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
        if (feesByPackage[packageId] !== undefined && feesByPackage[packageId] !== '') return Number(feesByPackage[packageId]);

        // Fallback to targetedFees if not explicitly set in state yet
        const pkgName = getPackageName(packageId);
        if (enquiry?.targetedFees && pkgName in enquiry.targetedFees) {
            return Number(enquiry.targetedFees[pkgName]);
        }
        return 0;
    };

    const getSubjectFee = (subjectId: number) => {
        if (feesBySubject[subjectId] !== undefined && feesBySubject[subjectId] !== '') return Number(feesBySubject[subjectId]);

        // Fallback to targetedFees if not explicitly set in state yet
        const subjectName = subjects.find(s => s.id === subjectId)?.name;
        if (subjectName && enquiry?.targetedFees && subjectName in enquiry.targetedFees) {
            return Number(enquiry.targetedFees[subjectName]);
        }
        return 0;
    };

    const getPackageName = (packageId: number | null | undefined) => {
        if (packageId === null) return 'Others';
        if (packageId === undefined) return '-';
        const pkg = packages.find(p => p.id === packageId);
        return pkg ? pkg.name : `Package ${packageId}`;
    };

    const getPackageSubjectIds = (packageId: number | null) => {
        if (!packageId) return [];
        const pkg = packages.find(p => p.id === packageId);
        const pkgSubjects = (pkg as any)?.subjects ?? (pkg as any)?.Subjects ?? [];
        return (pkgSubjects as { id: number }[]).map(s => s.id);
    };

    const getManualSubjectIds = (packageId: number | null | undefined, subjectIds: number[] = []) => {
        const packageSubjectIds = getPackageSubjectIds(packageId ?? null);
        return subjectIds.filter(id => !packageSubjectIds.includes(id));
    };

    const buildTargetedFees = (packageId: number | null, subjectIds: number[]) => {
        const fees: Record<string, number> = {};

        // 1. Add package fee if present
        if (packageId) {
            const pkgName = getPackageName(packageId);
            fees[pkgName] = getSelectedPackageFee(packageId);
        }

        // 2. Identify subjects that are NOT part of the package (extra subjects)
        const packageSubjectIds = getPackageSubjectIds(packageId);
        const extraSubjectIds = subjectIds.filter(id => !packageSubjectIds.includes(id));

        // 3. Add individual extra subject fees
        extraSubjectIds.forEach(subjectId => {
            const subjectName = subjects.find(subject => subject.id === subjectId)?.name || `Subject ${subjectId}`;
            fees[subjectName] = getSubjectFee(subjectId);
        });

        return fees;
    };

    const getPackageSaveMessage = (packageId: number | null) => {
        if (!packageId) return 'Fees updated successfully';
        if (!enquiry?.packageId) return 'Package added successfully';
        if (enquiry.packageId !== packageId) return 'Package updated successfully';
        return 'Fees updated successfully';
    };

    const savePackageSubjectUpdate = async (
        packageId: number | null,
        subjectIds: number[],
        successMessage: string = getPackageSaveMessage(packageId)
    ): Promise<boolean> => {
        if (!enquiry) return false;

        setUpdateError(null);
        setSavingFees(true);

        // Compute total fee for billing
        let totalFee = packageId ? getSelectedPackageFee(packageId) : 0;

        const packageSubjectIds = getPackageSubjectIds(packageId);
        const extraSubjectIds = subjectIds.filter(id => !packageSubjectIds.includes(id));
        totalFee += extraSubjectIds.reduce((sum, id) => sum + getSubjectFee(id), 0);

        try {
            const builtFees = buildTargetedFees(packageId, subjectIds);

            // 1. Save enquiry
            const response = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                method: 'PUT',
                body: {
                    packageId: packageId ?? null,
                    subjectIds,
                    targetedFees: builtFees,
                },
            });

            setEnquiry(prev => prev ? ({ ...prev, ...(response || {}), packageId: packageId ?? null, subjectIds, targetedFees: builtFees }) : prev);

            // 2. Create or update billing record
            try {
                // API expects packageType to be either 'package' or 'individual'
                const packageType = packageId ? 'package' : 'individual';
                const subjectIdsForBilling = subjectIds.length > 0 ? subjectIds : null;

                if (billingData?.id) {
                    // Update existing billing — keep amountPaid/balance, refresh packageCost and fee breakdown
                    const existingPaid = parseFloat(billingData.amountPaid) || 0;
                    const newBalance = Math.max(0, totalFee - existingPaid);
                    await apiRequest<any>(`/api/billings/${billingData.id}`, {
                        method: 'PUT',
                        body: {
                            enquiryId: enquiry.id,
                            packageCost: totalFee,
                            discount: billingData.discount ?? 0,
                            gst: billingData.gst ?? 0,
                            gstAmount: billingData.gstAmount ?? 0,
                            amountPaid: existingPaid,
                            balance: newBalance,
                            packageType,
                            subjectIds: subjectIdsForBilling,
                            subjectWiseBreakdown: builtFees,
                        },
                    });
                } else {
                    // Create new billing record
                    await apiRequest<any>('/api/billings', {
                        method: 'POST',
                        body: {
                            enquiryId: enquiry.id,
                            packageCost: totalFee,
                            discount: 0,
                            gst: 0,
                            gstAmount: 0,
                            amountPaid: 0,
                            balance: totalFee,
                            packageType,
                            subjectIds: subjectIdsForBilling,
                            subjectWiseBreakdown: builtFees,
                        },
                    });
                }

                // Fetch fresh billing data to guarantee UI is in sync
                const freshBilling = await apiRequest<any>(`/api/billings/enquiry/${enquiry.id}`, { method: 'GET' });
                setBillingData(freshBilling);
            } catch (billingErr) {
                console.error('Billing save failed:', billingErr);
                // Don't block the main success — fee data is saved on the enquiry
            }

            setModalMessage({ type: 'success', message: successMessage });
            return true;
        } catch (err) {
            console.error('Failed to update package/subject selection:', err);
            if (err instanceof Error) {
                setModalMessage({ type: 'error', message: err.message || 'Failed to update package and subject selection.' });
            } else {
                setModalMessage({ type: 'error', message: 'Failed to update package and subject selection.' });
            }
            return false;
        } finally {
            setSavingFees(false);
        }
    };

    const handleAddSubject = () => {
        if (!newSubjectToAdd) return;
        if (detailsForm.subjectIds?.includes(newSubjectToAdd)) return;

        const updatedSubjectIds = [...(detailsForm.subjectIds || []), newSubjectToAdd];
        
        setHasUnsavedFeesDraft(true);
        setManuallyAddedSubjectIds(prev => [...prev, newSubjectToAdd]);
        
        setDetailsForm(prev => ({
            ...prev,
            subjectIds: updatedSubjectIds,
        }));
        setFeesBySubject(prev => ({ ...prev, [newSubjectToAdd]: '' }));
        setNewSubjectToAdd(null);
    };

    const handleRemoveSubject = (subjectId: number) => {
        const updatedSubjectIds = (detailsForm.subjectIds || []).filter(id => id !== subjectId);
        
        setHasUnsavedFeesDraft(true);
        setManuallyAddedSubjectIds(prev => prev.filter(id => id !== subjectId));

        setDetailsForm(prev => ({
            ...prev,
            subjectIds: updatedSubjectIds,
        }));
        setFeesBySubject(prev => {
            const next = { ...prev };
            delete next[subjectId];
            return next;
        });
    };

    const availableAdditionalSubjects = subjects.filter(subject => {
        const alreadyAdded = (detailsForm.subjectIds || []).includes(subject.id);
        const includedInPackage = getPackageSubjectIds(detailsForm.packageId ?? null).includes(subject.id);
        return !alreadyAdded && !includedInPackage;
    });

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

    const getTargetedFeesTotal = (enquiry: Enquiry) => {
        if (!enquiry.targetedFees) return 0;
        return Object.values(enquiry.targetedFees).reduce((sum, fee) => sum + Number(fee), 0);
    };

    const calculatePaymentDetails = (enquiry: Enquiry) => {
        let packageCost = 0;
        if (isAccounts && enquiry.targetedFees && Object.keys(enquiry.targetedFees).length > 0) {
            packageCost = getTargetedFeesTotal(enquiry);
        } else if (enquiry.packageId) {
            packageCost = getSelectedPackageFee(enquiry.packageId) || getPackageCost(enquiry.packageId);
        } else {
            // For "others", sum the entered fees for selected subjects
            packageCost = enquiry.subjectIds.reduce((sum, subjectId) => {
                return sum + getSubjectFee(subjectId);
            }, 0);
        }
        const discount = discountAmount > 0 ? discountAmount : (billingData ? (Number(billingData.discount) || 0) : 0);
        const discountedAmount = packageCost - discount;
        const gstRate = billingData ? (Number(billingData.gst) || 18) : 18;
        const totalCost = discountedAmount;
        const gstAmount = totalCost - (totalCost / (1 + gstRate / 100));
        const baseCost = totalCost / (1 + gstRate / 100);
        const paidAmount = billingData ? parseFloat(billingData.amountPaid) || 0 : (enquiry.billing ? parseFloat(enquiry.billing.amountPaid) || 0 : 0);
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

        if (paymentMode === 'CASH' && denomination) {
            let totalDenomination = 0;
            const parts = denomination.split(/[,;+&]/);
            
            for (let part of parts) {
                part = part.trim();
                if (!part) continue;
                
                const match = part.match(/^(\d+)\s*[xX*]\s*(\d+)$/);
                if (match) {
                    const value = parseInt(match[1], 10);
                    const count = parseInt(match[2], 10);
                    totalDenomination += (value * count);
                } else {
                    alert(`Invalid denomination format: "${part}". Please use format like "500x2" or "100*6"`);
                    return;
                }
            }

            if (totalDenomination !== paymentAmount) {
                alert(`Denomination total (₹${totalDenomination}) does not match the payment amount (₹${paymentAmount}).`);
                return;
            }
        }



        setProcessingPayment(true);
        try {
            let uploadedPosUrl = null;
            if (paymentMode === 'CARD' && posReceiptFile) {
                const formData = new FormData();
                formData.append('posReceipt', posReceiptFile);
                try {
                    const uploadResp = await apiRequest('/api/billings/upload-receipt', {
                        method: 'POST',
                        body: formData,
                        isFormData: true
                    });
                    if (uploadResp.success) {
                        uploadedPosUrl = uploadResp.url;
                    } else {
                        throw new Error(uploadResp.message || 'Failed to upload receipt');
                    }
                } catch (uploadError) {
                    alert('Error uploading POS receipt: ' + (uploadError instanceof Error ? uploadError.message : 'Unknown error'));
                    setProcessingPayment(false);
                    return;
                }
            }

            let billingPayload: object;

            if (billingData?.id) {
                // ── UPDATE PATH ──────────────────────────────────────────────
                // Add new payment to existing amountPaid
                const previouslyPaid = parseFloat(billingData.amountPaid) || 0;

                console.log('previous paid = ', previouslyPaid)
                console.log('now paid = ', paymentAmount)
                const newAmountPaid = previouslyPaid + paymentAmount;

                // Reduce balance by entered amount (use stored balance, not recalculated)
                const existingBalance = parseFloat(billingData.balance) || 0;
                const newBalance = Math.max(0, Math.round((existingBalance - paymentAmount) * 100) / 100);

                // Use the latest calculated discount/gst values (from UI) rather than stale billingData
                const currentPaymentCalc = calculatePaymentDetails(enquiry);
                billingPayload = {
                    enquiryId: enquiry.id,
                    packageCost: billingData.packageCost,   // keep original package cost
                    discount: currentPaymentCalc.discount,
                    gst: currentPaymentCalc.gstRate,
                    gstAmount: currentPaymentCalc.gstAmount,
                    amountPaid: newAmountPaid,
                    balance: newBalance,
                    paymentMode: paymentMode,
                    transaction_id: (paymentMode === 'UPI' || paymentMode === 'CARD') ? transactionId : null,
                    denomination: paymentMode === 'CASH' ? denomination : null,
                    posReceiptUrl: paymentMode === 'CARD' ? uploadedPosUrl : null,
                };

                await apiRequest(`/api/billings/${billingData.id}`, {
                    method: 'PUT',
                    body: billingPayload,
                });

            } else {
                // ── CREATE PATH ──────────────────────────────────────────────
                // Fresh calculation from paymentDetails
                const newBalance = Math.max(
                    0,
                    Math.round((paymentDetails.totalCost - paymentAmount) * 100) / 100
                );

                billingPayload = {
                    enquiryId: enquiry.id,
                    packageCost: paymentDetails.packageCost,
                    discount: paymentDetails.discount,
                    gst: paymentDetails.gstRate,
                    gstAmount: paymentDetails.gstAmount,
                    amountPaid: paymentAmount,
                    balance: newBalance,
                    paymentMode: paymentMode,
                    transaction_id: (paymentMode === 'UPI' || paymentMode === 'CARD') ? transactionId : null,
                    denomination: paymentMode === 'CASH' ? denomination : null,
                    posReceiptUrl: paymentMode === 'CARD' ? uploadedPosUrl : null,
                };

                await apiRequest('/api/billings', {
                    method: 'POST',
                    body: billingPayload,
                });
            }

            // Move to class if currently in demo
            if (enquiry.candidateStatus === 'demo') {
                try {
                    await apiRequest<Enquiry>(`/api/enquiries/change-status`, {
                        method: 'POST',
                        body: { enquiryId: enquiry.id, newStatus: 'class' },
                    });
                } catch (statusErr) {
                    console.warn('Status change endpoint failed, falling back', statusErr);
                    await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                        method: 'PUT',
                        body: { candidateStatus: 'class' },
                    });
                }
            }

            // Refresh enquiry
            const updatedEnquiry = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, { method: 'GET' });
            setEnquiry(updatedEnquiry);

            // Refresh billing
            try {
                const updatedBillingData = await apiRequest<any>(`/api/billings/enquiry/${enquiry.id}`, { method: 'GET' });
                setBillingData(updatedBillingData);
                // Post the payment entry to payment-history endpoint
                try {
                    let billingId: any = updatedBillingData?.id || billingData?.id;
                    // If the billing endpoint returned an array, pick the first item's id
                    if (!billingId && Array.isArray(updatedBillingData) && updatedBillingData.length > 0) {
                        billingId = updatedBillingData[0]?.id;
                    }

                    const payload = {
                        amountPaid: paymentAmount,
                        paymentMode: paymentMode,
                        transaction_id: (paymentMode === 'UPI' || paymentMode === 'CARD') ? transactionId : null,
                        denomination: paymentMode === 'CASH' ? denomination : null,
                        posReceiptUrl: paymentMode === 'CARD' ? uploadedPosUrl : null,
                    };

                    if (billingId) {
                        await apiRequest(`/api/billings/${billingId}/payment-history`, {
                            method: 'POST',
                            body: payload,
                        });
                    }
                } catch (phErr) {
                    console.warn('Failed to post payment history:', phErr);
                }
            } catch (err) {
                console.error('Failed to refresh billing data:', err);
            }

            setPaymentAmount(0);
            setTransactionId('');
            setDenomination('');
            setPosReceiptFile(null);
            const previouslyPaid = billingData ? parseFloat(billingData.amountPaid) || 0 : 0;
            const newTotalPaid = previouslyPaid + paymentAmount;
            const message = enquiry.candidateStatus === 'demo'
                ? `Payment of ₹${paymentAmount} processed! Total paid: ₹${newTotalPaid}. Candidate moved to Class List.`
                : `Payment of ₹${paymentAmount} processed! Total paid: ₹${newTotalPaid}.`;
            setModalMessage({ type: 'success', message });
            
            // Trigger payment history refresh
            setPaymentHistoryRefreshTrigger(prev => prev + 1);

        } catch (err) {
            console.error('Payment processing failed:', err);
            setModalMessage({
                type: 'error',
                message: err instanceof Error
                    ? err.message || 'Failed to process payment. Please try again.'
                    : 'Failed to process payment. Please try again.'
            });
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleAddDiscount = async () => {
        if (!enquiry || !discountAmount || discountAmount <= 0) return;
        setAddingDiscountState(true);
        try {
            const paymentDetails = calculatePaymentDetails(enquiry);
            let billingPayload: any;

            if (billingData?.id) {
                const existingPaid = parseFloat(billingData.amountPaid) || 0;
                const newBalance = Math.max(0, Math.round((paymentDetails.totalCost - existingPaid) * 100) / 100);

                billingPayload = {
                    enquiryId: enquiry.id,
                    packageCost: billingData.packageCost,
                    discount: paymentDetails.discount,
                    gst: paymentDetails.gstRate,
                    gstAmount: paymentDetails.gstAmount,
                    amountPaid: existingPaid,
                    balance: newBalance,
                    paymentMode: billingData.paymentMode || 'UPI',
                    transaction_id: billingData.transaction_id || null,
                    denomination: billingData.denomination || null,
                };

                await apiRequest(`/api/billings/${billingData.id}`, {
                    method: 'PUT',
                    body: billingPayload,
                });
            } else {
                const newBalance = Math.max(0, Math.round((paymentDetails.totalCost) * 100) / 100);
                billingPayload = {
                    enquiryId: enquiry.id,
                    packageCost: paymentDetails.packageCost,
                    discount: paymentDetails.discount,
                    gst: paymentDetails.gstRate,
                    gstAmount: paymentDetails.gstAmount,
                    amountPaid: 0,
                    balance: newBalance,
                    paymentMode: 'UPI',
                    transaction_id: null,
                    denomination: null,
                };

                await apiRequest('/api/billings', {
                    method: 'POST',
                    body: billingPayload,
                });
            }

            const updatedEnquiry = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, { method: 'GET' });
            if (updatedEnquiry) {
                setEnquiry(updatedEnquiry);
                if (updatedEnquiry.billing) {
                    setBillingData(updatedEnquiry.billing);
                }
            }
            
            setModalMessage({ type: 'success', message: 'Discount added successfully', onClose: () => setModalMessage(null) });
            setDiscountAmount(0);
        } catch (err: any) {
            console.error('Error adding discount:', err);
            setModalMessage({ type: 'error', message: err.message || 'Failed to add discount', onClose: () => setModalMessage(null) });
        } finally {
            setAddingDiscountState(false);
        }
    };

    useEffect(() => {
        if (enquiry) {
            const referralValue = SOURCES.includes(enquiry.referral) ? enquiry.referral : 'Other';
            const professionValue = mapOtherValue(enquiry.profession, PROF_SITUATIONS);
            const qualificationValue = mapOtherValue(enquiry.qualification, QUALIFICATIONS);
            setSelectedStatus('');
            // Clean phone and name data on initial load
            const cleanedName = (enquiry.name || '').replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
            const cleanedPhone = (enquiry.phone || '').replace(/\D/g, '').slice(0, 10);
            setDetailsForm({
                name: cleanedName,
                email: enquiry.email,
                phone: cleanedPhone,
                current_location: enquiry.current_location,
                collegeName: enquiry.collegeName,
                profession: professionValue.selected,
                professionOther: professionValue.other,
                referral: referralValue,
                sourceOther: referralValue === 'Other' ? enquiry.referral : '',
                consent: enquiry.consent,
                trainingMode: enquiry.trainingMode,
                trainingTime: enquiry.trainingTime,
                startTime: enquiry.startTime,
                qualification: qualificationValue.selected,
                qualificationOther: qualificationValue.other,
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
            if (fee !== undefined && fee !== 0) acc[subjectId] = fee.toString();
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

        // Validate required fields
        if (!detailsForm.name?.trim()) {
            setUpdateError('Mandatory fields are missing');
            return;
        }
        if (!detailsForm.email?.trim()) {
            setUpdateError('Mandatory fields are missing');
            return;
        }
        if (!detailsForm.phone?.trim()) {
            setUpdateError('Mandatory fields are missing');
            return;
        }
        if (!detailsForm.current_location?.trim()) {
            setUpdateError('Mandatory fields are missing');
            return;
        }
        if (!detailsForm.consent) {
            setUpdateError('Mandatory fields are missing');
            return;
        }
        if (detailsForm.profession === 'Other' && !detailsForm.professionOther?.trim()) {
            setUpdateError('Mandatory fields are missing');
            return;
        }
        if (detailsForm.qualification === 'Other' && !detailsForm.qualificationOther?.trim()) {
            setUpdateError('Mandatory fields are missing');
            return;
        }

        // Validate email format and domain
        const email = detailsForm.email.trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setUpdateError('Invalid email format');
            return;
        }

        const invalidDomains = ['test.com', 'example.com', 'dummy.com', 'fake.com', 'invalid.com', 'email.com', '123.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (invalidDomains.includes(emailDomain)) {
            setUpdateError('Please provide a genuine email address');
            return;
        }

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
            collegeName: detailsForm.collegeName,
            profession: detailsForm.profession === 'Other' ? (detailsForm.professionOther || '').trim() : detailsForm.profession,
            referral: detailsForm.referral === 'Other' ? (detailsForm.sourceOther || 'Other') : detailsForm.referral,
            consent: detailsForm.consent,
            trainingMode: detailsForm.trainingMode,
            trainingTime: detailsForm.trainingTime,
            startTime: detailsForm.startTime,
            qualification: detailsForm.qualification === 'Other' ? (detailsForm.qualificationOther || '').trim() : detailsForm.qualification,
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
            setModalMessage({ type: 'success', message: 'Candidate details updated successfully' });
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
            setSelectedStatus('');
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

    useEffect(() => {
        const fetchBillingData = async () => {
            if (!enquiry) return;
            try {
                const response = await apiRequest<any>(`/api/billings/enquiry/${enquiry.id}`, { method: 'GET' });
                setBillingData(response);
            } catch (err) {
                console.error('Failed to fetch billing data:', err);
                setBillingData(null);
            }
        };

        fetchBillingData();
    }, [enquiry]);

    const getStatusLabel = (status: string) => {
        if (status === 'enquiry stage') return 'Enquiry Stage';
        if (status === 'qualified demo') return 'Demo';
        if (status === 'class') return 'Class';
        if (status === 'class qualified') return 'Placement';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const handleStageUpdate = async () => {
        if (!enquiry || selectedStatus === enquiry.candidateStatus) return;

        setSavingStatus(true);
        const previousStatus = enquiry.candidateStatus;
        setEnquiry(prev => prev ? { ...prev, candidateStatus: selectedStatus } : prev);

        try {
            let updatedEnquiry: Enquiry | undefined;
            try {
                const response = await apiRequest<{ message: string; enquiry: Enquiry }>('/api/enquiries/change-status', {
                    method: 'POST',
                    body: {
                        enquiryId: enquiry.id,
                        newStatus: selectedStatus,
                    },
                });
                updatedEnquiry = response?.enquiry;
            } catch (err) {
                console.warn('change-status failed, trying fallback PUT', err);
            }

            // Force PUT fallback if the backend ignored the backward movement or if the first request failed
            if (!updatedEnquiry || updatedEnquiry.candidateStatus !== selectedStatus) {
                updatedEnquiry = await apiRequest<Enquiry>(`/api/enquiries/${enquiry.id}`, {
                    method: 'PUT',
                    body: { candidateStatus: selectedStatus },
                });
            }

            if (updatedEnquiry) {
                setEnquiry(updatedEnquiry);
                const newStatus = updatedEnquiry.candidateStatus || selectedStatus;
                setSelectedStatus(newStatus);
                
                if (isAccounts && newStatus === 'enquiry stage') {
                    setModalMessage({
                        type: 'success',
                        message: `Moved to ${getStatusLabel(newStatus)} successfully`,
                        onClose: () => navigate('/demo-list', { replace: true })
                    });
                } else {
                    setModalMessage({
                        type: 'success',
                        message: `Moved to ${getStatusLabel(newStatus)} successfully`,
                    });
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
                setModalMessage({ type: 'success', message: 'Call log added successfully' });
            }
        } catch (err) {
            console.error('Failed to add log:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to add call log. Please try again.';
            setLogError(errorMessage);
        } finally {
            setSubmittingLog(false);
        }
    };

    const handlePaymentInvoiceView = (payment: any) => {
        // Store the payment and show invoice modal
        setSelectedPaymentForInvoice(payment);
        setShowInvoice(true);
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

    // ── Invoice data (computed before JSX) ──────────────────────────────────
    // For payment history, create a single line item with the paid amount
    const invoiceItems: { name: string; fee: number }[] = selectedPaymentForInvoice
        ? [{ name: 'Training Package Payment', fee: Number(selectedPaymentForInvoice.amountPaid) }]
        : enquiry.targetedFees && Object.keys(enquiry.targetedFees).length > 0
            ? Object.entries(enquiry.targetedFees).map(([name, fee]) => ({ name, fee: Number(fee) }))
            : enquiry.packageId
                ? [{ name: getPackageName(enquiry.packageId), fee: getSelectedPackageFee(enquiry.packageId) || getPackageCost(enquiry.packageId) }]
                : (enquiry.subjectIds || []).map(sid => ({
                    name: subjects.find(s => s.id === sid)?.name || `Subject ${sid}`,
                    fee: getSubjectFee(sid),
                }));

    const invoiceDate = selectedPaymentForInvoice?.createdAt
        ? new Date(selectedPaymentForInvoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : billingData?.createdAt
            ? new Date(billingData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const formatInvoiceNumber = (id: number | string, createdAt?: string | Date) => {
        const invoiceYear = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
        return `NQA-${invoiceYear}${String(id ?? 0).padStart(6, '0')}`;
    };

    const invoiceNumber = selectedPaymentForInvoice
        ? (
            selectedPaymentForInvoice.invoiceNumber
            || selectedPaymentForInvoice.invoiceNo
            || selectedPaymentForInvoice.taxInvoiceNumber
            || formatInvoiceNumber(selectedPaymentForInvoice.id, selectedPaymentForInvoice.createdAt)
        )
        : (
            billingData?.invoiceNumber
            || formatInvoiceNumber(billingData?.id ?? enquiry.id, billingData?.createdAt || enquiry.createdAt)
        );

    // For payment history, use the current transaction's paid amount so GST is distributed on this specific payment
    const currentInvoiceAmount = selectedPaymentForInvoice
        ? Number(selectedPaymentForInvoice.amountPaid)
        : parseFloat(billingData?.amountPaid || '0');

    const currentInvoiceBalance = selectedPaymentForInvoice
        ? Number((selectedPaymentForInvoice.balanceAfterPayment ?? billingData?.balance) || '0')
        : parseFloat(billingData?.balance || '0');

    const currentInvoiceDiscount = parseFloat(billingData?.discount || '0');

    const currentInvoiceTotal = billingData
        ? parseFloat(billingData.packageCost || '0')
        : currentInvoiceAmount;

    const normalizeIds = (ids: number[] = []) => Array.from(new Set(ids)).sort((a, b) => a - b);
    const sameIds = (first: number[] = [], second: number[] = []) => {
        const left = normalizeIds(first);
        const right = normalizeIds(second);
        return left.length === right.length && left.every((id, index) => id === right[index]);
    };
    const sameFeeBreakdown = (first: Record<string, number> = {}, second: Record<string, any> = {}) => {
        const firstKeys = Object.keys(first).sort();
        const secondKeys = Object.keys(second).sort();
        return firstKeys.length === secondKeys.length && firstKeys.every((key, index) => (
            key === secondKeys[index] && Number(first[key] || 0) === Number(second[key] || 0)
        ));
    };
    const draftedTargetedFees = buildTargetedFees(detailsForm.packageId ?? null, detailsForm.subjectIds || []);
    const hasUnsavedFeesChanges = isEditingFees && (
        hasUnsavedFeesDraft ||
        (detailsForm.packageId ?? null) !== (enquiry.packageId ?? null) ||
        !sameIds(detailsForm.subjectIds || [], enquiry.subjectIds || []) ||
        !sameFeeBreakdown(draftedTargetedFees, enquiry.targetedFees || {})
    );
    const savedBillingBreakdown = billingData?.subjectWiseBreakdown && typeof billingData.subjectWiseBreakdown === 'object'
        ? billingData.subjectWiseBreakdown
        : enquiry.targetedFees || {};
    // ────────────────────────────────────────────────────────────────────────

    return (
        <>
            {savingFees && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm transition-all duration-300">
                    <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                        <p className="mt-4 text-sm font-semibold text-slate-800">Reloading...</p>
                    </div>
                </div>
            )}
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
                    <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-800">
                        Status: <span className="font-semibold text-slate-900">{enquiry.candidateStatus}</span>
                    </div>
                    <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-800">
                        Role: <span className="font-semibold text-slate-900">{role || 'USER'}</span>
                    </div>
                </div>

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
                                        {isDemoCandidate
                                            ? 'Read-only details for demo candidates.'
                                            : isAccounts
                                                ? 'Accounts role has view-only access.'
                                                : isClassListOrigin
                                                    ? 'Editing is disabled when viewing from the Class List.'
                                                    : 'Fields marked with * are mandatory and editable.'}
                                    </div>
                                    {!isDemoCandidate && !isAccounts && !isEditingDetails && !isClassListOrigin && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditingDetails(true);
                                                setUpdateError(null); // Clear any previous update errors when starting to edit
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
                                        <label className="block text-xs font-semibold text-slate-500 uppercase">Name <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={detailsForm.name || ''}
                                            disabled={!isEditingDetails}
                                            onChange={handleNameChange}
                                            maxLength={25}
                                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                            placeholder="Enter full name (alphabets and spaces only)"
                                        />

                                        <label className="block text-xs font-semibold text-slate-500 uppercase">Email <span className="text-rose-500">*</span></label>
                                        <input
                                            type="email"
                                            value={detailsForm.email || ''}
                                            disabled={!isEditingDetails}
                                            onChange={(e) => setDetailsForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                        />

                                        <label className="block text-xs font-semibold text-slate-500 uppercase">Phone <span className="text-rose-500">*</span></label>
                                        <input
                                            type="tel"
                                            value={detailsForm.phone || ''}
                                            disabled={!isEditingDetails}
                                            onChange={handlePhoneChange}
                                            inputMode="numeric"
                                            maxLength={10}
                                            className={`w-full rounded-3xl border bg-white px-4 py-3 text-sm text-slate-900 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 ${detailsForm.phone && validatePhoneNumber(detailsForm.phone)
                                                ? 'border-rose-500 focus:border-rose-500'
                                                : 'border-slate-200 focus:border-indigo-500'
                                                }`}
                                            placeholder="Enter 10-digit phone number"
                                        />
                                        {detailsForm.phone && validatePhoneNumber(detailsForm.phone) && (
                                            <p className="text-xs text-rose-600 mt-1">{validatePhoneNumber(detailsForm.phone)}</p>
                                        )}

                                        <label className="block text-xs font-semibold text-slate-500 uppercase">Location <span className="text-rose-500">*</span></label>
                                        <input
                                            type="text"
                                            value={detailsForm.current_location || ''}
                                            disabled={!isEditingDetails}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^[a-zA-Z\s]+$/.test(val)) {
                                                    setDetailsForm(prev => ({ ...prev, current_location: val }));
                                                }
                                            }}
                                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                        />

                                        <label className="block text-xs font-semibold text-slate-500 uppercase">College Name</label>
                                        <input
                                            type="text"
                                            value={detailsForm.collegeName || ''}
                                            disabled={!isEditingDetails}
                                            onChange={(e) => setDetailsForm(prev => ({ ...prev, collegeName: e.target.value }))}
                                            className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                            placeholder="Enter college name"
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
                                                                        const newPkg = packages.find(p => p.id === pkg.id);
                                                                        const newPkgSubjects = newPkg ? (((newPkg as any).subjects as Subject[] | undefined) ?? (newPkg as any).Subjects) : [];
                                                                        const newPkgSubjectIds = newPkgSubjects?.map((s: any) => s.id) ?? [];

                                                                        setDetailsForm(prev => ({
                                                                            ...prev,
                                                                            packageId: pkg.id,
                                                                            subjectIds: Array.from(new Set([...newPkgSubjectIds, ...manuallyAddedSubjectIds])),
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
                                                                onChange={() => setDetailsForm(prev => ({
                                                                    ...prev,
                                                                    packageId: null,
                                                                    subjectIds: Array.from(new Set([...manuallyAddedSubjectIds])),
                                                                }))}
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
                                                        {(() => {
                                                            const pkg = packages.find(p => p.id === detailsForm.packageId);
                                                            const pkgSubjects = pkg ? (((pkg as any).subjects as Subject[] | undefined) ?? (pkg as any).Subjects) : [];
                                                            const packageSubjectIds = pkgSubjects?.map((s: any) => s.id) ?? [];
                                                            
                                                            return subjects.map(subject => {
                                                                const isPackageSubject = packageSubjectIds.includes(subject.id);
                                                                return (
                                                                    <label key={subject.id} className={`flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 transition-all ${isPackageSubject ? 'bg-slate-50 border-indigo-100 opacity-90 cursor-not-allowed' : (isEditingDetails ? 'cursor-pointer hover:border-indigo-200' : 'cursor-default opacity-80')}`}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isPackageSubject || (detailsForm.subjectIds?.includes(subject.id) || false)}
                                                                            disabled={!isEditingDetails || isPackageSubject}
                                                                            onChange={(e) => {
                                                                                const currentIds = detailsForm.subjectIds || [];
                                                                                const newIds = e.target.checked
                                                                                    ? [...currentIds, subject.id]
                                                                                    : currentIds.filter(id => id !== subject.id);
                                                                                
                                                                                setManuallyAddedSubjectIds(prev => {
                                                                                    if (e.target.checked) return [...prev, subject.id];
                                                                                    return prev.filter(id => id !== subject.id);
                                                                                });
                                                                                
                                                                                setDetailsForm(prev => ({ ...prev, subjectIds: newIds }));
                                                                            }}
                                                                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 disabled:opacity-70"
                                                                        />
                                                                        <span className="text-sm text-slate-700 flex flex-col">
                                                                            <span>{subject.name}</span>
                                                                            {isPackageSubject && <span className="text-[10px] text-indigo-600 font-medium leading-tight mt-0.5">Included in package</span>}
                                                                        </span>
                                                                    </label>
                                                                );
                                                            });
                                                        })()}
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
                                            {detailsForm.profession === 'Other' && (
                                                <input
                                                    type="text"
                                                    value={detailsForm.professionOther || ''}
                                                    disabled={!isEditingDetails}
                                                    onChange={(e) => setDetailsForm(prev => ({ ...prev, professionOther: e.target.value }))}
                                                    placeholder="Enter current student professional"
                                                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                                />
                                            )}
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
                                            {detailsForm.qualification === 'Other' && (
                                                <input
                                                    type="text"
                                                    value={detailsForm.qualificationOther || ''}
                                                    disabled={!isEditingDetails}
                                                    onChange={(e) => setDetailsForm(prev => ({ ...prev, qualificationOther: e.target.value }))}
                                                    placeholder="Enter highest qualification"
                                                    className="mt-3 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
                                                />
                                            )}
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
                                                I agree to be contacted via phone, WhatsApp, email, Newsletters regarding NammaQA Training Community program and offers. <span className="text-rose-500 font-semibold">*</span>
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
                                    <div className="flex flex-wrap items-center gap-3 pt-4">
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
                                                if (enquiry) {
                                                    const referralValue = SOURCES.includes(enquiry.referral) ? enquiry.referral : 'Other';
                                                    const professionValue = mapOtherValue(enquiry.profession, PROF_SITUATIONS);
                                                    const qualificationValue = mapOtherValue(enquiry.qualification, QUALIFICATIONS);
                                                    setDetailsForm({
                                                        name: enquiry.name,
                                                        email: enquiry.email,
                                                        phone: enquiry.phone,
                                                        current_location: enquiry.current_location,
                                                        collegeName: enquiry.collegeName,
                                                        profession: professionValue.selected,
                                                        professionOther: professionValue.other,
                                                        referral: referralValue,
                                                        sourceOther: referralValue === 'Other' ? enquiry.referral : '',
                                                        consent: enquiry.consent,
                                                        trainingMode: enquiry.trainingMode,
                                                        trainingTime: enquiry.trainingTime,
                                                        startTime: enquiry.startTime,
                                                        qualification: qualificationValue.selected,
                                                        qualificationOther: qualificationValue.other,
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
                                        {updateError && (
                                            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                                                {updateError}
                                            </div>
                                        )}
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

                    {!isDemoCandidate && enquiry?.candidateStatus !== 'class' && enquiry?.candidateStatus !== 'class qualified' && (
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
                                                    <option value="" disabled>Select Option</option>
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
                                                    disabled={savingStatus || selectedStatus === '' || selectedStatus === enquiry?.candidateStatus}
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
                                    {!isEditingFees && (
                                        <div className="flex justify-end pt-4 mb-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingFees(true);
                                                    setHasUnsavedFeesDraft(false);
                                                }}
                                                className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                            >
                                                Edit Fees
                                            </button>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                                                <div className="flex-1">
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-2">Package</p>
                                                    <div className="flex gap-3 items-end">
                                                        <select
                                                            value={detailsForm.packageId || ''}
                                                            disabled={!isEditingFees}
                                                            onChange={(e) => {
                                                                const newPackageId = e.target.value ? Number(e.target.value) : null;
                                                                setHasUnsavedFeesDraft(true);
                                                                
                                                                const newPkg = packages.find(p => p.id === newPackageId);
                                                                const newPkgSubjects = newPkg ? (((newPkg as any).subjects as Subject[] | undefined) ?? (newPkg as any).Subjects) : [];
                                                                const newPkgSubjectIds = newPkgSubjects?.map((s: any) => s.id) ?? [];
                                                                
                                                                setDetailsForm(prev => ({
                                                                    ...prev,
                                                                    packageId: newPackageId,
                                                                    subjectIds: Array.from(new Set([...newPkgSubjectIds, ...manuallyAddedSubjectIds])),
                                                                }));
                                                            }}
                                                            className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:opacity-70"
                                                        >
                                                            <option value="">Select a Package</option>
                                                            {packages.map(pkg => (
                                                                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                {detailsForm.packageId && (
                                                    <div className="flex-1 min-w-[160px]">
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Fee (₹)</label>
                                                        {(() => {
                                                            const pkgName = getPackageName(detailsForm.packageId);
                                                            const savedFee = enquiry?.targetedFees && pkgName in enquiry.targetedFees ? enquiry.targetedFees[pkgName] : undefined;

                                                            const inputValue = detailsForm.packageId
                                                                ? (feesByPackage[detailsForm.packageId] !== undefined
                                                                    ? feesByPackage[detailsForm.packageId]
                                                                    : (savedFee !== undefined && savedFee !== 0 ? String(savedFee) : ''))
                                                                : '';

                                                            if (savedFee !== undefined && savedFee > 0 && !isEditingFees) {
                                                                return (
                                                                    <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-3xl text-sm h-[46px]">
                                                                        <span className="font-bold text-indigo-700">₹{savedFee}</span>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <input
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    value={inputValue}
                                                                    disabled={!isEditingFees}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value;
                                                                        const cleaned = raw.replace(/[^0-9.]/g, '');
                                                                        if (detailsForm.packageId) {
                                                                            setHasUnsavedFeesDraft(true);
                                                                            setFeesByPackage(prev => ({ ...prev, [detailsForm.packageId as number]: cleaned }));
                                                                        }
                                                                    }}
                                                                    className={`no-spinner w-full rounded-3xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${!isEditingFees ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-900'}`}
                                                                    placeholder="Enter package fee"
                                                                />
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subject section — shown for all cases */}
                                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                                            <div className="mb-4">
                                                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Additional Subjects</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {detailsForm.packageId ? 'Add extra subjects on top of the package' : 'Assigned Subjects'}
                                                </p>
                                            </div>

                                            {/* Add subject row — always visible */}
                                            <div className="grid gap-3 sm:grid-cols-[1fr_150px] items-end mb-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Add Subject</label>
                                                    <select
                                                        value={newSubjectToAdd ?? ''}
                                                        disabled={!isEditingFees}
                                                        onChange={(e) => setNewSubjectToAdd(Number(e.target.value) || null)}
                                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:opacity-70"
                                                    >
                                                        <option value="">Select subject</option>
                                                        {availableAdditionalSubjects.map(subject => (
                                                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {isEditingFees && (
                                                    <button
                                                        type="button"
                                                        onClick={handleAddSubject}
                                                        disabled={!newSubjectToAdd}
                                                        className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors"
                                                    >
                                                        Add Subject
                                                    </button>
                                                )}
                                            </div>

                                            {/* Existing targeted fees — when package present, show only the package fee entry */}
                                            {enquiry?.targetedFees && Object.keys(enquiry.targetedFees).length > 0 && (() => {
                                                const pkgName = detailsForm.packageId
                                                    ? packages.find(p => p.id === detailsForm.packageId)?.name
                                                    : null;
                                                const entriesToShow = detailsForm.packageId
                                                    ? Object.entries(enquiry.targetedFees).filter(([name]) =>
                                                        pkgName ? name === pkgName : true
                                                    )
                                                    : Object.entries(enquiry.targetedFees);
                                                if (entriesToShow.length === 0) return null;
                                                return (
                                                    <div className="rounded-3xl border border-slate-200 bg-white p-4 mb-4">
                                                        <p className="text-sm font-semibold text-slate-900 mb-3">Existing targeted fees</p>
                                                        <div className="grid gap-2">
                                                            {entriesToShow.map(([name, fee]) => (
                                                                <div key={name} className="flex justify-between text-sm text-slate-700">
                                                                    <span>{name}</span>
                                                                    <span>₹{fee}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}   


                                            {/* Subject fee rows — when package present, only show subjects NOT in the package */}
                                            {(() => {
                                                const packageSubjectIds: number[] = detailsForm.packageId
                                                    ? (() => {
                                                        const pkg = packages.find(p => p.id === detailsForm.packageId);
                                                        const pkgSubjects = (pkg as any)?.subjects ?? (pkg as any)?.Subjects ?? [];
                                                        return (pkgSubjects as { id: number }[]).map(s => s.id);
                                                    })()
                                                    : [];
                                                const extraSubjectIds = (detailsForm.subjectIds || []).filter(
                                                    id => !packageSubjectIds.includes(id)
                                                );
                                                if (!extraSubjectIds.length && !packageSubjectIds.length) {
                                                    return (
                                                        <div className="text-sm text-slate-600">
                                                            No subjects selected.
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="space-y-3">
                                                        {packageSubjectIds.map(subjectId => (
                                                            <div key={`pkg-sub-${subjectId}`} className="grid gap-3 sm:grid-cols-[1fr_180px] items-center rounded-3xl border border-slate-200 bg-white p-4 opacity-80">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="text-sm font-medium text-slate-800">
                                                                        {subjects.find(subject => subject.id === subjectId)?.name || `Subject ${subjectId}`}
                                                                        <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full whitespace-nowrap">Included</span>
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-xs font-semibold text-slate-500 uppercase">Fee</span>
                                                                    <p className="text-sm font-semibold text-slate-700 mt-1">Included in Package</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {extraSubjectIds.map(subjectId => (
                                                            <div key={subjectId} className="grid gap-3 sm:grid-cols-[1fr_180px] items-center rounded-3xl border border-slate-200 bg-white p-4">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="text-sm font-medium text-slate-800">{subjects.find(subject => subject.id === subjectId)?.name || `Subject ${subjectId}`}</p>
                                                                    {isEditingFees && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveSubject(subjectId)}
                                                                            className="text-rose-600 hover:text-rose-700 text-sm font-medium"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Fee (₹)</label>
                                                                    {(() => {
                                                                        const subjectName = subjects.find(s => s.id === subjectId)?.name;
                                                                        const previouslyAddedFee = subjectName && enquiry?.targetedFees && subjectName in enquiry.targetedFees ? enquiry.targetedFees[subjectName] : undefined;

                                                                        const inputValue = feesBySubject[subjectId] !== undefined 
                                                                            ? feesBySubject[subjectId] 
                                                                            : (previouslyAddedFee !== undefined && previouslyAddedFee !== 0 ? String(previouslyAddedFee) : '');

                                                                        if (previouslyAddedFee !== undefined && previouslyAddedFee > 0 && !isEditingFees) {
                                                                            return (
                                                                                <div className="flex items-center gap-2 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-3xl text-sm h-[46px]">
                                                                                    <span className="font-bold text-indigo-700">₹{previouslyAddedFee}</span>
                                                                                </div>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <input
                                                                                type="text"
                                                                                inputMode="numeric"
                                                                                value={inputValue}
                                                                                disabled={!isEditingFees}
                                                                                onChange={(e) => {
                                                                                    const raw = e.target.value;
                                                                                    const cleaned = raw.replace(/[^0-9.]/g, '');
                                                                                    setHasUnsavedFeesDraft(true);
                                                                                    setFeesBySubject(prev => ({ ...prev, [subjectId]: cleaned }));
                                                                                }}
                                                                                className="no-spinner w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:opacity-70"
                                                                                placeholder="Enter subject fee"
                                                                            />
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Total */}
                                        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-slate-700">
                                            <div className="flex justify-between gap-3 mb-1">
                                                <span className="font-medium text-slate-700">Total entered fees</span>
                                                <span className="font-bold text-indigo-700 text-base">₹{(() => {
                                                    let sum = detailsForm.packageId ? getSelectedPackageFee(detailsForm.packageId) : 0;
                                                    const pkgSubIds = detailsForm.packageId ? (() => {
                                                        const pkg = packages.find(p => p.id === detailsForm.packageId);
                                                        const pkgSubjects = (pkg as any)?.subjects ?? (pkg as any)?.Subjects ?? [];
                                                        return (pkgSubjects as { id: number }[]).map(s => s.id);
                                                    })() : [];
                                                    const extraIds = (detailsForm.subjectIds || []).filter(id => !pkgSubIds.includes(id));
                                                    sum += extraIds.reduce((s, id) => s + getSubjectFee(id), 0);
                                                    return sum;
                                                })().toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">This is the total that will be saved as the billing package cost.</p>
                                        </div>

                                        {isEditingFees && (
                                            <div className="flex flex-wrap gap-3 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        savePackageSubjectUpdate(
                                                            detailsForm.packageId ?? null,
                                                            detailsForm.subjectIds || [],
                                                            'Fees updated successfully'
                                                        ).then(saved => {
                                                            if (saved) {
                                                                setHasUnsavedFeesDraft(false);
                                                                setIsEditingFees(false);
                                                            }
                                                        });
                                                    }}
                                                    disabled={savingFees}
                                                    className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    {savingFees ? 'Saving...' : 'Save fees'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditingFees(false);
                                                        setHasUnsavedFeesDraft(false);
                                                        if (enquiry) {
                                                            setDetailsForm(prev => ({
                                                                ...prev,
                                                                packageId: enquiry.packageId,
                                                                subjectIds: enquiry.subjectIds || [],
                                                            }));
                                                            setManuallyAddedSubjectIds(getManualSubjectIds(enquiry.packageId, enquiry.subjectIds || []));
                                                            // Also reset any fee edits to what is on the server if needed...
                                                            // But targetedFees logic is already handling this somewhat through getSelectedPackageFee.
                                                        }
                                                    }}
                                                    // className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                                                >
                                                    
                                                </button>
                                            </div>
                                        )}

                                        {/* Saved billing summary */}
                                        {hasUnsavedFeesChanges && (
                                            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                                Subject or fee changes are not saved yet. The saved billing summary below is still the previously saved billing and will update only after you click Save fees.
                                            </div>
                                        )}

                                        {billingData && (
                                            <div className="rounded-3xl border border-green-200 bg-green-50 p-4 space-y-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">Saved Billing Summary</p>
                                                {Object.keys(savedBillingBreakdown).length > 0 && (
                                                    <div className="space-y-2 border-b border-green-200 pb-3 mb-3">
                                                        {Object.entries(savedBillingBreakdown).map(([name, fee]) => (
                                                            <div key={name} className="flex justify-between text-sm text-slate-700">
                                                                <span>{name}</span>
                                                                <span className="font-semibold">₹{Number(fee || 0).toFixed(2)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm text-slate-700">
                                                    <span>Package Cost</span>
                                                    <span className="font-semibold">₹{parseFloat(billingData.packageCost || 0).toFixed(2)}</span>
                                                </div>
                                                {parseFloat(billingData.discount || 0) > 0 && (
                                                    <div className="flex justify-between text-sm text-slate-700">
                                                        <span>Discount</span>
                                                        <span className="font-semibold text-rose-600">- ₹{parseFloat(billingData.discount).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm text-slate-700">
                                                    <span>Amount Paid</span>
                                                    <span className="font-semibold text-green-700">₹{parseFloat(billingData.amountPaid || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-t border-green-200 pt-2">
                                                    <span className="font-medium text-slate-700">Balance Due</span>
                                                    <span className="font-bold text-slate-900">₹{parseFloat(billingData.balance || 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {isAccounts && (enquiry?.candidateStatus === 'demo' || enquiry?.candidateStatus === 'class') && (
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
                                            {/* top warning removed — moved closer to payment input */}
                                            {enquiry && ((isAccounts && enquiry.targetedFees && Object.keys(enquiry.targetedFees).length > 0) || calculatePaymentDetails(enquiry).packageCost > 0) ? (
                                                <>
                                                    {isAccounts && enquiry.targetedFees && Object.keys(enquiry.targetedFees).length > 0 ? (
                                                        <div className="space-y-4">
                                                            <div className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">Subject fees</div>
                                                            <div className="space-y-3">
                                                                {Object.entries(enquiry.targetedFees).map(([name, fee]) => (
                                                                    <div key={name} className="flex justify-between items-center text-sm text-slate-700">
                                                                        <span>{name}</span>
                                                                        <span className="font-semibold text-slate-900">₹{fee}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm pt-3 border-t border-slate-200">
                                                                <span className="text-slate-600">Total Package Cost:</span>
                                                                <span className="font-semibold text-slate-900">₹{getTargetedFeesTotal(enquiry)}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-200">
                                                                <span className="text-slate-600">Package Cost:</span>
                                                                <span className="font-semibold text-slate-900">₹{calculatePaymentDetails(enquiry).packageCost}</span>
                                                            </div>

                                                            {/* Discount Section */}
                                                        </>
                                                    )}
                                                    <div className="space-y-3">
                                                        {!(billingData && Number(billingData.discount || 0) > 0) && (
                                                            <div>
                                                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Discount Amount (₹)</label>
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        value={discountAmount || ''}
                                                                        onChange={(e) => {
                                                                            const raw = e.target.value;
                                                                            const cleaned = raw.replace(/[^0-9.]/g, '');
                                                                            setDiscountAmount(cleaned === '' ? 0 : Number(cleaned));
                                                                        }}
                                                                        placeholder="Enter discount amount"
                                                                        className="flex-1 rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddDiscount}
                                                                        disabled={addingDiscountState || discountAmount <= 0}
                                                                        className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-3xl hover:bg-indigo-700 disabled:bg-slate-400 transition-colors whitespace-nowrap"
                                                                    >
                                                                        {addingDiscountState ? 'Adding...' : 'Add Discount'}
                                                                    </button>
                                                                </div>
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
                                                            <span className="font-semibold text-red-600">₹{calculatePaymentDetails(enquiry).gstAmount}</span>
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
                                                    <div className="pt-4 space-y-4">
                                                        <div className="space-y-3">
                                                            <label className="block text-sm font-medium text-slate-700">
                                                                Mode of Payment:
                                                            </label>
                                                            <div className="flex gap-4">
                                                                {['UPI', 'CARD', 'CASH'].map((mode) => (
                                                                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="radio"
                                                                            name="paymentMode"
                                                                            value={mode}
                                                                            checked={paymentMode === mode}
                                                                            onChange={(e) => setPaymentMode(e.target.value)}
                                                                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                                        />
                                                                        <span className="text-sm text-slate-700">{mode === 'CARD' ? 'Card' : mode === 'CASH' ? 'Cash' : 'UPI'}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {(paymentMode === 'UPI' || paymentMode === 'CARD') && (
                                                            <div className="space-y-2">
                                                                <label className="block text-sm font-medium text-slate-700">
                                                                    Transaction ID:
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={transactionId}
                                                                    onChange={(e) => setTransactionId(e.target.value)}
                                                                    placeholder={paymentMode === 'UPI' ? "Enter UPI Transaction ID" : "Enter Card Transaction ID"}
                                                                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                />
                                                            </div>
                                                        )}

                                                        {paymentMode === 'CASH' && (
                                                            <div className="space-y-2">
                                                                <label className="block text-sm font-medium text-slate-700">
                                                                    Denomination <span className="text-rose-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={denomination}
                                                                    onChange={(e) => setDenomination(e.target.value)}
                                                                    placeholder="e.g. 500x2, 200x5"
                                                                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                />
                                                            </div>
                                                        )}



                                                        <div className="space-y-2">
                                                            <label className="block text-sm font-medium text-slate-700">
                                                                Payment Amount (₹1 - ₹{calculatePaymentDetails(enquiry).balance}):
                                                            </label>
                                                            <div className="flex gap-3">
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    value={paymentAmount || ''}
                                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                        const raw = e.target.value;
                                                                        const cleaned = raw.replace(/[^0-9.]/g, '');
                                                                        setPaymentAmount(cleaned === '' ? 0 : Number(cleaned));
                                                                    }}
                                                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                                                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                                                                        const paste = e.clipboardData.getData('text');
                                                                        if (!/^[0-9.]+$/.test(paste)) e.preventDefault();
                                                                    }}
                                                                    placeholder="Enter payment amount"
                                                                    className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                />
                                                                <button
                                                                    onClick={handlePayment}
                                                                    disabled={processingPayment || paymentAmount < 1 || paymentAmount > calculatePaymentDetails(enquiry).balance || ((paymentMode === 'UPI' || paymentMode === 'CARD') && !transactionId.trim()) || (paymentMode === 'CASH' && !denomination.trim())}
                                                                    className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-3xl hover:bg-indigo-700 disabled:bg-slate-400 transition-colors"
                                                                >
                                                                    {processingPayment ? 'Processing...' : enquiry?.candidateStatus === 'class' ? 'Submit Payment' : 'Pay & Move to Class'}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-rose-600">
                                                                {enquiry?.candidateStatus === 'class' ? 'Payment will be recorded for this candidate.' : 'Payment will automatically move the candidate to Class List.'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Download Invoice button */}
                                                    {billingData && (
                                                        (() => {
                                                            const paid = Number(billingData.amountPaid || 0);
                                                            const disabled = paid <= 0;
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { if (!disabled) setShowInvoice(true); }}
                                                                    disabled={disabled}
                                                                    className={
                                                                        `inline-flex items-center gap-2 rounded-3xl border px-5 py-2.5 text-sm font-semibold transition-colors ` +
                                                                        (disabled
                                                                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                                            : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100')
                                                                    }
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                    </svg>
                                                            Preview and Consolidated Tax Invoice
                                                                </button>
                                                            );
                                                        })()
                                                    )}
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

                    {/* Payment History Accordion - Separate Section for ACCOUNTS role */}
                    {isAccounts && billingData && (
                        <PaymentHistoryAccordion 
                            billingId={billingData.id}
                            onInvoiceView={handlePaymentInvoiceView}
                            refreshTrigger={paymentHistoryRefreshTrigger}
                        />
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
                                                <option value="" disabled>Select Option</option>
                                                {statusOptions.map(status => (
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
                                                disabled={savingStatus || selectedStatus === '' || selectedStatus === enquiry?.candidateStatus}
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

            {showInvoice && (
                <InvoiceModal
                    isOpen={showInvoice}
                    onClose={() => {
                        setShowInvoice(false);
                        setSelectedPaymentForInvoice(null);
                    }}
                    candidateName={enquiry.name}
                    candidateEmail={enquiry.email}
                    candidatePhone={enquiry.phone}
                    candidateLocation={enquiry.current_location}
                    invoiceNumber={invoiceNumber}
                    invoiceDate={invoiceDate}
                    showInvoiceNumber={Boolean(selectedPaymentForInvoice)}
                    items={invoiceItems}
                    discount={currentInvoiceDiscount}
                    amountPaid={currentInvoiceAmount}
                    balance={currentInvoiceBalance}
                    totalAmount={currentInvoiceTotal}
                />
            )}

            {/* Message Modal */}
            {modalMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                        modalMessage.type === 'success'
                            ? 'bg-gradient-to-br from-green-50 to-green-100'
                            : 'bg-gradient-to-br from-red-50 to-red-100'
                    }`}>
                        {/* Header */}
                        <div className={`px-6 py-4 border-b ${
                            modalMessage.type === 'success'
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                        }`}>
                            <div className="flex items-center gap-3">
                                {modalMessage.type === 'success' ? (
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <h2 className={`text-lg font-semibold ${
                                    modalMessage.type === 'success'
                                        ? 'text-green-900'
                                        : 'text-red-900'
                                }`}>
                                    {modalMessage.type === 'success' ? 'Success' : 'Error'}
                                </h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-6">
                            <p className={`text-sm leading-relaxed ${
                                modalMessage.type === 'success'
                                    ? 'text-green-800'
                                    : 'text-red-800'
                            }`}>
                                {modalMessage.message}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className={`px-6 py-4 border-t flex justify-end ${
                            modalMessage.type === 'success'
                                ? 'border-green-200 bg-green-50'
                                : 'border-red-200 bg-red-50'
                        }`}>
                            <button
                                onClick={() => {
                                    if (modalMessage.onClose) modalMessage.onClose();
                                    setModalMessage(null);
                                }}
                                className={`px-4 py-2.5 rounded-lg font-medium text-white transition-colors ${
                                    modalMessage.type === 'success'
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
    
}

