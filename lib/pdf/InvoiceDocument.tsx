import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatUSD } from '@/lib/money';
import { sumEntryLineTotals } from '@/lib/models/InvoiceEntry';
import { collapseEntriesIntoInvoiceLines } from '@/lib/models/InvoiceGroup';
import type { InvoiceDetail, InvoiceDetailEntry } from '@/lib/service/InvoiceService';

const styles = StyleSheet.create({
    page: { paddingVertical: 48, paddingHorizontal: 48, fontSize: 10, color: '#212529', fontFamily: 'Helvetica' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 },
    invoiceNo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0d6efd' },
    invoiceDate: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#212529' },
    parties: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
    party: { width: '48%' },
    partyLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#6c757d', marginBottom: 4 },
    labelRight: { textAlign: 'right' },
    partyName: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginBottom: 2 },
    line: { color: '#495057', lineHeight: 0.75 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: '#0d6efd' },
    tableHead: {
        flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#212529',
        paddingBottom: 6, marginBottom: 4, fontFamily: 'Helvetica-Bold', fontSize: 9,
    },
    row: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#dee2e6' },
    cDesc: { width: '58%' },
    cQty: { width: '12%', textAlign: 'right' },
    cRate: { width: '15%', textAlign: 'right' },
    cAmt: { width: '15%', textAlign: 'right' },
    totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
    totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 11, marginRight: 16 },
    totalValue: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#0d6efd', width: '15%', textAlign: 'right' },
    paidBadge: {
        marginTop: 8, alignSelf: 'flex-end', color: '#198754',
        fontFamily: 'Helvetica-Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1,
    },
});

function fmtDate(d: Date): string {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function AddressBlock({ name, street1, street2, city, region, postalCode, align }: {
    name: string; street1: string; street2: string | null; city: string; region: string; postalCode: string;
    align?: 'left' | 'right';
}) {
    const a: { textAlign: 'left' | 'right' } = { textAlign: align === 'right' ? 'right' : 'left' };
    return (
        <View>
            <Text style={[styles.partyName, a]}>{name}</Text>
            <Text style={[styles.line, a]}>{street1}</Text>
            {street2 ? <Text style={[styles.line, a]}>{street2}</Text> : null}
            <Text style={[styles.line, a]}>{city}, {region} {postalCode}</Text>
        </View>
    );
}

/** A titled table of line items of one entry type, with its own total. */
function EntrySection({ title, entries }: { title: string; entries: InvoiceDetailEntry[] }) {
    if (entries.length === 0) return null;
    return (
        <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.tableHead}>
                <Text style={styles.cDesc}>Description</Text>
                <Text style={styles.cQty}>Qty</Text>
                <Text style={styles.cRate}>Rate</Text>
                <Text style={styles.cAmt}>Amount</Text>
            </View>
            {collapseEntriesIntoInvoiceLines(entries).map((line) => (
                <View style={styles.row} key={line.key}>
                    <Text style={styles.cDesc}>{line.description}</Text>
                    <Text style={styles.cQty}>{line.quantityIsHours ? `${line.quantity} h` : line.quantity}</Text>
                    <Text style={styles.cRate}>{line.rateDisplay}</Text>
                    <Text style={styles.cAmt}>{formatUSD(line.amount)}</Text>
                </View>
            ))}
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatUSD(sumEntryLineTotals(entries))}</Text>
            </View>
        </View>
    );
}

export function InvoiceDocument({ detail }: { detail: InvoiceDetail }) {
    const { customer, serviceProvider: sp } = detail;
    const billable = detail.entries.filter((e) => e.type !== 'software');
    const software = detail.entries.filter((e) => e.type === 'software');
    return (
        <Document title={`Invoice ${detail.invoiceNumber}`}>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.invoiceNo}>INVOICE #{detail.invoiceNumber}</Text>
                    <Text style={styles.invoiceDate}>{fmtDate(detail.date)}</Text>
                </View>

                <View style={styles.parties}>
                    <View style={styles.party}>
                        <Text style={styles.partyLabel}>From</Text>
                        <AddressBlock
                            name={`${sp.firstName} ${sp.lastName}`}
                            street1={sp.address.street1}
                            street2={sp.address.street2}
                            city={sp.address.city}
                            region={sp.address.region}
                            postalCode={sp.address.postalCode}
                        />
                    </View>
                    <View style={styles.party}>
                        <Text style={[styles.partyLabel, styles.labelRight]}>Bill To</Text>
                        <AddressBlock
                            name={customer.name}
                            street1={customer.address.street1}
                            street2={customer.address.street2}
                            city={customer.address.city}
                            region={customer.address.region}
                            postalCode={customer.address.postalCode}
                            align="right"
                        />
                    </View>
                </View>

                <EntrySection title="Billable Work" entries={billable} />
                <EntrySection title="Software/Licenses" entries={software} />

                {detail.status === 'paid' ? <Text style={styles.paidBadge}>Paid</Text> : null}
            </Page>
        </Document>
    );
}
