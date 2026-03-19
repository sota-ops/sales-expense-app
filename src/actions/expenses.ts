"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createExpenseSchema = z.object({
  expenseType: z.string(),
  targetDate: z.string(),
  remarks: z.string().optional(),
});

function generateExpenseNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EXP-${y}${m}${d}-${rand}`;
}

export async function createExpense(
  input: z.infer<typeof createExpenseSchema>
) {
  const user = await getSessionUser();
  const validated = createExpenseSchema.parse(input);

  const expense = await prisma.expense.create({
    data: {
      expenseNo: generateExpenseNo(),
      userId: user.id,
      expenseType: validated.expenseType,
      targetDate: new Date(validated.targetDate),
      departmentId: user.departmentId,
      remarks: validated.remarks ?? null,
      createdBy: user.id,
      updatedBy: user.id,
    },
  });

  revalidatePath("/expenses");
  return expense;
}

const addItemSchema = z.object({
  expenseId: z.string().uuid(),
  itemType: z.string(),
  activityDate: z.string(),
  description: z.string().optional(),
  amount: z.number().int().min(0),
  fromPlace: z.string().optional(),
  toPlace: z.string().optional(),
  clientId: z.string().uuid().optional(),
  visitLogId: z.string().uuid().optional(),
  tripSegmentId: z.string().uuid().optional(),
});

export async function addExpenseItem(input: z.infer<typeof addItemSchema>) {
  const user = await getSessionUser();
  const validated = addItemSchema.parse(input);

  // Verify expense belongs to user
  const expense = await prisma.expense.findFirst({
    where: { id: validated.expenseId, userId: user.id },
  });
  if (!expense) {
    throw new Error("経費申請が見つかりません");
  }

  const item = await prisma.expenseItem.create({
    data: {
      expenseId: validated.expenseId,
      itemType: validated.itemType,
      activityDate: new Date(validated.activityDate),
      description: validated.description ?? null,
      amount: validated.amount,
      eligibleAmount: validated.amount,
      fromPlace: validated.fromPlace ?? null,
      toPlace: validated.toPlace ?? null,
      clientId: validated.clientId ?? null,
      visitLogId: validated.visitLogId ?? null,
      tripSegmentId: validated.tripSegmentId ?? null,
    },
  });

  // Update total
  const items = await prisma.expenseItem.findMany({
    where: { expenseId: validated.expenseId },
  });
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  await prisma.expense.update({
    where: { id: validated.expenseId },
    data: { totalAmount: total, updatedBy: user.id },
  });

  revalidatePath("/expenses");
  return item;
}

export async function submitExpense(expenseId: string) {
  const user = await getSessionUser();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId: user.id, status: "DRAFT" },
  });
  if (!expense) {
    throw new Error("提出可能な経費申請が見つかりません");
  }

  // Find default approval route
  const route = await prisma.approvalRoute.findFirst({
    where: { isDefault: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } },
  });
  if (!route) {
    throw new Error("承認ルートが設定されていません");
  }

  const firstStep = route.steps[0];
  const statusMap: Record<string, string> = {
    APPROVER_MANAGER: "WAITING_MANAGER_APPROVAL",
    APPROVER_ACCOUNTING: "WAITING_ACCOUNTING_APPROVAL",
    CEO: "WAITING_CEO_APPROVAL",
  };

  await prisma.$transaction([
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: statusMap[firstStep.approverRole] ?? "SUBMITTED",
        applicationDate: new Date(),
        currentApprovalStep: 1,
        updatedBy: user.id,
      },
    }),
    prisma.approvalRequest.create({
      data: {
        expenseId,
        routeId: route.id,
        currentStepOrder: 1,
        status: "IN_PROGRESS",
        submittedAt: new Date(),
      },
    }),
    prisma.approvalHistory.create({
      data: {
        expenseId,
        stepOrder: 0,
        approverUserId: user.id,
        actionType: "SUBMIT",
      },
    }),
  ]);

  revalidatePath("/expenses");
}

export async function getExpenses(params?: {
  month?: string;
  status?: string;
  page?: number;
}) {
  const user = await getSessionUser();
  const page = params?.page ?? 1;
  const limit = 20;

  const where: Record<string, unknown> = { userId: user.id };

  if (params?.month) {
    const [year, month] = params.month.split("-").map(Number);
    where.targetDate = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  if (params?.status) {
    where.status = params.status;
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { expenseItems: true, expenseAlerts: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, limit };
}

export async function getExpenseDetail(expenseId: string) {
  const user = await getSessionUser();

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId: user.id },
    include: {
      expenseItems: {
        include: {
          client: true,
          visitLog: true,
          receipts: true,
          uploadedPhotos: { include: { exifMetadata: true } },
        },
        orderBy: { activityDate: "asc" },
      },
      approvalHistories: {
        include: { approver: true },
        orderBy: { actionAt: "asc" },
      },
      expenseAlerts: true,
    },
  });

  return expense;
}

export async function deleteExpenseItem(itemId: string) {
  const user = await getSessionUser();

  const item = await prisma.expenseItem.findFirst({
    where: { id: itemId },
    include: { expense: true },
  });

  if (!item || item.expense.userId !== user.id) {
    throw new Error("明細が見つかりません");
  }

  if (item.expense.status !== "DRAFT") {
    throw new Error("下書き以外の申請は編集できません");
  }

  await prisma.expenseItem.delete({ where: { id: itemId } });

  // Recalculate total
  const remaining = await prisma.expenseItem.findMany({
    where: { expenseId: item.expenseId },
  });
  const total = remaining.reduce((sum, i) => sum + i.amount, 0);
  await prisma.expense.update({
    where: { id: item.expenseId },
    data: { totalAmount: total },
  });

  revalidatePath("/expenses");
}
