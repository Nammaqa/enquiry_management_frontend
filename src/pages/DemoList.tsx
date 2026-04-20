import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import type { CallLogEntry, Enquiry, Package, Subject } from '../types';
import * as XLSX from 'xlsx';

export default function DemoList() {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [logModalOpen, setLogModalOpen] = useState(false);
    const [activeEnquiryForLogs, setActiveEnquiryForLogs] = useState<Enquiry | null>(null);
    const [logTitle, setLogTitle] = useState('');
    const [logDescription, setLogDescription] = useState('');
    const [fetchingLogs, setFetchingLogs] = useState(false);
    const [savingLog, setSavingLog] = useState(false);
    const [logError, setLogError] = useState<string | null>(null);
    const navigate = useNavigate();
    const role = localStorage.getItem('userRole');
    const isAccounts = role === 'ACCOUNTS';

    // Filter and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

    useEffect(() => {
        fetchAllData();
        
        // Restore filter and pagination state from sessionStorage
        const savedSearchTerm = sessionStorage.getItem('demoListSearchTerm');
        const savedSelectedDate = sessionStorage.getItem('demoListSelectedDate');
        const savedCurrentPage = sessionStorage.getItem('demoListCurrentPage');
        
        if (savedSearchTerm) setSearchTerm(savedSearchTerm);
        if (savedSelectedDate) setSelectedDate(savedSelectedDate);
        if (savedCurrentPage) setCurrentPage(Number(savedCurrentPage));
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [enquiriesData, packagesData, subjectsData] = await Promise.all([
                apiRequest<Enquiry[]>('/api/enquiries', { method: 'GET' }),
                apiRequest<Package[]>('/api/packages', { method: 'GET' }),
                apiRequest<Subject[]>('/api/subjects', { method: 'GET' })
            ]);

            // Filter to only demo status
            const demoEnquiries = enquiriesData.filter(e => e.candidateStatus === 'demo');
            const enquiriesWithPendingLogs = demoEnquiries.map(enquiry => ({
                ...enquiry,
                callLogs: undefined,
            }));

            setEnquiries(enquiriesWithPendingLogs);
            setPackages(packagesData);
            setSubjects(subjectsData);
            fetchCallLogsForEnquiries(enquiriesWithPendingLogs).catch(err => {
                console.error('Failed to prefetch call logs:', err);
            });
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load demo list data.');
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

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedDate]);

    // Save search term to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('demoListSearchTerm', searchTerm);
    }, [searchTerm]);

    // Save selected date to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('demoListSelectedDate', selectedDate);
    }, [selectedDate]);

    // Save current page to sessionStorage
    useEffect(() => {
        sessionStorage.setItem('demoListCurrentPage', currentPage.toString());
    }, [currentPage]);

    const getPackageName = (packageId: number | null | undefined) => {
        if (packageId === null) return 'Others';
        if (packageId === undefined) return '-';
        const pkg = packages.find(p => p.id === packageId);
        return pkg ? `${pkg.name}` : `Package ${packageId}`;
    };

    const getSubjectNames = (subjectIds: number[] | undefined) => {
        if (!subjectIds?.length) return 'None';
        return subjectIds
            .map(id => subjects.find(s => s.id === id)?.name || `Subject ${id}`)
            .join(', ');
    };

    const formatCandidateName = (name: string) => {
        if (!name) return '';
        return name.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
    };

    const formatPhoneNumber = (phone: string) => {
        if (!phone) return '';
        return phone.replace(/\D/g, '').slice(0, 10);
    };

    const openLogModal = async (enquiry: Enquiry) => {
        setActiveEnquiryForLogs({ ...enquiry, callLogs: enquiry.callLogs ?? [] });
        setLogTitle('');
        setLogDescription('');
        setLogError(null);
        setLogModalOpen(true);
        setFetchingLogs(true);

        try {
            const response = await apiRequest<CallLogEntry[]>(`/api/logs/${enquiry.id}`, { method: 'GET' });
            setActiveEnquiryForLogs({ ...enquiry, callLogs: response });
            setEnquiries(prev => prev.map(item => item.id === enquiry.id ? { ...item, callLogs: response } : item));
        } catch (err) {
            console.error('Failed to fetch call logs:', err);
            setLogError('Unable to load logs. Please try again.');
        } finally {
            setFetchingLogs(false);
        }
    };

    const closeLogModal = () => {
        setLogModalOpen(false);
        setActiveEnquiryForLogs(null);
        setLogTitle('');
        setLogDescription('');
        setLogError(null);
    };

    const handleSaveLog = async () => {
        if (!activeEnquiryForLogs) return;
        if (!logTitle.trim() || !logDescription.trim()) {
            setLogError('Please enter both title and description for the log.');
            return;
        }

        setSavingLog(true);
        setLogError(null);

        try {
            const response = await apiRequest<{ message: string; log: CallLogEntry }>('/api/logs', {
                method: 'POST',
                body: {
                    enquiryId: activeEnquiryForLogs.id,
                    title: logTitle.trim(),
                    description: logDescription.trim(),
                },
            });

            const newLog = response.log;
            const updatedLogs = [newLog, ...(activeEnquiryForLogs.callLogs ?? [])];
            setActiveEnquiryForLogs({ ...activeEnquiryForLogs, callLogs: updatedLogs });
            setEnquiries(prev => prev.map(item =>
                item.id === activeEnquiryForLogs.id ? { ...item, callLogs: updatedLogs } : item
            ));
            setLogTitle('');
            setLogDescription('');
            setLogError('Log added successfully.');
        } catch (err) {
            console.error('Failed to save log:', err);
            setLogError('Failed to save log. Please try again.');
        } finally {
            setSavingLog(false);
        }
    };

    const handleStatusChange = async (enquiryId: number, newStatus: string) => {
        setUpdatingStatusId(enquiryId);
        try {
            const response = await apiRequest<{ message: string; enquiry: Enquiry }>('/api/enquiries/change-status', {
                method: 'POST',
                body: {
                    enquiryId,
                    newStatus,
                },
            });

            if (response?.enquiry) {
                setEnquiries(prev => prev.map(item =>
                    item.id === enquiryId ? { ...item, candidateStatus: response.enquiry.candidateStatus } : item
                ));
            }
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to update status. Please try again.');
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const filteredEnquiries = useMemo(() => {
        let filtered = enquiries.filter(enquiry => {
            const matchesSearch = searchTerm === '' || 
                enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                enquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                enquiry.phone?.includes(searchTerm);
            return matchesSearch;
        });

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
    }, [enquiries, searchTerm, selectedDate]);

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
            enquiry.referral,
            enquiry.consent ? 'Yes' : 'No',
            new Date(enquiry.createdAt).toLocaleDateString('en-US')
        ]);

        // Create worksheet data
        const worksheetData = [headers, ...rows];

        // Create a new workbook
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Demo List');

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
            { wch: 20 }, // Source/Referral
            { wch: 10 }, // Consent
            { wch: 15 }  // Created Date
        ];
        worksheet['!cols'] = columnWidths;

        // Generate file name and download
        const fileName = `demo_list_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    const paginatedEnquiries = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredEnquiries.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredEnquiries, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Error */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Search and Filter Section */}
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
                                placeholder="Search by name, phone, or email..."
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
                            {filteredEnquiries.length} candidates
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Header with Pagination */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <label htmlFor="rows-per-page" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                            Rows per page:
                        </label>
                        <select
                            id="rows-per-page"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-slate-600">
                            Page {currentPage} of {totalPages > 0 ? totalPages : 1}
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
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[15%] align-top">Candidate</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[10%] align-top">Status</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[16%] align-top">Contact</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[13%] align-top">Package Info</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[11%] align-top">Training Prefs</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[9%] align-top">Profession</th>
                                {isAccounts && (
                                    <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[10%] align-top">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && enquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={isAccounts ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                                        Loading demo list...
                                    </td>
                                </tr>
                            ) : paginatedEnquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={isAccounts ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                                        No demo candidates found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedEnquiries.map((enquiry) => (
                                    <tr key={enquiry.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => {
                                        // Save current state before navigating
                                        sessionStorage.setItem('demoListSearchTerm', searchTerm);
                                        sessionStorage.setItem('demoListSelectedDate', selectedDate);
                                        sessionStorage.setItem('demoListCurrentPage', currentPage.toString());
                                        navigate(`/contact-details/${enquiry.id}?from=demo-list`, { state: { enquiry } });
                                    }}>
                                        <td className="px-3 py-4">
                                            <div className="text-sm font-semibold text-slate-900">{enquiry.id}</div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-sm font-medium text-slate-900">{formatCandidateName(enquiry.name)}</div>
                                            <div className="text-xs text-slate-600 mt-0.5">{enquiry.current_location}</div>
                                            {enquiry.consent && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 mt-1">
                                                    Consent
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-4">
                                            {isAccounts ? (
                                                <select
                                                    value={enquiry.candidateStatus}
                                                    onChange={(e) => handleStatusChange(enquiry.id, e.target.value)}
                                                    disabled={updatingStatusId === enquiry.id}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-full rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none"
                                                >
                                                    <option value="enquiry stage">Enquiry Stage</option>
                                                    <option value="demo">Demo</option>
                                                    <option value="class">Class</option>
                                                </select>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-slate-900">
                                                    {enquiry.candidateStatus}
                                                </span>
                                            )}
                                            <div className="text-xs text-slate-500 mt-1.5">Ref: {enquiry.referral || '-'}</div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs text-slate-900 flex items-start gap-1.5 break-all">
                                                <svg className="w-3 h-3 text-slate-700 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                <span>{enquiry.email}</span>
                                            </div>
                                            <div className="text-xs text-slate-900 mt-1 flex items-center gap-1.5">
                                                <svg className="w-3 h-3 text-slate-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {formatPhoneNumber(enquiry.phone)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs font-medium text-slate-900">
                                                {getPackageName(enquiry.packageId)}
                                            </div>
                                            <div className="text-xs text-slate-700 mt-1 line-clamp-2" title={getSubjectNames(enquiry.subjectIds)}>
                                                {getSubjectNames(enquiry.subjectIds)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-4">
                                            <div className="text-xs text-slate-900">{enquiry.trainingMode}</div>
                                            <div className="text-xs text-slate-900">{enquiry.trainingTime}</div>
                                            <div className="text-xs text-slate-900 mt-0.5">Start: {enquiry.startTime}</div>
                                        </td>
                                        <td className="px-3 py-4 text-xs text-slate-900">{enquiry.profession || '-'}</td>
                                        {isAccounts && (
                                            <td className="px-3 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openLogModal(enquiry);
                                                            }}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-300 bg-white text-slate-700 hover:border-indigo-500 hover:text-indigo-700 transition"
                                                            title="Add call log"
                                                        >
                                                            +
                                                        </button>
                                                        <span className="text-[11px] text-slate-500 text-center">
                                                            {enquiry.callLogs === undefined ? 'Loading...' : `${enquiry.callLogs.length} log${enquiry.callLogs.length === 1 ? '' : 's'}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {logModalOpen && activeEnquiryForLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
                    <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
                        <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900">Call Logs for {formatCandidateName(activeEnquiryForLogs.name)}</h3>
                                <p className="text-sm text-slate-500">Review recent notes and add a new call update.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeLogModal}
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-[85vh] overflow-auto px-6 py-6">
                            <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <h4 className="text-sm font-semibold text-slate-900">Call title</h4>
                                        <span className="text-xs text-slate-500">Enter call title</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={logTitle}
                                        onChange={(e) => setLogTitle(e.target.value)}
                                        placeholder="Call title"
                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="mb-4 flex items-center justify-between gap-4">
                                        <h4 className="text-sm font-semibold text-slate-900">Add a note about the call</h4>
                                        <span className="text-xs text-slate-500">Add a note about the call</span>
                                    </div>
                                    <textarea
                                        value={logDescription}
                                        onChange={(e) => setLogDescription(e.target.value)}
                                        rows={6}
                                        placeholder="Add a note about the call"
                                        className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {logError && (
                                <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                                    {logError}
                                </div>
                            )}

                            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <div className="mb-4 flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-slate-900">Existing Logs</h4>
                                    <span className="text-xs text-slate-500">{activeEnquiryForLogs.callLogs?.length ?? 0} total</span>
                                </div>
                                <div className="space-y-4">
                                    {fetchingLogs ? (
                                        <div className="text-sm text-slate-500">Loading logs...</div>
                                    ) : activeEnquiryForLogs.callLogs?.length ? (
                                        activeEnquiryForLogs.callLogs.map(log => {
                                            const date = log.createdAt ? new Date(log.createdAt) : null;
                                            const formattedDate = date && !isNaN(date.getTime())
                                                ? date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                                                : '-';
                                            return (
                                                <div key={log.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="font-semibold text-slate-900">{log.title}</p>
                                                        <div className="text-xs text-slate-500 text-right">
                                                            <div>{formattedDate}</div>
                                                            {log.user?.name && <div>by {log.user.name}</div>}
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{log.description}</p>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm text-slate-500">No logs found for this candidate.</div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeLogModal}
                                    className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveLog}
                                    disabled={savingLog}
                                    className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {savingLog ? 'Saving...' : 'Save Log'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-slate-200">
                    <div className="text-sm text-slate-600">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEnquiries.length)} to {Math.min(currentPage * itemsPerPage, filteredEnquiries.length)} of {filteredEnquiries.length}
                    </div>
                    <div className="space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-sm border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
