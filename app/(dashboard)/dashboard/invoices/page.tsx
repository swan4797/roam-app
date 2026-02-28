import { getInvoices, getUnpaidInvoicesTotal } from "@/lib/dal/invoices"
import { InvoiceList } from "@/components/invoices/invoice-list"
import { InvoiceStats } from "@/components/invoices/invoice-stats"
import { CreateInvoiceButton } from "@/components/invoices/create-invoice-button"

export default async function InvoicesPage() {
  const [invoices, unpaidTotal] = await Promise.all([
    getInvoices(),
    getUnpaidInvoicesTotal(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track client invoices and match payments
          </p>
        </div>
        <CreateInvoiceButton />
      </div>

      <InvoiceStats unpaidTotal={unpaidTotal} invoiceCount={invoices.length} />

      <InvoiceList invoices={invoices} />
    </div>
  )
}
