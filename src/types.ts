export interface Subject {
    id: number;
    name: string;
    code: string;
}

export interface Package {
    id: number;
    name: string;
    code: string;
    Subjects?: Subject[];
}

export interface CallLogEntry {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface Enquiry {
    id: number;
    name: string;
    email: string;
    phone: string;
    current_location: string;
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
    demoStatus?: string; // New field requested
    billing?: Billing;
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
    packageCost: string;
    amountPaid: string;
    discount: string;
    balance: string;
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
