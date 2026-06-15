import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { InvoiceService } from "@/lib/service/InvoiceService";
import { renderInvoicePdf } from "@/lib/pdf/renderInvoice";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const detail = await new InvoiceService().getDetail(session.user.id, id);
    if (!detail) return new Response("Not found", { status: 404 });

    const pdf = await renderInvoicePdf(detail);
    return new Response(new Uint8Array(pdf), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="invoice-${detail.invoiceNumber}.pdf"`,
            "Cache-Control": "private, no-store",
        },
    });
}
