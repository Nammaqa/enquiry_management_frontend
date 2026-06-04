import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import type { BillingPaymentHistory } from '../types';

interface PaymentHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    billingId: number;
    candidateName: string;
}

export default function PaymentHistoryModal({
    isOpen,
    onClose,
    billingId,
    candidateName,
}: PaymentHistoryModalProps) {
    const [paymentHistory, setPaymentHistory] = useState<BillingPaymentHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && billingId) {
            fetchPaymentHistory();
        }
    }, [isOpen, billingId]);

    const fetchPaymentHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest<{ paymentHistory: BillingPaymentHistory[] }>(
                `/api/billings/${billingId}/payment-history`,
                { method: 'GET' }
            );
            setPaymentHistory(response.paymentHistory || []);
        } catch (err) {
            console.error('Failed to fetch payment history:', err);
            setError('Failed to load payment history. Please try again.');
            setPaymentHistory([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const parsePaidAmount = (amount: string | number) =>
        typeof amount === 'number' ? amount : parseFloat(amount || '0');

    const totalPaid = paymentHistory.reduce((sum, payment) => {
        return sum + parsePaidAmount(payment.amountPaid);
    }, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Payment History for {candidateName}
                        </h2>
                        <p className="text-sm text-slate-500">
                            Review all payment transactions for this billing record
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Close payment history modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[72vh] overflow-y-auto">
                    {error && (
                        <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-indigo-600 font-medium animate-pulse">
                                Loading payment history...
                            </div>
                        </div>
                    ) : paymentHistory.length > 0 ? (
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-indigo-700 font-medium">Total Amount Paid</p>
                                        <p className="text-2xl font-bold text-indigo-900">
                                            ₹{totalPaid.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-indigo-700 font-medium">Total Payments</p>
                                        <p className="text-2xl font-bold text-indigo-900">
                                            {paymentHistory.length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History Table */}
                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Balance Before
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Balance After
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Total Paid So Far
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Payment Mode
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Transaction ID
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Denomination
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                                Receipt
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {paymentHistory.map((payment, index) => (
                                            <tr
                                                key={payment.id}
                                                className={`${
                                                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                                } hover:bg-indigo-50 transition-colors`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-slate-900">
                                                        {new Date(payment.createdAt).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            }
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {new Date(payment.createdAt).toLocaleTimeString(
                                                            [],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            }
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                                                        ₹{parsePaidAmount(payment.amountPaid).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.balanceAtTime !== undefined ? (
                                                        <span className="text-sm text-slate-900">
                                                            ₹{parsePaidAmount(payment.balanceAtTime).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.balanceAfterPayment !== undefined ? (
                                                        <span className="text-sm text-slate-900">
                                                            ₹{parsePaidAmount(payment.balanceAfterPayment).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.totalPaidSoFar !== undefined ? (
                                                        <span className="text-sm text-slate-900">
                                                            ₹{parsePaidAmount(payment.totalPaidSoFar).toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.paymentMode ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800">
                                                            {payment.paymentMode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.transaction_id ? (
                                                        <div className="text-sm text-slate-700 font-mono break-all">
                                                            {payment.transaction_id}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.denomination ? (
                                                        <div className="text-sm text-slate-700 font-mono break-all">
                                                            {payment.denomination}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {payment.posReceiptUrl ? (
                                                        <a href={payment.posReceiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                            View
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                            <svg
                                className="w-12 h-12 text-slate-400 mx-auto mb-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-slate-600 font-medium">No payment history found</p>
                            <p className="text-slate-500 text-sm mt-1">
                                No payments have been recorded for this billing yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
