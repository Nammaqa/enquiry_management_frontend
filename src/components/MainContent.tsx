import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import nammaqa from '../assets/nammaqa.jpg';

// Icons as SVG components
const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const PackageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><polyline points="3.29 7 12 12 20.71 7" /><path d="m7.5 4.27 9 5.15" /></svg>
);

// const ReportsIcon = () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//     </svg>
// );

// const SettingsIcon = () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//     </svg>
// );

// const UsersIcon = () => (
//     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//     </svg>
// );

const LogoutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const MenuIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);
const ContactIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 2v2" /><path d="M7 22v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" /><path d="M8 2v2" /><circle cx="12" cy="11" r="3" /><rect x="3" y="4" width="18" height="18" rx="2" /></svg>
);
const UserRolesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /></svg>
);

const JobsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="12.01" /><path d="M2 12h20" /></svg>
)

const PlacementIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isCollapsed: boolean;
    isActive?: boolean;
    onClick?: () => void;
}

const NavItem = ({ icon, label, isCollapsed, isActive = false, onClick }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
            ${isActive
                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
            }
            ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? label : undefined}
    >
        <span className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
            {icon}
        </span>
        {!isCollapsed && (
            <span className="font-medium text-sm whitespace-nowrap">{label}</span>
        )}
    </button>
);

export default function MainContent({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [fullRoleName, setFullRoleName] = useState('User');
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch user info from localStorage
    useEffect(() => {
        const role = localStorage.getItem('userRole');
        if (role) {
            setFullRoleName(role);
        } else {
            setFullRoleName('User');
        }
    }, []);

    const jobsAllowedRoles = ['ADMIN','HR', 'COUNSELLOR'];
    const batchesAllowedRoles = ['ADMIN', 'HR', 'COUNSELLOR']; // Admin, HR, and Counsellor can see batches
    const userRolesAllowedRoles = ['ADMIN']; // Only admin can manage users and roles
    const navItems = [
        { icon: <DashboardIcon />, label: 'Dashboard', path: '/dashboard' },
        { icon: <PackageIcon />, label: 'Package and Subjects', path: '/package-subject' },
        { icon: <ContactIcon />, label: 'Enquiries', path: '/enquiries' },
        ...(userRolesAllowedRoles.includes(fullRoleName)
            ? [{ icon: <UserRolesIcon />, label: 'User and Roles', path: '/user-roles' }]
            : []),
        ...(batchesAllowedRoles.includes(fullRoleName)
            ? [{ icon: <CalendarIcon />, label: 'Batches', path: '/batches' }]
            : []),
        ...(jobsAllowedRoles.includes(fullRoleName)
            ? [
                { icon: <JobsIcon />, label: 'Jobs', path: '/jobs' },
                { icon: <PlacementIcon />, label: 'Student Placement List', path: '/student-placements' }
            ]
            : []),
    ];

    const handleLogout = () => {
        // Clear all localStorage
        localStorage.clear();
        // Redirect to login page
        navigate('/login');
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsMobileOpen(false); // Close mobile menu after navigation
    };

    // Get active item based on current path
    const getActiveLabel = () => {
        const activeItem = navItems.find(item => item.path === location.pathname);
        return activeItem ? activeItem.label : 'Dashboard';
    };
    const getActiveDescription = () => {
        const activeItem = navItems.find(item => item.path === location.pathname);
        if (activeItem?.label == 'Dashboard') {
            return 'Welcome to Enquiry Management System';
        }
        if (activeItem?.label == 'Package and Subjects') {
            return 'Manage your packages and subjects here';
        }
        if (activeItem?.label == 'Enquiries') {
            return 'List of all student enquiries and their details';
        }
        if (activeItem?.label == 'User and Roles') {
            return 'Manage your users and roles here';
        }
        if (activeItem?.label == 'Jobs') {
            return 'Post job listings for students — accessible to HR Admin and Counsellor only';
        }
        if (activeItem?.label == 'Student Placement List') {
            return 'View and manage all student job applications';
        }
        return 'Enquiry Forms Portal';
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xl shadow-lg text-slate-600 hover:text-indigo-600 transition-colors"
            >
                <MenuIcon />
            </button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white/80 backdrop-blur-xl border-r border-slate-200/60 shadow-xl z-50 transition-all duration-300 ease-in-out flex flex-col
                    ${isCollapsed ? 'w-20' : 'w-64'}
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo Section */}
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-slate-200/60`}>
                    <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                        <img
                            src={nammaqa}
                            alt="Logo"
                            className=" rounded-xl object-cover"
                        />
                        {/* {isCollapsed && (
                            <div className="flex flex-col">
                                <span className="font-bold text-lg text-slate-800">NammaQA</span>
                                <span className="text-xs text-slate-500">Enquiry Portal</span>
                            </div>
                        )} */}
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Create Enquiry Button */}
                <div className="p-3 border-b border-slate-200/60">
                    <button
                        onClick={() => handleNavigation('/create-enquiry')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-xl transition-all duration-200 group
                            ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? 'Create Enquiry' : undefined}
                    >
                        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </span>
                        {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">Create Enquiry</span>}
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            isCollapsed={isCollapsed}
                            isActive={location.pathname === item.path}
                            onClick={() => handleNavigation(item.path)}
                        />
                    ))}
                </nav>

                {/* Bottom Section - Collapse Toggle & Logout */}
                <div className="p-3 border-t border-slate-200/60 space-y-2">
                    {/* Collapse Toggle Button - Desktop Only */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200
                            ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        {!isCollapsed && <span className="font-medium text-sm">Collapse</span>}
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all duration-200 group
                            ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? 'Logout' : undefined}
                    >
                        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                            <LogoutIcon />
                        </span>
                        {!isCollapsed && <span className="font-medium text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`min-h-screen transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
            >
                {/* Header Bar */}
                <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-lg border-b border-slate-200/60 px-4 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="pl-12 lg:pl-0">
                            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">{getActiveLabel()}</h1>
                            <p className="text-sm text-slate-500 mt-0.5">{getActiveDescription()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Notification Bell */}
                            <button className="p-2 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </button>
                            {/* User Info - No Avatar */}
                            <div className="text-sm font-medium text-slate-700">
                                Hi, {fullRoleName}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="p-4 lg:p-8 overflow-y-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}