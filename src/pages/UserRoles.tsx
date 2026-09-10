import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

// Types
interface User {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    role: 'HR' | 'COUNSELLOR' | 'ACCOUNTS' | 'INSTRUCTOR';
    createdAt?: string;
}

type UserRole = 'HR' | 'COUNSELLOR' | 'ACCOUNTS' | 'INSTRUCTOR';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default function UserRoles() {
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [userForm, setUserForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'HR' as UserRole,
    });

    const roleOptions: UserRole[] = ['HR', 'COUNSELLOR', 'ACCOUNTS', 'INSTRUCTOR'];

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiRequest<User[]>('/api/users', {
                method: 'GET',
            });
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setUserForm({
                name: user.name,
                email: user.email,
                phone: user.phone_number || '',
                password: '',
                role: user.role,
            });
        } else {
            setEditingUser(null);
            setUserForm({
                name: '',
                email: '',
                phone: '',
                password: '',
                role: 'HR',
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setUserForm({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'HR',
        });
        setError(null);
    };

    const saveUser = async () => {
        // Validation logic
        if (editingUser) {
            if (!userForm.password) {
                setError('Please provide a new password');
                return;
            }
        } else {
            if (!userForm.name || !userForm.email || !userForm.phone || !userForm.password) {
                setError('Please fill in all required fields');
                return;
            }

            if (!/^[6-9]\d{9}$/.test(userForm.phone)) {
                setError('Phone number must be a valid 10-digit mobile number');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            if (editingUser) {
                // Change Password Logic
                await apiRequest('/api/users/change-password', {
                    method: 'POST',
                    body: {
                        id: editingUser.id,
                        newPassword: userForm.password
                    },
                });
            } else {
                // Create User Logic
                await apiRequest('/api/users', {
                    method: 'POST',
                    body: {
                        name: userForm.name,
                        email: userForm.email,
                        phone_number: userForm.phone,
                        role: userForm.role,
                        password: userForm.password,
                    },
                });
            }

            await fetchUsers();
            closeModal();
        } catch (err) {
            // Handle error response properly
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error saving user:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await apiRequest(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            await fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error deleting user:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'HR':
                return 'bg-blue-100 text-blue-700';
            case 'COUNSELLOR':
                return 'bg-green-100 text-green-700';
            case 'ACCOUNTS':
                return 'bg-purple-100 text-purple-700';
            case 'INSTRUCTOR':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">User Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage users and their roles</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon />
                    Add User
                </button>
            </div>

            {/* Error Message */}
            {error && !isModalOpen && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Role</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading && users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                                        No users found. Click "Add User" to create one.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{user.name}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{user.phone_number || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded transition-colors"
                                                disabled={loading}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 px-2 py-1 rounded transition-colors ml-1"
                                                disabled={loading}
                                            >
                                                <DeleteIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800">
                                {editingUser ? 'Edit User' : 'Add User'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="px-6 py-4 space-y-4">
                            {/* Error Message in Modal */}
                            {error && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    disabled={!!editingUser}
                                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    disabled={!!editingUser}
                                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    value={userForm.phone}
                                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                    disabled={!!editingUser}
                                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                    placeholder="Enter 10-digit phone number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Password {editingUser ? <span className="text-rose-500">* (Enter new password)</span> : <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    type="password"
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Role <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                                    disabled={!!editingUser}
                                    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${editingUser ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                                >
                                    {roleOptions.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveUser}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
