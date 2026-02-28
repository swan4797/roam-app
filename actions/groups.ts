"use server"

import { revalidatePath } from "next/cache"
import {
  createGroup,
  addGroupMember,
  addExpense,
  recordSettlement,
  deleteGroup,
  deleteExpense,
} from "@/lib/dal/groups"
import { SplitType } from "@/generated/prisma/client"

export async function createGroupAction(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string | null
    const currency = formData.get("currency") as string | null
    const membersJson = formData.get("members") as string | null

    if (!name) {
      return { success: false, error: "Group name is required" }
    }

    const members = membersJson ? JSON.parse(membersJson) : []

    const group = await createGroup({
      name,
      description: description || undefined,
      currency: currency || "GBP",
      members,
    })

    revalidatePath("/dashboard/groups")
    return { success: true, groupId: group.id }
  } catch (error) {
    console.error("Failed to create group:", error)
    return { success: false, error: "Failed to create group" }
  }
}

export async function addMemberAction(formData: FormData) {
  try {
    const groupId = formData.get("groupId") as string
    const name = formData.get("name") as string
    const email = formData.get("email") as string | null

    if (!groupId || !name) {
      return { success: false, error: "Group ID and name are required" }
    }

    await addGroupMember(groupId, {
      name,
      email: email || undefined,
    })

    revalidatePath(`/dashboard/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to add member:", error)
    return { success: false, error: "Failed to add member" }
  }
}

export async function addExpenseAction(formData: FormData) {
  try {
    const groupId = formData.get("groupId") as string
    const description = formData.get("description") as string
    const amount = parseFloat(formData.get("amount") as string)
    const currency = formData.get("currency") as string
    const paidById = formData.get("paidById") as string
    const category = formData.get("category") as string | null
    const splitType = (formData.get("splitType") as SplitType) || "EQUAL"
    const splitsJson = formData.get("splits") as string
    const notes = formData.get("notes") as string | null
    const expenseDateStr = formData.get("expenseDate") as string | null

    if (!groupId || !description || !amount || !currency || !paidById) {
      return { success: false, error: "Missing required fields" }
    }

    const splits = JSON.parse(splitsJson)
    const expenseDate = expenseDateStr ? new Date(expenseDateStr) : undefined

    await addExpense(groupId, {
      description,
      amount,
      currency,
      paidById,
      category: category || undefined,
      expenseDate,
      splitType,
      splits,
      notes: notes || undefined,
    })

    revalidatePath(`/dashboard/groups/${groupId}`)
    return { success: true }
  } catch (error) {
    console.error("Failed to add expense:", error)
    return { success: false, error: "Failed to add expense" }
  }
}

export async function recordSettlementAction(formData: FormData) {
  try {
    const groupId = formData.get("groupId") as string
    const fromMemberId = formData.get("fromMemberId") as string
    const toMemberId = formData.get("toMemberId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const currency = formData.get("currency") as string
    const notes = formData.get("notes") as string | null

    if (!groupId || !fromMemberId || !toMemberId || !amount || !currency) {
      return { success: false, error: "Missing required fields" }
    }

    const settlement = await recordSettlement(groupId, {
      fromMemberId,
      toMemberId,
      amount,
      currency,
      notes: notes || undefined,
    })

    revalidatePath(`/dashboard/groups/${groupId}`)

    // Return FX info if applicable
    if (settlement.estimatedFxFee) {
      return {
        success: true,
        fxWarning: {
          fee: settlement.estimatedFxFee,
          wiseSavings: settlement.wiseSavings,
          currency: settlement.currency,
        },
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to record settlement:", error)
    return { success: false, error: "Failed to record settlement" }
  }
}

export async function deleteGroupAction(formData: FormData) {
  try {
    const groupId = formData.get("groupId") as string

    if (!groupId) {
      return { success: false, error: "Group ID is required" }
    }

    await deleteGroup(groupId)

    revalidatePath("/dashboard/groups")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete group:", error)
    return { success: false, error: "Failed to delete group" }
  }
}

export async function deleteExpenseAction(formData: FormData) {
  try {
    const expenseId = formData.get("expenseId") as string
    const groupId = formData.get("groupId") as string

    if (!expenseId) {
      return { success: false, error: "Expense ID is required" }
    }

    await deleteExpense(expenseId)

    if (groupId) {
      revalidatePath(`/dashboard/groups/${groupId}`)
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to delete expense:", error)
    return { success: false, error: "Failed to delete expense" }
  }
}
