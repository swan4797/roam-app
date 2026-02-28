import "server-only"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InvoiceStatus, MatchType } from "@/generated/prisma/client"

function decimalToNumber(value: { toNumber: () => number } | null | undefined): number | null {
  return value ? value.toNumber() : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeInvoice(invoice: any) {
  return {
    ...invoice,
    amount: invoice.amount?.toNumber?.() ?? invoice.amount,
    amountInBase: invoice.amountInBase?.toNumber?.() ?? invoice.amountInBase,
    payments: invoice.payments?.map((p: any) => ({
      ...p,
      amount: p.amount?.toNumber?.() ?? p.amount,
      transaction: p.transaction ? {
        ...p.transaction,
        amount: p.transaction.amount?.toNumber?.() ?? p.transaction.amount,
      } : p.transaction,
    })),
  }
}

export interface CreateInvoiceInput {
  clientName: string
  description?: string
  amount: number
  currency: string
  amountInBase: number
  issuedAt: Date
  dueAt: Date
}

export async function createInvoice(input: CreateInvoiceInput) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  return prisma.invoice.create({
    data: {
      userId: session.user.id,
      clientName: input.clientName,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      amountInBase: input.amountInBase,
      issuedAt: input.issuedAt,
      dueAt: input.dueAt,
    },
  })
}

export async function getInvoices(options?: {
  status?: InvoiceStatus
  limit?: number
  offset?: number
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const { status, limit = 50, offset = 0 } = options ?? {}

  const invoices = await prisma.invoice.findMany({
    where: {
      userId: session.user.id,
      ...(status && { status }),
    },
    include: {
      payments: {
        include: {
          transaction: {
            select: {
              id: true,
              amount: true,
              currency: true,
              transactionDate: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { dueAt: "asc" },
    take: limit,
    skip: offset,
  })

  return invoices.map(serializeInvoice)
}

export async function getInvoice(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      payments: {
        include: {
          transaction: true,
        },
      },
    },
  })

  if (!invoice) throw new Error("Invoice not found")
  return invoice
}

export async function updateInvoice(
  id: string,
  data: Partial<Omit<CreateInvoiceInput, "userId">>
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!invoice) throw new Error("Invoice not found")

  return prisma.invoice.update({
    where: { id },
    data,
  })
}

export async function deleteInvoice(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify ownership
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!invoice) throw new Error("Invoice not found")

  return prisma.invoice.delete({
    where: { id },
  })
}

export async function linkPaymentToInvoice(
  invoiceId: string,
  transactionId: string,
  matchType: MatchType = MatchType.MANUAL
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify invoice ownership
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
  })
  if (!invoice) throw new Error("Invoice not found")

  // Verify transaction ownership
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
    },
  })
  if (!transaction) throw new Error("Transaction not found")

  // Create the payment link
  const payment = await prisma.invoicePayment.create({
    data: {
      invoiceId,
      transactionId,
      amount: transaction.amount,
      matchType,
      confirmedAt: matchType === MatchType.EXACT_AMOUNT ? new Date() : null,
    },
  })

  // Update invoice status based on total payments
  await updateInvoiceStatus(invoiceId)

  return payment
}

export async function confirmPayment(paymentId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const payment = await prisma.invoicePayment.findFirst({
    where: {
      id: paymentId,
      invoice: { userId: session.user.id },
    },
  })
  if (!payment) throw new Error("Payment not found")

  const updated = await prisma.invoicePayment.update({
    where: { id: paymentId },
    data: { confirmedAt: new Date() },
  })

  await updateInvoiceStatus(payment.invoiceId)

  return updated
}

export async function unlinkPayment(paymentId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const payment = await prisma.invoicePayment.findFirst({
    where: {
      id: paymentId,
      invoice: { userId: session.user.id },
    },
  })
  if (!payment) throw new Error("Payment not found")

  await prisma.invoicePayment.delete({
    where: { id: paymentId },
  })

  await updateInvoiceStatus(payment.invoiceId)
}

async function updateInvoiceStatus(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      payments: {
        where: { confirmedAt: { not: null } },
      },
    },
  })
  if (!invoice) return

  const totalPaid = invoice.payments.reduce(
    (sum: number, p: { amount: { toNumber: () => number } }) => sum + p.amount.toNumber(),
    0
  )
  const invoiceAmount = invoice.amount.toNumber()

  let status: InvoiceStatus
  if (totalPaid >= invoiceAmount) {
    status = InvoiceStatus.PAID
  } else if (totalPaid > 0) {
    status = InvoiceStatus.PARTIALLY_PAID
  } else if (invoice.dueAt < new Date()) {
    status = InvoiceStatus.OVERDUE
  } else {
    status = InvoiceStatus.UNPAID
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status,
      paidAt: status === InvoiceStatus.PAID ? new Date() : null,
    },
  })
}

export async function getUnpaidInvoicesTotal() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const result = await prisma.invoice.aggregate({
    where: {
      userId: session.user.id,
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
    },
    _sum: {
      amountInBase: true,
    },
    _count: true,
  })

  return {
    total: result._sum.amountInBase?.toNumber() ?? 0,
    count: result._count,
  }
}

export async function getPotentialMatches(invoiceId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorised")

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId: session.user.id },
  })
  if (!invoice) throw new Error("Invoice not found")

  const invoiceAmount = invoice.amount.toNumber()
  const tolerance = invoiceAmount * 0.05 // 5% tolerance

  // Find transactions that could match this invoice
  return prisma.transaction.findMany({
    where: {
      bankAccount: {
        bankConnection: { userId: session.user.id },
      },
      amount: { gt: 0 }, // Only credits (incoming payments)
      transactionDate: { gte: invoice.issuedAt },
      invoicePayments: { none: {} }, // Not already linked
      OR: [
        // Exact match
        { amount: invoice.amount },
        // Fuzzy match within 5%
        {
          amount: {
            gte: invoiceAmount - tolerance,
            lte: invoiceAmount + tolerance,
          },
        },
      ],
    },
    include: {
      bankAccount: {
        select: { displayName: true },
      },
    },
    orderBy: { transactionDate: "desc" },
    take: 10,
  })
}
