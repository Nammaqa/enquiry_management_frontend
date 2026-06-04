export interface Subject {
    id: number;
    name: string;
    code: string;
}

export interface Package {
    id: number;
    name: string;
    code: string;
    cost?: number;
    Subjects?: Subject[];
}

export interface CallLogEntry {
    id: string;
    title: string;
    description: string;
    enquiryId?: number;
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
    user?: {
        id: number;
        name: string;
        email: string;
        role: string;
    };
}

export interface Enquiry {
    id: number;
    name: string;
    email: string;
    phone: string;
    current_location: string;
    collegeName?: string;
    packageId: number | null;
    subjectIds: number[];
    trainingMode: string;
    trainingTime: string;
    startTime: string;
    profession: string;
    qualification: string;
    experience: string;
    referral: string;
    consent: boolean;
    candidateStatus: string; // The "Deal Stage"
    targetedFees?: Record<string, number>;
    demoStatus?: string; // New field requested
    isSentBack?: boolean;
    billing?: Billing;
    paymentStatus?: string; // New field for paid list
    callLogs?: CallLogEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface BillingDetails {
    total: number;
    paid: number;
    discount: number;
}

export interface Billing {
    id: number;
    enquiryId: number;
    packageCost: string;
    amountPaid: string;
    discount: string;
    gst: string;
    gstAmount: string;
    balance: string;
    packageType: string;
    subjectIds: number[] | null;
    subjectWiseBreakdown: any | null;
    createdAt: string;
    updatedAt: string;
    enquiry: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
}

export interface JobPost {
    id: number;
    jobTitle: string;
    companyName: string;
    location: string;
}

export interface EnquiryBasic {
    id: number;
    name: string;
    email: string;
    phone: string;
}

export interface PlacementApplication {
    id: number;
    jobPostId: number;
    enquiryId: number;
    userPlacementDetailId: number;
    appliedStatus: boolean;
    job_status: string; // 'applied', 'in-progress', 'selected', 'rejected' etc.
    createdAt: string;
    updatedAt: string;
    jobPost: JobPost;
    enquiry: EnquiryBasic;
}

export interface BillingPaymentHistory {
    id: number;
    billingId: number;
    amountPaid: string | number;
    paymentMode?: string;
    transaction_id?: string;
    posReceiptUrl?: string | null;
    denomination?: string;
    balanceAtTime?: string | number;
    balanceAfterPayment?: string | number;
    totalPaidSoFar?: string | number;
    createdAt: string;
    updatedAt: string;
}
