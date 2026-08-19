import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import nammaqaLogo from '../assets/nammaqa.jpeg';
import karthikcsLogo from '../assets/karthikcs.png';

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
    showInvoiceNumber?: boolean;
    items: InvoiceItem[];
    discount: number;
    amountPaid: number;
    balance: number;
    totalAmount?: number;
}


export default function InvoiceModal({
    isOpen, onClose,
    candidateName, candidateEmail, candidatePhone, candidateLocation,
    invoiceNumber, invoiceDate, showInvoiceNumber = false,
    items, amountPaid, balance, totalAmount, discount
}: InvoiceModalProps) {
    const printRef = useRef<HTMLDivElement>(null);
    const termsRef = useRef<HTMLDivElement>(null);

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

    const handleDownload = async () => {
        if (!printRef.current || !termsRef.current) return;

        const receiptCanvas = await html2canvas(printRef.current, {
            backgroundColor: '#ffffff',
            useCORS: true,
            scale: 2,
            onclone: clonedDocument => {
                clonedDocument.querySelector('.second-page')?.remove();
                clonedDocument.querySelector('.footer')?.remove();
            },
        });
        const termsCanvas = await html2canvas(termsRef.current, {
            backgroundColor: '#ffffff',
            useCORS: true,
            scale: 2,
        });

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const addCanvasPages = (canvas: HTMLCanvasElement, addNewPage: boolean) => {
            if (addNewPage) pdf.addPage();

            const imgData = canvas.toDataURL('image/png');
            const imageHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imageHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imageHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imageHeight);
                heightLeft -= pageHeight;
            }
        };

        addCanvasPages(receiptCanvas, false);
        addCanvasPages(termsCanvas, true);

        pdf.save(`${invoiceNumber || 'invoice'}.pdf`);
    };

    const handlePrint = () => {
        const html = printRef.current?.innerHTML ?? '';
        const win = window.open('', '_blank', 'width=950,height=800');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>${isPaymentHistory ? 'Payment Receipt' : 'Tax Invoice'}</title>
    <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{background:#fff;color:#1e293b;}
    body{font-family:Arial,sans-serif;font-size:11px;padding:12px;}
    .page{background:#fff;width:100%;max-width:100%;margin:0 auto;padding:20px;border-radius:0;box-shadow:none;}
    .logo-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    .logo-text{font-size:11px;font-weight:900;letter-spacing:-0.5px}
    .logo-qa{color:#f97316}.logo-namma{color:#4f46e5}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
    .tax-title{font-size:28px;font-weight:900;letter-spacing:-1px}
    .company-info{font-size:10px;color:#475569;line-height:1.5}
    .company-name{font-size:12px;font-weight:700;margin-bottom:6px}
    .addresses{display:flex;gap:32px;margin-bottom:18px}
    .addr-block h3{font-size:11px;font-weight:700;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
    .addr-block p{font-size:10px;color:#334155;line-height:1.5}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    .meta-table th{background:#f97316;color:#fff;padding:8px 10px;font-size:10px;text-align:left}
    .meta-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:10px}
    .items-table th{background:#f97316;color:#fff;padding:8px 10px;font-size:10px}
    .items-table td{padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:10px}
    .items-table tr:nth-child(even) td{background:#f8fafc}
    .tr{text-align:right}.tc{text-align:center}
    .totals{display:flex;justify-content:flex-end;margin-bottom:26px}
    .totals-inner{width:300px}
    .tot-row{display:flex;justify-content:space-between;padding:4px 0;font-size:11px;border-bottom:1px solid #f1f5f9}
    .tot-row.bold{font-weight:700;font-size:12px;border-top:2px solid #f97316;border-bottom:none;padding-top:6px}
    .words-box{background:#f8fafc;border-radius:6px;padding:8px;font-size:10px;display:flex;gap:6px;margin-top:10px}
    .second-page{page-break-before:always;break-before:page;page-break-inside:avoid;}
    .terms{font-size:10px;color:#475569;line-height:1.4;border-top:1px solid #e2e8f0;padding-top:14px;margin-top:14px;}
    .terms h3{font-size:11px;font-weight:700;margin-bottom:8px}
    .terms ol{margin:0;padding-left:14px}
    .terms li{margin-bottom:0.35em}
    .footer{display:flex;justify-content:flex-end;align-items:flex-end;margin-top:16px;padding-top:18px;border-top:1px solid #e2e8f0;page-break-inside:avoid;}
    .bank-info p{font-size:10px;line-height:1.5;color:#334155}
    .bank-title{font-size:11px;font-weight:700;margin-bottom:6px}
    .sig{text-align:center}
    .sig-name{font-size:20px;font-family:'Brush Script MT',cursive;color:#1e293b;margin-bottom:4px}
    .sig-label{font-size:10px;color:#64748b;border-top:1px solid #94a3b8;padding-top:4px}
    .status-badge{display:inline-block;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:600}
    .paid{background:#dcfce7;color:#15803d}.partial{background:#fef9c3;color:#92400e}
    @media print{
      body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .page{box-shadow:none;border-radius:0;}
      .terms{padding:12px;}
      .footer{padding-top:12px;}
    }
    @page{size:A4 portrait;margin:12mm;}
    </style></head><body><div class="page">${html}</div></body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    };

    const statusLabel = balance <= 0 ? 'PAID' : 'PARTIALLY PAID';
    const shouldShowInvoiceNumber = showInvoiceNumber && Boolean(invoiceNumber);
    const metaHeaders = ['Invoice Date', 'Status'];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 12, padding: '32px 16px' }}>
            {/* Actions stay outside the invoice paper and stack vertically. */}
            <div style={{ order: 2, position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 10, width: 150, flexShrink: 0, zIndex: 60 }}>
                <button onClick={handleDownload} style={{ width: '100%', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    ⬇ Download PDF
                </button>
                <button onClick={handlePrint} style={{ width: '100%', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    🖨 Print
                </button>
                <button onClick={onClose} style={{ width: '100%', background: '#374151', color: '#fff', border: 'none', borderRadius: 999, padding: '11px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    ✕ Close
                </button>
            </div>

            {/* Invoice paper */}
            <div ref={printRef} style={{ order: 1, background: '#fff', width: '100%', maxWidth: 960, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '48px 56px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>

                {/* Header */}
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                    <div>
                        <div className="logo-row" style={{ marginBottom: 10 }}>
                            <img src={nammaqaLogo} alt="NammaQA" style={{ width: 190, height: 'auto', objectFit: 'contain', display: 'block' }} />
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, fontWeight: 700 }}>
                            1st Floor, #940, above Skanda Interiors,<br />
                            near Deepa Complex, Papreddy Palya, 2nd Stage,<br />
                            Naagarabhaavi, Bengaluru, Karnataka 560072<br />
                            GSTIN: 29AADCW7843F1ZY
                        </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8 }}>{isPaymentHistory ? 'PAYMENT RECEIPT' : 'PAYMENT RECEIPT'}</div>
                        {shouldShowInvoiceNumber && (
                            <div style={{ fontSize: 16, fontWeight: 700 }}>Invoice Number: {invoiceNumber}</div>
                        )}
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />

                {/* Bill To (Place of Supply removed for download) */}
                <div style={{ display: 'flex', gap: 48, marginBottom: 24 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>Bill To</div>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
                            <strong>{candidateName}</strong><br />
                            {candidateLocation}<br />
                            {candidateEmail}<br />
                            {candidatePhone}
                        </div>
                    </div>
                </div>

                {/* Meta table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: '#fff' }}>
                            {metaHeaders.map(h => (
                                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '9px 12px', fontSize: 13, borderBottom: '1px solid #e2e8f0' }}>{invoiceDate}</td>
                            <td style={{ padding: '9px 12px', borderBottom: '1px solid #e2e8f0' }}>
                                <span style={{ display: 'inline-block', background: balance <= 0 ? '#dcfce7' : '#fef9c3', color: balance <= 0 ? '#15803d' : '#92400e', padding: '3px 10px', borderRadius: 99, fontWeight: 600, fontSize: 12, lineHeight: 1.4 }}>
                                    {statusLabel}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Line items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, tableLayout: 'fixed' }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: '#fff' }}>
                            {['#', 'Courses selected', 'Amount'].map((h, i) => (
                                <th key={h} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, textAlign: i === 0 ? 'center' : i === 1 ? 'left' : 'right', width: i === 0 ? 50 : i === 2 ? 140 : 'auto' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {itemsWithTax.map((item, idx) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 13, borderBottom: '1px solid #e2e8f0', color: '#64748b', width: 50 }}>{idx + 1}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'left', fontSize: 13, borderBottom: '1px solid #e2e8f0', fontWeight: 500, width: 'calc(100% - 190px)' }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, borderBottom: '1px solid #e2e8f0', fontWeight: 600, width: 140 }}>₹{item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
                    <div style={{ width: 320 }}>
                        {[
                            { label: 'Package Total Amount', value: `₹${totalPackageCost.toFixed(2)}` },
                            ...(discount > 0 ? [{ label: 'Discount', value: `-₹${discount.toFixed(2)}`, color: '#16a34a' }] : []),
                        ].map(r => (
                            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 15, borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#475569' }}>{r.label}</span>
                                <span style={{ fontWeight: 700, color: r.color || '#1e293b' }}>{r.value}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 6px', fontSize: 15, borderTop: '2px solid #1e293b', marginTop: 8 }}>
                            <span style={{ color: '#475569' }}>Base Amount (Paid)</span>
                            <span style={{ fontWeight: 700 }}>₹{(amountPaid / 1.18).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15, borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ color: '#475569' }}>CGST (9%)</span>
                            <span style={{ fontWeight: 700 }}>₹{((amountPaid / 1.18) * 0.09).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 15, borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ color: '#475569' }}>SGST (9%)</span>
                            <span style={{ fontWeight: 700 }}>₹{((amountPaid / 1.18) * 0.09).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 6px', fontSize: 16, borderTop: '2px solid #1e293b', marginTop: 8 }}>
                            <span style={{ fontWeight: 700 }}>Amount Paid</span>
                            <span style={{ fontWeight: 800, color: '#16a34a' }}>₹{amountPaid.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, borderTop: '2px solid #1e293b', marginTop: 6 }}>
                            <span style={{ fontWeight: 700 }}>{isPaymentHistory ? 'Balance' : 'Balance Amount'}</span>
                            <span style={{ fontWeight: 800, color: balance > 0 ? '#dc2626' : '#16a34a' }}>₹{balance.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: 24 }} />

                {/*
                  termsRef now wraps BOTH the terms box and the signature footer, and carries its
                  own page padding. html2canvas crops tightly to whatever element it is given, so
                  without this wrapper padding the terms box (and the signature below it) were
                  rendered flush against the edges of the captured canvas in the PDF, unlike the
                  live preview where printRef's own padding supplied the surrounding gap.
                */}
                <div ref={termsRef} style={{ background: '#fff', padding: '40px 56px 56px' }}>
                    <div className="second-page">
                        <div className="terms" style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 32, padding: '18px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Terms & Conditions</div>
                            <ol style={{ paddingLeft: 18, margin: 0 }}>
                                <li><strong>Non-Refundable Policy:</strong> All payments made towards any NammaQA training program, event, or course are strictly non-refundable under any circumstances, including withdrawal, absenteeism, course discontinuation, or personal reasons. Refund requests will not be entertained.</li>
                                <li><strong>Non-Transferrable Admission:</strong> Enrollment is non-transferable. Course access, registration benefits, or privileges cannot be transferred, shared, or sold to any other individual or entity under any circumstances.</li>
                                <li><strong>Attendance and Participation Compliance:</strong> Every enrolled candidate is required to maintain a minimum of 80% attendance and participate actively in all assigned sessions, projects, and activities. Failure to comply will result in withholding of certificates or discontinuation without refund.</li>
                                <li><strong>Mock Interview Mandate:</strong> Participation in at least one official Mock Interview organized by NammaQA is mandatory for all enrolled candidates. Certification and placement assistance will be processed only after successful completion of the mock evaluation.</li>
                                <li><strong>Code of Conduct and Disciplinary Action:</strong> Any act of misbehavior, misconduct, use of abusive language, harassment, or disrespect towards trainers, coordinators, management, or fellow participants will lead to immediate expulsion from the course. Fees paid will be forfeited in full. Legal action may be initiated if the act involves defamation, disruption, or damage to the reputation of NammaQA or WizzyBox Private Limited.</li>
                                <li><strong>Intellectual Property Protection:</strong> All training content, course materials, and digital resources are proprietary assets of NammaQA. Unauthorized recording, duplication, distribution, or sharing (online/offline) is strictly prohibited and will invite legal consequences.</li>
                                <li><strong>Batch and Schedule Policy:</strong> Once a batch is allotted, requests for change of batch, trainer, or schedule will not be accepted unless approved by management under exceptional cases.</li>
                                <li><strong>Fee Payment Obligation:</strong> Fees must be paid in full as per the scheduled installments before or on the due date. Delay or default in payment will result in suspension of classes, and certificates will be withheld until dues are cleared.</li>
                                <li><strong>Certification Policy:</strong> Certificates will be issued only upon satisfactory completion of the course, successful mock interview performance, and clearance of all outstanding payments. The management reserves the right to withhold or cancel certificates in case of violation of any terms.</li>
                                <li><strong>No Recording or Distribution Policy:</strong> Candidates are strictly prohibited from recording online or offline sessions, taking screenshots, or redistributing class materials. Violation of this policy will result in immediate expulsion and legal proceedings.</li>
                                <li><strong>Management Rights:</strong> NammaQA and WizzyBox Private Limited reserve full rights to modify the course structure, schedule, or trainer allocation; reject or cancel admissions at any stage; and take disciplinary action for violations or misconduct without refund.</li>
                                <li><strong>Confidentiality and Privacy:</strong> All candidate data collected by NammaQA will be used solely for administrative and academic purposes. Misuse of internal data or group communication channels is strictly prohibited.</li>
                                <li><strong>Guarantee of Placement:</strong> Placement or internship assistance is provided as a value-added service and does not constitute a job guarantee. Candidates are responsible for attending interviews and following up professionally.</li>
                            </ol>
                        </div>
                    </div>

                    {/* Footer now lives inside termsRef so it is actually captured for the PDF's second page */}
                    <div className="footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', pageBreakInside: 'avoid', marginTop: 24, paddingTop: 20, paddingBottom: 8, borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ textAlign: 'center', width: 220 }}>
                            <img src={karthikcsLogo} alt="Authorized Signature" style={{ height: 48, objectFit: 'contain', display: 'block', margin: '0 auto 6px' }} />
                            <hr style={{ border: 'none', borderTop: '1px solid #94a3b8', marginBottom: 6 }} />
                            <div style={{ fontSize: 12, color: '#64748b' }}>Authorized Signature</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}