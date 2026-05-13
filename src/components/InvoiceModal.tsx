import { useRef } from 'react';
import nammaqaLogo from '../assets/nammaqa.jpg';

export interface InvoiceItem {
    name: string;
    fee: number;
}

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    candidateLocation: string;
    invoiceNumber: string;
    invoiceDate: string;
    items: InvoiceItem[];
    discount: number;
    amountPaid: number;
    balance: number;
    totalAmount?: number;
}


export default function InvoiceModal({
    isOpen, onClose,
    candidateName, candidateEmail, candidatePhone, candidateLocation,
    invoiceNumber, invoiceDate,
    items, amountPaid, balance, totalAmount,
}: InvoiceModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Check if this is a payment history invoice (transaction receipt)
    const isPaymentHistory = invoiceNumber.startsWith('TXN-');

    // Total amount is either passed down or derived from the line item values.
    const subTotal = items.reduce((s, i) => s + i.fee, 0);
    const invoiceTotalAmount = typeof totalAmount === 'number' ? totalAmount : subTotal;
    const totalPackageCost = invoiceTotalAmount;

    let itemsWithTax: Array<InvoiceItem & { cgst: number; sgst: number; amount: number }> = items.map(item => ({
        ...item,
        cgst: 0,
        sgst: 0,
        amount: item.fee,
    }));

    const handleDownload = () => {
        const html = printRef.current?.innerHTML ?? '';
        const win = window.open('', '_blank', 'width=950,height=800');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoiceNumber}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#fff;color:#1e293b;}
body{font-family:Arial,sans-serif;font-size:12px;padding:24px;}
.page{background:#fff;width:100%;max-width:900px;margin:0 auto;padding:32px;border-radius:0;box-shadow:none;}
.logo-row{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.logo-text{font-size:24px;font-weight:900;letter-spacing:-0.5px}
.logo-qa{color:#f97316}.logo-namma{color:#4f46e5}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
.tax-title{font-size:32px;font-weight:900;letter-spacing:-1px}
.company-info{font-size:11px;color:#475569;line-height:1.8}
.company-name{font-size:13px;font-weight:700;margin-bottom:6px}
.addresses{display:flex;gap:48px;margin-bottom:24px}
.addr-block h3{font-size:12px;font-weight:700;margin-bottom:8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
.addr-block p{font-size:11.5px;color:#334155;line-height:1.8}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
.meta-table th{background:#1e293b;color:#fff;padding:9px 12px;font-size:10.5px;text-align:left}
.meta-table td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:11.5px}
.items-table th{background:#1e293b;color:#fff;padding:9px 12px;font-size:10.5px}
.items-table td{padding:9px 12px;border-bottom:1px solid #e2e8f0;font-size:11.5px}
.items-table tr:nth-child(even) td{background:#f8fafc}
.tr{text-align:right}.tc{text-align:center}
.totals{display:flex;justify-content:flex-end;margin-bottom:32px}
.totals-inner{width:320px}
.tot-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:1px solid #f1f5f9}
.tot-row.bold{font-weight:700;font-size:13px;border-top:2px solid #1e293b;border-bottom:none;padding-top:8px}
.words-box{background:#f8fafc;border-radius:6px;padding:10px;font-size:11px;display:flex;gap:6px;margin-top:10px}
.terms{font-size:10.8px;color:#475569;line-height:1.7;border-top:1px solid #e2e8f0;padding-top:18px;margin-top:18px}
.terms h3{font-size:12px;font-weight:700;margin-bottom:8px}
.footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0}
.bank-info p{font-size:11.5px;line-height:1.9;color:#334155}
.bank-title{font-size:12px;font-weight:700;margin-bottom:8px}
.sig{text-align:center}
.sig-name{font-size:22px;font-family:'Brush Script MT',cursive;color:#1e293b;margin-bottom:4px}
.sig-label{font-size:10px;color:#64748b;border-top:1px solid #94a3b8;padding-top:4px}
.status-badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:600}
.paid{background:#dcfce7;color:#15803d}.partial{background:#fef9c3;color:#92400e}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}} 
@page{margin:20mm;}
</style></head><body><div class="page">${html}</div></body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    };

    const statusLabel = balance <= 0 ? 'PAID' : 'PARTIALLY PAID';

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '32px 16px' }}>
            {/* Action bar */}
            <div style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 60 }}>
                <button onClick={handleDownload} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 20px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⬇ Download / Print
                </button>
                <button onClick={onClose} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ✕ Close
                </button>
            </div>

            {/* Invoice paper */}
            <div ref={printRef} style={{ background: '#fff', width: '100%', maxWidth: 860, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '48px 56px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>

                {/* Header */}
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <div className="logo-row" style={{ marginBottom: 14 }}>
                            <img src={nammaqaLogo} alt="NammaQA" style={{ height: 52, objectFit: 'contain', display: 'block' }} />
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>NammaQA Training Community</div>
                        <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.8 }}>
                            1st Floor, #940, above Skanda Interiors,<br />
                            near Deepa Complex, Papreddy Palya, 2nd Stage,<br />
                            Naagarabhaavi, Bengaluru, Karnataka 560072<br />
                            Phone: 076764 01716<br />
                            contact@nammaqa.com · www.nammaqa.com<br />
                            GSTIN: 29ABCDE1234F2Z5
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>{isPaymentHistory ? 'PAYMENT RECEIPT' : 'TAX INVOICE'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{isPaymentHistory ? 'Transaction# ' : 'Invoice# '}<strong style={{ color: '#1e293b' }}>{invoiceNumber}</strong></div>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />

                {/* Bill To */}
                <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>Bill To</div>
                        <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.8 }}>
                            <strong>{candidateName}</strong><br />
                            {candidateLocation}<br />
                            {candidateEmail}<br />
                            {candidatePhone}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>Place of Supply</div>
                        <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.8 }}>Karnataka, India</div>
                    </div>
                </div>

                {/* Meta table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: '#fff' }}>
                            {['Invoice Date', 'Terms', 'Due Date', 'Status'].map(h => (
                                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 600 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '9px 12px', fontSize: 11.5, borderBottom: '1px solid #e2e8f0' }}>{invoiceDate}</td>
                            <td style={{ padding: '9px 12px', fontSize: 11.5, borderBottom: '1px solid #e2e8f0' }}>DUE ON RECEIPT</td>
                            <td style={{ padding: '9px 12px', fontSize: 11.5, borderBottom: '1px solid #e2e8f0' }}>{invoiceDate}</td>
                            <td style={{ padding: '9px 12px', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ background: balance <= 0 ? '#dcfce7' : '#fef9c3', color: balance <= 0 ? '#15803d' : '#92400e', padding: '2px 10px', borderRadius: 99, fontWeight: 600, fontSize: 10.5 }}>
                                    {statusLabel}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Line items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: '#fff' }}>
                            {isPaymentHistory ? (
                                ['#', 'Item & Description', 'Qty', 'Amount'].map((h, i) => (
                                    <th key={h} style={{ padding: '9px 12px', fontSize: 10.5, fontWeight: 600, textAlign: i === 0 ? 'center' : i === 1 ? 'left' : 'right' }}>{h}</th>
                                ))
                            ) : (
                                ['#', 'Item & Description', 'Qty', 'Rate', 'CGST (9%)', 'SGST (9%)', 'Amount'].map((h, i) => (
                                    <th key={h} style={{ padding: '9px 12px', fontSize: 10.5, fontWeight: 600, textAlign: i === 0 ? 'center' : i === 1 ? 'left' : 'right' }}>{h}</th>
                                ))
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {itemsWithTax.map((item, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: 11.5, borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>{idx + 1}</td>
                                <td style={{ padding: '9px 12px', fontSize: 11.5, borderBottom: '1px solid #e2e8f0', fontWeight: 500 }}>{item.name}</td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, borderBottom: '1px solid #e2e8f0' }}>1.00</td>
                                {isPaymentHistory ? (
                                    <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>₹{item.amount.toFixed(2)}</td>
                                ) : (
                                    <>
                                        <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, borderBottom: '1px solid #e2e8f0' }}>₹{item.fee.toFixed(2)}</td>
                                        <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>₹{item.cgst.toFixed(2)}</td>
                                        <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>₹{item.sgst.toFixed(2)}</td>
                                        <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: 11.5, borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>₹{item.amount.toFixed(2)}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
                    <div style={{ width: 320 }}>
                        {[
                            { label: 'Package Total Amount', value: `₹${totalPackageCost.toFixed(2)}` },
                        ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#475569' }}>{r.label}</span>
                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{r.value}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 6px', fontSize: 14, borderTop: '2px solid #1e293b', marginTop: 8 }}>
                            <span style={{ fontWeight: 700 }}>{isPaymentHistory ? 'Total amount paid' : 'Amount Paid'}</span>
                            <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{amountPaid.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 14, borderTop: '2px solid #1e293b', marginTop: 6 }}>
                            <span style={{ fontWeight: 700 }}>{isPaymentHistory ? 'Balance' : 'Balance Amount'}</span>
                            <span style={{ fontWeight: 800, color: balance > 0 ? '#dc2626' : '#16a34a' }}>₹{balance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: 13, color: '#475569', marginBottom: 24 }}>Thanks for your business.</div>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />

                <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.7, marginBottom: 24, padding: '18px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Terms & Conditions</div>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                        <li>Payment is due immediately on receipt of this invoice.</li>
                        <li>Courses once scheduled cannot be cancelled without prior notice.</li>
                        <li>Any dispute shall be subject to Bengaluru jurisdiction only.</li>
                        <li>All services are delivered as per the training agreement.</li>
                    </ul>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Payment Details</div>
                        <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.9 }}>
                            <strong>NammaQA Training Community</strong><br />
                            State Bank of India<br />
                            Bank A/C No: 00000042985985552<br />
                            IFSC Code: SBIN0016225
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 26, fontFamily: "'Brush Script MT', cursive", color: '#1e293b', marginBottom: 4 }}>NammaQA</div>
                        <hr style={{ border: 'none', borderTop: '1px solid #94a3b8', marginBottom: 6 }} />
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>Authorized Signature</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
