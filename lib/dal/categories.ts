import "server-only"
import { prisma } from "@/lib/prisma"

// Categories are global, not per-user
export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  })
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
  })
  if (!category) throw new Error("Category not found")
  return category
}

export async function getCategoryByName(name: string) {
  return prisma.category.findUnique({
    where: { name },
  })
}

export async function createCategory(data: {
  name: string
  icon?: string
  color?: string
}) {
  return prisma.category.create({
    data,
  })
}

export async function upsertCategory(data: {
  name: string
  icon?: string
  color?: string
}) {
  return prisma.category.upsert({
    where: { name: data.name },
    create: data,
    update: { icon: data.icon, color: data.color },
  })
}

// Seed default categories
export async function seedDefaultCategories() {
  const defaultCategories = [
    { name: "Shopping", icon: "shopping-bag", color: "#8B5CF6" },
    { name: "Food & Drink", icon: "utensils", color: "#F59E0B" },
    { name: "Transport", icon: "car", color: "#3B82F6" },
    { name: "Travel", icon: "plane", color: "#10B981" },
    { name: "Entertainment", icon: "film", color: "#EC4899" },
    { name: "Bills & Utilities", icon: "file-text", color: "#6B7280" },
    { name: "Health", icon: "heart", color: "#EF4444" },
    { name: "Groceries", icon: "shopping-cart", color: "#22C55E" },
    { name: "Subscriptions", icon: "repeat", color: "#8B5CF6" },
    { name: "Income", icon: "trending-up", color: "#10B981" },
    { name: "Transfer", icon: "arrow-right-left", color: "#6B7280" },
    { name: "Cash", icon: "banknote", color: "#F59E0B" },
    { name: "Other", icon: "help-circle", color: "#9CA3AF" },
  ]

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      create: category,
      update: {},
    })
  }
}
