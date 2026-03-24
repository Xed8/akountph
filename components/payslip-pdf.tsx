'use client'

import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink,
} from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 12 },
  orgName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#6b7280' },
  title: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 12, marginTop: 4 },
  empRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#6b7280', width: 120 },
  value: { flex: 1 },
  section: { marginTop: 14, marginBottom: 6 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', paddingBottom: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 },
  rowLabel: { flex: 1 },
  rowValue: { width: 80, textAlign: 'right', fontFamily: 'Helvetica' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderTopWidth: 0.5, borderTopColor: '#111', marginTop: 4 },
  totalLabel: { flex: 1, fontFamily: 'Helvetica-Bold' },
  totalValue: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f3f4f6', padding: 6, marginTop: 8, borderRadius: 3 },
  netLabel: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  netValue: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  footer: { marginTop: 24, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9ca3af' },
  mweNote: { backgroundColor: '#fef9c3', padding: 6, borderRadius: 3, marginTop: 8 },
})

function peso(centavos: number) {
  return `₱${(centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export interface PayslipData {
  org: { name: string; tin: string | null; address: string | null }
  employee: { first_name: string; last_name: string; middle_name: string | null; position: string | null; sss_number: string | null; philhealth_number: string | null; pagibig_number: string | null; tin: string | null; tax_status: string }
  item: {
    basic_salary: number; allowances: number; gross_pay: number
    sss_ee: number; sss_er: number; sss_ec: number; sss_msc: number
    ph_ee: number; ph_er: number
    pi_ee: number; pi_er: number
    withholding_tax: number; total_deductions: number; net_pay: number
    taxable_income: number; is_mwe: boolean
  }
  run: { period_label: string; pay_date: string | null }
}

function PayslipDocument({ data }: { data: PayslipData }) {
  const { org, employee, item, run } = data
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.orgName}>{org.name}</Text>
          {org.tin && <Text style={styles.subtitle}>TIN: {org.tin}</Text>}
          {org.address && <Text style={styles.subtitle}>{org.address}</Text>}
        </View>

        <Text style={styles.title}>PAYSLIP — {run.period_label.toUpperCase()}</Text>
        {run.pay_date && <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 10 }}>Pay Date: {run.pay_date}</Text>}

        {/* Employee Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.empRow}><Text style={styles.label}>Name</Text><Text style={styles.value}>{employee.last_name}, {employee.first_name}{employee.middle_name ? ` ${employee.middle_name[0]}.` : ''}</Text></View>
          {employee.position && <View style={styles.empRow}><Text style={styles.label}>Position</Text><Text style={styles.value}>{employee.position}</Text></View>}
          <View style={styles.empRow}><Text style={styles.label}>Tax Status</Text><Text style={styles.value}>{employee.tax_status}{item.is_mwe ? ' (Minimum Wage Earner)' : ''}</Text></View>
          {employee.tin && <View style={styles.empRow}><Text style={styles.label}>TIN</Text><Text style={styles.value}>{employee.tin}</Text></View>}
          {employee.sss_number && <View style={styles.empRow}><Text style={styles.label}>SSS No.</Text><Text style={styles.value}>{employee.sss_number}</Text></View>}
          {employee.philhealth_number && <View style={styles.empRow}><Text style={styles.label}>PhilHealth No.</Text><Text style={styles.value}>{employee.philhealth_number}</Text></View>}
          {employee.pagibig_number && <View style={styles.empRow}><Text style={styles.label}>Pag-IBIG No.</Text><Text style={styles.value}>{employee.pagibig_number}</Text></View>}
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Basic Salary</Text><Text style={styles.rowValue}>{peso(item.basic_salary)}</Text></View>
          {item.allowances > 0 && <View style={styles.row}><Text style={styles.rowLabel}>Allowances</Text><Text style={styles.rowValue}>{peso(item.allowances)}</Text></View>}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Gross Pay</Text><Text style={styles.totalValue}>{peso(item.gross_pay)}</Text></View>
        </View>

        {/* Deductions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>SSS Contribution (EE)</Text>
            <Text style={{ width: 80, textAlign: 'right', fontSize: 8, color: '#6b7280' }}>MSC: {peso(item.sss_msc)}</Text>
            <Text style={styles.rowValue}>{peso(item.sss_ee)}</Text>
          </View>
          <View style={styles.row}><Text style={styles.rowLabel}>PhilHealth Premium (EE)</Text><Text style={styles.rowValue}>{peso(item.ph_ee)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Pag-IBIG Contribution (EE)</Text><Text style={styles.rowValue}>{peso(item.pi_ee)}</Text></View>
          {!item.is_mwe && <View style={styles.row}><Text style={styles.rowLabel}>Withholding Tax</Text><Text style={styles.rowValue}>{peso(item.withholding_tax)}</Text></View>}
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Deductions</Text><Text style={styles.totalValue}>{peso(item.total_deductions)}</Text></View>
        </View>

        {item.is_mwe && (
          <View style={styles.mweNote}>
            <Text style={{ fontSize: 8 }}>Minimum Wage Earner — exempt from income tax (TRAIN Law)</Text>
          </View>
        )}

        {/* Net Pay */}
        <View style={styles.netRow}>
          <Text style={styles.netLabel}>NET PAY</Text>
          <Text style={styles.netValue}>{peso(item.net_pay)}</Text>
        </View>

        {/* Employer Cost (for records) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employer Contributions (Not deducted from employee)</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>SSS (ER + EC)</Text><Text style={styles.rowValue}>{peso(item.sss_er + item.sss_ec)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>PhilHealth (ER)</Text><Text style={styles.rowValue}>{peso(item.ph_er)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Pag-IBIG (ER)</Text><Text style={styles.rowValue}>{peso(item.pi_er)}</Text></View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by AkountPH</Text>
          <Text style={styles.footerText}>This is a system-generated payslip.</Text>
        </View>
      </Page>
    </Document>
  )
}

export function PayslipDownloadButton({ data }: { data: PayslipData }) {
  const filename = `payslip-${data.employee.last_name}-${data.run.period_label.replace(' ', '-')}.pdf`
  return (
    <PDFDownloadLink document={<PayslipDocument data={data} />} fileName={filename}>
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Generating PDF…' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
