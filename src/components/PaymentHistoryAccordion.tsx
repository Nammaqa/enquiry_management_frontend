import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import type { BillingPaymentHistory } from '../types';

interface PaymentHistoryAccordionProps {
    billingId?: number;
    onInvoiceView?: (payment: BillingPaymentHistory) => void;
    refreshTrigger?: number; // Trigger to refresh payment history (e.g., after payment)
}

export default function PaymentHistoryAccordion({
    billingId,
    onInvoiceView,
    refreshTrigger = 0,
}: PaymentHistoryAccordionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<BillingPaymentHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-fetch when component mounts or refreshTrigger changes
    useEffect(() => {
        fetchPaymentHistory();
    }, [billingId, refreshTrigger]);

    const fetchPaymentHistory = async () => {
        if (!billingId) return;

        setLoading(true);
        setError(null);
        try {
            const response = await apiRequest<BillingPaymentHistory[] | { paymentHistory: BillingPaymentHistory[] }>(
                `/api/billings/${billingId}/payment-history`,
                { method: 'GET' }
            );
            const historyData = Array.isArray(response) ? response : (response as any)?.paymentHistory || [];
            setPaymentHistory(historyData);
        } catch (err) {
            console.error('Error fetching payment history:', err);
            setError('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(num);
    };

    const downloadInvoice = (payment: BillingPaymentHistory) => {
        // This can be extended to generate an actual invoice
        // For now, it can trigger the InvoiceModal through the callback
        if (onInvoiceView) {
            onInvoiceView(payment);
        } else {
            alert(`Invoice for Transaction ID: ${payment.transaction_id || 'N/A'} - Date: ${formatDate(payment.createdAt)}`);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            {/* Accordion Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Payment History</h3>
                    <p className="text-sm text-slate-500 mt-1">View all transactions and download invoices</p>
                </div>
                <div className="flex items-center gap-3">
                    {!loading && paymentHistory.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {paymentHistory.length} payment{paymentHistory.length !== 1 ? 's' : ''}
                        </span>
                    )}
                    <span className="text-2xl font-bold text-slate-400">{isExpanded ? '-' : '+'}</span>
                </div>
            </button>

            {/* Accordion Content */}
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-slate-200 bg-white">
                    {loading && paymentHistory.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
                                <p className="text-sm text-slate-500">Loading payment history...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                            {error}
                        </div>
                    ) : paymentHistory.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-6 text-center">
                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-slate-600 font-medium">No payments recorded yet</p>
                            <p className="text-xs text-slate-500 mt-1">Payment history will appear here once transactions are made</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentHistory.map((payment, index) => (
                                <div key={payment.id || index} className="rounded-3xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold text-slate-900">
                                                    Amount: {formatCurrency(payment.amountPaid)}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    payment.paymentMode === 'UPI'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : payment.paymentMode === 'CARD'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : payment.paymentMode === 'CASH'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {payment.paymentMode || 'Unknown'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600">
                                                📅 {formatDate(payment.createdAt)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => downloadInvoice(payment)}
                                            title="Download tax invoice"
                                            className="inline-flex items-center gap-2 rounded-3xl border border-indigo-300 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Tax Invoice
                                        </button>
                                    </div>
                                    
                                    {payment.transaction_id && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-xs text-slate-600">
                                                <span className="font-medium">Transaction ID:</span>
                                                <span className="text-slate-900 ml-2 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded">
                                                    {payment.transaction_id}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    
                                    {payment.denomination && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-xs text-slate-600">
                                                <span className="font-medium">Denomination:</span>
                                                <span className="text-slate-900 ml-2 font-mono text-[11px] bg-slate-100 px-2 py-1 rounded">
                                                    {payment.denomination}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    
                                    {payment.posReceiptUrl && (
                                        <div className="mt-3 pt-3 border-t border-slate-200">
                                            <p className="text-xs text-slate-600 flex items-center">
                                                <span className="font-medium">POS Receipt:</span>
                                                <a href={payment.posReceiptUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    View Document
                                                </a>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
