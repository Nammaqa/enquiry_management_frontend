export default function Dashboard() {
    const userRole = localStorage.getItem('userRole');
    const isCounsellor = userRole?.toLowerCase() === 'counsellor' || userRole?.toLowerCase() === 'counselor';
    const isAccounts = userRole?.toUpperCase() === 'ACCOUNTS';

    if (isCounsellor || isAccounts) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-800 mb-4">Coming Soon</h1>
                    <p className="text-xl text-gray-600">We're working on something amazing for you!</p>
                </div>
            </div>
        );
    }

    return <h1>Dashboard</h1>;
}