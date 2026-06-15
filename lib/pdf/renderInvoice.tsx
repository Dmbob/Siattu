import { renderToBuffer } from '@react-pdf/renderer';
import { InvoiceDocument } from '@/lib/pdf/InvoiceDocument';
import type { InvoiceDetail } from '@/lib/service/InvoiceService';

/** Render an invoice to a PDF buffer (server-only — uses @react-pdf/renderer). */
export function renderInvoicePdf(detail: InvoiceDetail): Promise<Buffer> {
    return renderToBuffer(<InvoiceDocument detail={detail} />);
}
