import type { Enquiry } from '../../types';

interface DealStageCardProps {
    enquiry: Enquiry;
    onUpdateStatus: (stage: string, demoStatus?: string) => void;
}

const STAGES = [
    'enquiry stage',
    'demo',
    'qualified demo',
    'class',
    'class qualified',
    'placement'
];

const DEMO_STATUSES = [
    'Not yet started',
    'In Progress',
    'Completed',
    'Not interested'
];

export default function DealStageCard({ enquiry, onUpdateStatus }: DealStageCardProps) {
    const role = localStorage.getItem('userRole');

    let visibleStages = STAGES;
    if (role === 'COUNSELLOR') {
        visibleStages = ['enquiry stage', 'demo'];
    } else if (role === 'ACCOUNTS') {
        visibleStages = ['qualified demo', 'class', 'class qualified'];
    } else if (role === 'HR') {
        visibleStages = ['class qualified', 'placement'];
    } else if (role === 'ADMIN') {
        visibleStages = STAGES;
    }



    // Global index for the visual pipeline (showing ALL stages)
    const globalStageIndex = STAGES.indexOf(enquiry.candidateStatus || 'enquiry stage');
    const isStageEditable = !(role === 'COUNSELLOR' && enquiry.candidateStatus === 'demo');

    // Demo status is only editable by Admins; counsellors can view demo records only
    const isDemoStatusEditable = role === 'ADMIN' && ['demo', 'qualified demo'].includes(enquiry.candidateStatus || '');

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Deal Stage</h3>
                <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                    {enquiry.candidateStatus}
                </span>
            </div>

            {/* Pipeline Visual - Read Only & No Circle */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
                {STAGES.map((stage, idx) => {
                    const isActive = idx <= globalStageIndex;

                    return (
                        <div
                            key={stage}
                            className={`
                                flex-1 min-w-[80px] h-2 rounded-full relative group transition-colors
                                ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}
                            `}
                            title={stage}
                        >
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap bg-slate-800 text-white px-1.5 py-0.5 rounded transition-opacity pointer-events-none">
                                {stage}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Current Stage</label>
                    <select
                        value={enquiry.candidateStatus || 'enquiry stage'}
                        onChange={(e) => onUpdateStatus(e.target.value, enquiry.demoStatus)}
                        disabled={!isStageEditable}
                        className={`w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-1.5 ${!isStageEditable ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                    >
                        {visibleStages.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                        ))}
                    </select>
                </div>

                <div title={!isDemoStatusEditable ? "Only available for Counsellors/Admins in demo stage" : ""}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Demo Status</label>
                    <select
                        value={enquiry.demoStatus || 'Not yet started'}
                        onChange={(e) => onUpdateStatus(enquiry.candidateStatus, e.target.value)}
                        disabled={!isDemoStatusEditable}
                        className={`w-full text-sm border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 py-1.5 ${!isDemoStatusEditable
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : ''
                            }`}
                    >
                        {DEMO_STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
