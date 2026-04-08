import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { apiRequest } from '../utils/api';
import type { Enquiry, Package, Subject } from '../types';

export default function Contact() {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Filter and Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const role = localStorage.getItem('userRole');
    const isCounsellor = role === 'COUNSELLOR';
    const allowedStatuses = isCounsellor ? ['enquiry stage', 'demo'] : ['enquiry stage', 'demo', 'qualified demo', 'class', 'class qualified'];

    useEffect(() => {
        fetchAllData();
        // Restore statusFilter from sessionStorage
        const savedStatusFilter = sessionStorage.getItem('contactPageStatusFilter');
        if (savedStatusFilter) {
            setStatusFilter(savedStatusFilter);
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

            setEnquiries(enquiriesData);
            setPackages(packagesData);
            setSubjects(subjectsData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load enquiries data.');
        } finally {
            setLoading(false);
        }
    };

    // Get unique statuses in specific order
    const displayedEnquiries = useMemo(() => {
        if (!isCounsellor) return enquiries;
        return enquiries.filter(enquiry => allowedStatuses.includes(enquiry.candidateStatus));
    }, [enquiries, isCounsellor]);

    const uniqueStatuses = useMemo(() => {
        const statuses = displayedEnquiries.map(e => e.candidateStatus).filter(Boolean);
        const uniqueSet = Array.from(new Set(statuses));
        const ordered = allowedStatuses.filter(s => uniqueSet.includes(s));
        const remaining = uniqueSet.filter(s => !allowedStatuses.includes(s)).sort();
        return [...ordered, ...remaining];
    }, [displayedEnquiries, allowedStatuses]);

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

        return filtered;
    }, [displayedEnquiries, searchTerm, statusFilter]);

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / itemsPerPage));
    const paginatedEnquiries = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEnquiries.slice(start, start + itemsPerPage);
    }, [filteredEnquiries, currentPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

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

    const handleCandidateClick = (enquiry: Enquiry) => {
        navigate(`/contact-details/${enquiry.id}`, { state: { enquiry } });
    };

    const rowClickEnabled = (enquiry: Enquiry) => !(isCounsellor && enquiry.candidateStatus === 'demo');

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
                                placeholder={`Search ${statusFilter} list by name, phone, or email...`}
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
                <div className="flex gap-0 border-b border-slate-200 overflow-x-auto">
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
                            {status}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[16%]">Candidate</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[10%]">Status</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[18%]">Contact</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[14%]">Package Info</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[13%]">Training Prefs</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[13%]">Profession</th>
                                <th className="px-3 py-4 text-xs font-semibold text-black uppercase tracking-wider w-[8%]">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredEnquiries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-black text-sm">
                                        No enquiries found matching your filters.
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
                                            <div className="text-sm font-medium text-indigo-600 hover:text-indigo-800 wrap-break-word">{enquiry.name}</div>
                                            <div className="text-xs text-black mt-0.5 wrap-break-word">{enquiry.current_location}</div>
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
                                                {enquiry.phone}
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