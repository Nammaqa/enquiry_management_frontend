import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import type { CallLogEntry, Enquiry, Package, Subject } from '../types';
import * as XLSX from 'xlsx';

export default function Contact() {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [activeEnquiryForLogs, setActiveEnquiryForLogs] = useState<Enquiry | null>(null);
    const [newCallLogTitle, setNewCallLogTitle] = useState('');
    const [newCallLogDescription, setNewCallLogDescription] = useState('');
    const [logError, setLogError] = useState<string | null>(null);
    const [savingLog, setSavingLog] = useState(false);
    const navigate = useNavigate();

    // Filter and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedDate, setSelectedDate] = useState<string>(''); // Date filter in YYYY-MM-DD format

    const role = localStorage.getItem('userRole');
    const isCounsellor = role === 'COUNSELLOR';
    const allowedStatuses = isCounsellor ? ['enquiry stage'] : ['enquiry stage', 'qualified demo', 'class qualified'];

    useEffect(() => {
        fetchAllData();
        // Restore statusFilter from sessionStorage
        const savedStatusFilter = sessionStorage.getItem('contactPageStatusFilter');
        if (savedStatusFilter) {
            setStatusFilter(savedStatusFilter);
        }
        // Restore selectedDate from sessionStorage
        const savedDate = sessionStorage.getItem('contactPageSelectedDate');
        if (savedDate) {
            setSelectedDate(savedDate);
        }
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [enquiriesData, packagesData, subjectsData] = await Promise.all([
                apiRequest<Enquiry[]>('/api/enquiries', { method: 'GET' }),
                apiRequest<Package[]>('/api/packages', { method: 'GET' }),
                apiRequest<Subject[]>('/api/subjects', { method: 'GET' })
            ]);

            const enquiriesWithPendingLogs = enquiriesData.map(enquiry => ({
                ...enquiry,
                callLogs: undefined
            }));

            setEnquiries(enquiriesWithPendingLogs);
            setPackages(packagesData);
            setSubjects(subjectsData);
            fetchCallLogsForEnquiries(enquiriesWithPendingLogs).catch(err => {
                console.error('Failed to prefetch call logs:', err);
            });
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load enquiries data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCallLogsForEnquiries = async (enquiriesList: Enquiry[]) => {
        const callLogsResults = await Promise.all(enquiriesList.map(async (enquiry) => {
            try {
                const response = await apiRequest<CallLogEntry[]>(`/api/logs/${enquiry.id}`, { method: 'GET' });
                return { id: enquiry.id, callLogs: response };
            } catch (err) {
                console.error(`Failed to load call logs for enquiry ${enquiry.id}:`, err);
                return { id: enquiry.id, callLogs: [] };
            }
        }));

        setEnquiries(prevEnquiries => prevEnquiries.map(enquiry => {
            const logResult = callLogsResults.find(result => result.id === enquiry.id);
            return logResult ? { ...enquiry, callLogs: logResult.callLogs } : enquiry;
        }));
    };

    const openLogModal = async (enquiry: Enquiry) => {
        setActiveEnquiryForLogs({ ...enquiry, callLogs: enquiry.callLogs ?? [] });
        setNewCallLogTitle('');
        setNewCallLogDescription('');
        setLogError(null);
        setIsLogModalOpen(true);

        try {
            const response = await apiRequest<CallLogEntry[]>(`/api/logs/${enquiry.id}`, { method: 'GET' });
            setActiveEnquiryForLogs(prev => prev ? { ...prev, callLogs: response } : prev);
            setEnquiries(prevEnquiries => prevEnquiries.map(e => e.id === enquiry.id ? { ...e, callLogs: response } : e));
        } catch (err) {
            console.error('Failed to load call logs:', err);
        }
    };

    const closeLogModal = () => {
        setIsLogModalOpen(false);
        setActiveEnquiryForLogs(null);
        setNewCallLogTitle('');
        setNewCallLogDescription('');
        setLogError(null);
    };

    const handleSaveCallLog = async () => {
        if (!activeEnquiryForLogs) return;
        if (!newCallLogTitle.trim()) {
            setLogError('Enter a call title before saving.');
            return;
        }
        if (!newCallLogDescription.trim()) {
            setLogError('Enter a call note before saving.');
            return;
        }

        setSavingLog(true);
        setLogError(null);

        try {
            const response = await apiRequest<{ message: string; log: CallLogEntry }>('/api/logs', {
                method: 'POST',
                body: {
                    enquiryId: activeEnquiryForLogs.id,
                    title: newCallLogTitle.trim(),
                    description: newCallLogDescription.trim(),
                },
            });

            const savedLog = response?.log ?? {
                id: `${activeEnquiryForLogs.id}-${Date.now()}`,
                title: newCallLogTitle.trim(),
                description: newCallLogDescription.trim(),
                createdAt: new Date().toISOString(),
            };

            // Refresh the enquiry's call logs from the backend so the badge count stays accurate immediately.
            const latestCallLogs = await apiRequest<CallLogEntry[]>(`/api/logs/${activeEnquiryForLogs.id}`, { method: 'GET' });
            const updatedLogs = Array.isArray(latestCallLogs) ? latestCallLogs : [...(activeEnquiryForLogs.callLogs ?? []), savedLog];

            setEnquiries(prevEnquiries => prevEnquiries.map(enquiry => {
                if (enquiry.id !== activeEnquiryForLogs.id) return enquiry;
                return {
                    ...enquiry,
                    callLogs: updatedLogs,
                };
            }));

            setActiveEnquiryForLogs(prev => prev ? {
                ...prev,
                callLogs: updatedLogs,
            } : null);

            setNewCallLogTitle('');
            setNewCallLogDescription('');
        } catch (err) {
            console.error('Failed to save call log:', err);
            setLogError('Unable to save call log. Please try again.');
        } finally {
            setSavingLog(false);
        }
    };

    // Get unique statuses in specific order
    const displayedEnquiries = useMemo(() => {
        if (!isCounsellor) return enquiries;
        return enquiries.filter(enquiry => allowedStatuses.includes(enquiry.candidateStatus));
    }, [enquiries, isCounsellor]);

    const uniqueStatuses = useMemo(() => {
        // Always include allowed statuses, even if they have no records
        return allowedStatuses;
    }, [allowedStatuses]);

    // Set initial status filter to first status
    useEffect(() => {
        if (statusFilter === null && uniqueStatuses.length > 0) {
            setStatusFilter(uniqueStatuses[0]);
        }
    }, [uniqueStatuses, statusFilter]);

    useEffect(() => {
        if (statusFilter && !uniqueStatuses.includes(statusFilter)) {
            setStatusFilter(uniqueStatuses[0] || null);
        }
    }, [uniqueStatuses, statusFilter]);

    // Save statusFilter to sessionStorage whenever it changes
    useEffect(() => {
        if (statusFilter) {
            sessionStorage.setItem('contactPageStatusFilter', statusFilter);
        }
    }, [statusFilter]);

    // Save sortOrder to sessionStorage whenever it changes
    useEffect(() => {
        if (selectedDate) {
            sessionStorage.setItem('contactPageSelectedDate', selectedDate);
        } else {
            sessionStorage.removeItem('contactPageSelectedDate');
        }
    }, [selectedDate]);

    // Apply filters
    const filteredEnquiries = useMemo(() => {
        let filtered = displayedEnquiries;

        // Search filter
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(enquiry =>
                enquiry.name.toLowerCase().includes(search) ||
                enquiry.phone.toLowerCase().includes(search) ||
                enquiry.email.toLowerCase().includes(search)
            );
        }

        // Status filter
        if (statusFilter) {
            filtered = filtered.filter(enquiry => enquiry.candidateStatus === statusFilter);
        }

        // Date filter
        if (selectedDate) {
            filtered = filtered.filter(enquiry => {
                const enquiryDate = new Date(enquiry.createdAt).toISOString().split('T')[0];
                return enquiryDate === selectedDate;
            });
        }

        // Sort by date (newest first)
        filtered = filtered.sort((a, b) => {
            const dateA = new Date(b.createdAt).getTime();
            const dateB = new Date(a.createdAt).getTime();
            return dateA - dateB;
        });

        return filtered;
    }, [displayedEnquiries, searchTerm, statusFilter, selectedDate]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / itemsPerPage));
    const paginatedEnquiries = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEnquiries.slice(start, start + itemsPerPage);
    }, [filteredEnquiries, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, selectedDate]);

    // Reset to page 1 when rows per page changes
    const handleRowsPerPageChange = (newValue: number) => {
        setItemsPerPage(newValue);
        setCurrentPage(1);
    };

    const getPackageName = (id: number | null) => {
        if (id === null) return 'Others';
        const pkg = packages.find(p => p.id === id);
        return pkg ? `${pkg.name} (${pkg.code})` : `ID: ${id}`;
    };

    const getSubjectNames = (ids: number[]) => {
        if (!ids || ids.length === 0) return 'None';
        return ids.map(id => {
            const subject = subjects.find(s => s.id === id);
            return subject ? subject.name : id;
        }).join(', ');
    };

    // Format phone number to display as 10 digits
    const formatPhoneNumber = (phone: string) => {
        if (!phone) return '';
        const cleanPhone = phone.replace(/\D/g, '').slice(0, 10);
        return cleanPhone;
    };

    // Truncate name to max 25 characters
    const formatCandidateName = (name: string) => {
        if (!name) return '';
        return name.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
    };

    // Export filtered data to CSV
    const exportToXLSX = () => {
        if (filteredEnquiries.length === 0) {
            alert('No data to export');
            return;
        }

        // Define headers
        const headers = [
            'Enquiry ID',
            'Candidate Name',
            'Phone',
            'Email',
            'Location',
            'Status',
            'Package',
            'Subjects',
            'Training Mode',
            'Training Time',
            'Start Date',
            'Profession',
            'Qualification',
            'Experience',
            'Source/Referral',
            'Consent',
            'Created Date'
        ];

        // Map data to rows
        const rows = filteredEnquiries.map(enquiry => [
            enquiry.id,
            formatCandidateName(enquiry.name),
            formatPhoneNumber(enquiry.phone),
            enquiry.email,
            enquiry.current_location,
            enquiry.candidateStatus,
            getPackageName(enquiry.packageId),
            getSubjectNames(enquiry.subjectIds),
            enquiry.trainingMode,
            enquiry.trainingTime,
            enquiry.startTime,
            enquiry.profession,
            enquiry.qualification,
            enquiry.experience,
            enquiry.referral,
            enquiry.consent ? 'Yes' : 'No',
            new Date(enquiry.createdAt).toLocaleDateString('en-US')
        ]);

        // Create worksheet data
        const worksheetData = [headers, ...rows];

        // Create a new workbook
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Enquiries');

        // Set column widths for better readability
        const columnWidths = [
            { wch: 10 }, // Enquiry ID
            { wch: 20 }, // Candidate Name
            { wch: 12 }, // Phone
            { wch: 25 }, // Email
            { wch: 15 }, // Location
            { wch: 15 }, // Status
            { wch: 20 }, // Package
            { wch: 25 }, // Subjects
            { wch: 15 }, // Training Mode
            { wch: 15 }, // Training Time
            { wch: 12 }, // Start Date
            { wch: 15 }, // Profession
            { wch: 15 }, // Qualification
            { wch: 12 }, // Experience
            { wch: 20 }, // Source/Referral
            { wch: 10 }, // Consent
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = columnWidths;

        // Generate file name and download
        const fileName = `${statusFilter || 'enquiry'}_list_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const handleCandidateClick = (enquiry: Enquiry) => {
        navigate(`/contact-details/${enquiry.id}?from=enquiries`, { state: { enquiry } });
    };

    const rowClickEnabled = (_enquiry?: Enquiry) => true;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-indigo-600 font-medium animate-pulse">Loading enquiries...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search Section */}
            <div className="bg-white px-6 py-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={`Search ${statusFilter === 'enquiry stage' ? 'Enquiry List' : statusFilter === 'qualified demo' ? 'Qualified Demo' : statusFilter === 'class qualified' ? 'Class Qualified' : statusFilter} by name, phone, or email...`}
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer hover:border-indigo-400 transition-colors"
                        />
                        {selectedDate && (
                            <button
                                onClick={() => setSelectedDate('')}
                                className="px-3 py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Clear date filter"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center">
                        <div className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap">
                            {filteredEnquiries.length} of {displayedEnquiries.length}
                        </div>
                    </div>
                </div>
            </div>


            {/* Status Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex gap-0 border-b border-slate-200 overflow-x-auto justify-between items-center">
                    <div className="flex gap-0 overflow-x-auto">
                        {uniqueStatuses.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-6 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                                    statusFilter === status
                                        ? 'border-indigo-600 text-indigo-600 bg-white'
                                        : 'border-transparent text-slate-600 bg-slate-50 hover:text-slate-900 hover:bg-white'
                                }`}
                            >
                                {status === 'enquiry stage' ? 'Enquiry List' : status === 'qualified demo' ? 'Qualified Demo' : status === 'class qualified' ? 'Class Qualified' : status}
                            </button>
                        ))}
                    </div>

                    {/* Rows Per Page Selector & Export Button */}
                    <div className="px-6 py-3.5 flex items-center gap-4 border-l border-slate-200">
                        <div className="flex items-center gap-2">
                            <label htmlFor="rows-per-page" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                                Rows per page:
                            </label>
                            <select
                                id="rows-per-page"
                                value={itemsPerPage}
                                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                            </select>
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={exportToXLSX}
                            disabled={filteredEnquiries.length === 0}
                            className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                                filteredEnquiries.length === 0
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-md'
                            }`}
                            title={filteredEnquiries.length === 0 ? 'No data to export' : 'Export filtered data as XLSX'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[6%] align-top">Enquiry ID</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[16%] align-top">Candidate <span className="text-rose-500">*</span></th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[10%] align-top">Status</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[18%] align-top">Contact <span className="text-rose-500">*</span></th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[14%] align-top">Package Info <span className="text-rose-500">*</span></th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[13%] align-top">Training Prefs</th>
                                {statusFilter !== 'demo' && <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[10%] align-top">Add Logs</th>}
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[8%] align-top">Profession</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[8%] align-top">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredEnquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={8 + (statusFilter !== 'demo' ? 1 : 0)} className="px-6 py-12 text-center text-black text-sm">
                                        No records
                                    </td>
                                </tr>
                            ) : (
                                paginatedEnquiries.map((enquiry) => (
                                    <tr
                                        key={enquiry.id}
                                        className={`transition-all ${rowClickEnabled(enquiry) ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                                        onClick={rowClickEnabled(enquiry) ? () => handleCandidateClick(enquiry) : undefined}
                                    >
                                        <td className="px-3 py-4">
                                            <div className="text-sm font-semibold text-slate-900">{enquiry.id}</div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-sm font-medium text-indigo-600 hover:text-indigo-800 wrap-break-word">{formatCandidateName(enquiry.name)}</div>
                                            <div className="text-xs text-black mt-0.5 wrap-break-word">{enquiry.current_location}</div>
                                            {enquiry.collegeName && (
                                                <div className="text-xs text-slate-500 mt-0.5">{enquiry.collegeName}</div>
                                            )}
                                            {enquiry.consent && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 mt-1">
                                                    Consent
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-black wrap-break-word whitespace-normal">
                                                {enquiry.candidateStatus}
                                            </span>
                                            <div className="text-xs text-slate-400 mt-1.5 break-all">Ref: {enquiry.referral}</div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs text-slate-900 flex items-start gap-1.5 break-all">
                                                <svg className="w-3 h-3 text-black mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                <span>{enquiry.email}</span>
                                            </div>
                                            <div className="text-xs text-black mt-1 flex items-center gap-1.5">
                                                <svg className="w-3 h-3 text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                {formatPhoneNumber(enquiry.phone)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs font-medium text-black wrap-break-word">
                                                {getPackageName(enquiry.packageId)}
                                            </div>
                                            <div className="text-xs text-black mt-1 line-clamp-2" title={getSubjectNames(enquiry.subjectIds)}>
                                                {getSubjectNames(enquiry.subjectIds)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs text-black wrap-break-word">{enquiry.trainingMode}</div>
                                            <div className="text-xs text-black">{enquiry.trainingTime}</div>
                                            <div className="text-xs text-black mt-0.5">Start: {enquiry.startTime}</div>
                                        </td>
                                        {statusFilter !== 'demo' && (
                                            <td className="px-3 py-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openLogModal(enquiry);
                                                    }}
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-300 bg-white text-slate-700 hover:border-indigo-500 hover:text-indigo-700 transition"
                                                    title="Add call log"
                                                >
                                                    +
                                                </button>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {enquiry.callLogs === undefined ? 'Loading...' : `${enquiry.callLogs.length} log${enquiry.callLogs.length === 1 ? '' : 's'}`}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-3 py-4">
                                            <div className="text-xs text-slate-900 wrap-break-word">{enquiry.profession}</div>
                                            <div className="text-xs text-black wrap-break-word">{enquiry.qualification}</div>
                                            <div className="text-xs text-slate-400 mt-0.5">{enquiry.experience}</div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs text-black">
                                                {new Date(enquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                <br />
                                                {new Date(enquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {isLogModalOpen && activeEnquiryForLogs && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                        <div className="w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">Call Logs for {activeEnquiryForLogs.name}</h2>
                                    <p className="text-sm text-slate-500">Review recent notes and add a new call update.</p>
                                </div>
                                <button
                                    onClick={closeLogModal}
                                    className="text-slate-400 hover:text-slate-600"
                                    aria-label="Close call log modal"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-6 px-6 py-6">
                                <main className="space-y-6 max-h-[72vh] overflow-y-auto pr-1">
                                    <div className="rounded-3xl border border-slate-200 p-6 space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Call title</label>
                                                <input
                                                    value={newCallLogTitle}
                                                    onChange={(e) => setNewCallLogTitle(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    placeholder="Call title"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700">Add a note about the call</label>
                                                <textarea
                                                    value={newCallLogDescription}
                                                    onChange={(e) => setNewCallLogDescription(e.target.value)}
                                                    rows={4}
                                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    placeholder="Add a note about the call"
                                                />
                                            </div>
                                        </div>

                                        {logError && <p className="text-sm text-rose-600">{logError}</p>}
                                    </div>

                                    <div className="rounded-3xl border border-slate-200 p-6 space-y-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-slate-900">Existing Logs</h3>
                                                <p className="text-xs text-slate-500">Review previous notes for this enquiry.</p>
                                            </div>
                                            <span className="text-xs text-slate-500">
                                                {activeEnquiryForLogs.callLogs === undefined ? 'Loading...' : `${activeEnquiryForLogs.callLogs.length} total`}
                                            </span>
                                        </div>

                                        {activeEnquiryForLogs.callLogs === undefined ? (
                                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                                Loading call logs...
                                            </div>
                                        ) : activeEnquiryForLogs.callLogs.length > 0 ? (
                                            <div className="space-y-3">
                                                {activeEnquiryForLogs.callLogs.map(log => (
                                                    <div key={log.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <p className="text-sm font-semibold text-slate-900">{log.title}</p>
                                                            <span className="text-[11px] uppercase tracking-wide text-slate-500">{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown date'}</span>
                                                        </div>
                                                        <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{log.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                                                No logs yet for this enquiry.
                                            </div>
                                        )}
                                    </div>
                                </main>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
                                <button
                                    onClick={closeLogModal}
                                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCallLog}
                                    disabled={savingLog}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {savingLog ? 'Saving...' : 'Save Log'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {filteredEnquiries.length > 0 && (
                    <div className="bg-slate-50 px-4 py-3 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-700">
                                Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredEnquiries.length)}</span> of{' '}
                                <span className="font-medium">{filteredEnquiries.length}</span> results
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-slate-700 bg-white border border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}