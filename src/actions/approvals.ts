"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser, hasRole } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const approvalActionSchema = z.object({
  expenseId: z.string().uuid(),
  actionType: z.enum(["APPROVE", "RETURN", "REJECT", "EXCEPTION_APPROVE"]),
  comment: z.string().optional(),
});

export async function processApproval(
  input: z.infer<typeof approvalActionSchema>
) {
  const user = await getSessionUser();
  const validated = approvalActionSchema.parse(input);

  const expense = await prisma.expense.findUnique({
    where: { id: validated.expenseId },
    include: {
      approvalRequest: {
        include: {
          route: {
            include: { steps: { orderBy: { stepOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!expense || !expense.approvalRequest) {
    throw new Error("承認対象の経費が見つかりません");
  }

  const request = expense.approvalRequest;
  const currentStep = request.route.steps.find(
    (s) => s.stepOrder === request.currentStepOrder
  );
  if (!currentStep) {
    throw new Error("承認ステップが見つかりません");
  }

  // Verify approver has the right role
  if (!hasRole(user, currentStep.approverRole)) {
    throw new Error("この承認ステップの権限がありません");
  }

  // Record history
  await prisma.approvalHistory.create({
    data: {
      expenseId: validated.expenseId,
      stepOrder: request.currentStepOrder,
      approverUserId: user.id,
      actionType: validated.actionType,
      comment: validated.comment ?? null,
    },
  });

  if (validated.actionType === "RETURN" || validated.actionType === "REJECT") {
    const newStatus =
      validated.actionType === "RETURN" ? "RETURNED" : "REJECTED";
    await prisma.$transaction([
      prisma.expense.update({
        where: { id: validated.expenseId },
        data: { status: newStatus },
      }),
      prisma.approvalRequest.update({
        where: { id: request.id },
        data: { status: validated.actionType === "REJECT" ? "REJECTED" : "RETURNED" },
      }),
    ]);
  } else {
    // APPROVE or EXCEPTION_APPROVE - move to next step
    const nextSteps = request.route.steps.filter(
      (s) => s.stepOrder > request.currentStepOrder
    );

    // Skip conditional steps unless needed
    const nextStep = nextSteps.find((s) => {
      if (!s.isConditional) return true;
      if (s.conditionType === "EXCEPTION_ONLY") {
        return expense.requiresExceptionApproval;
      }
      return true;
    });

    if (nextStep) {
      const statusMap: Record<string, string> = {
        APPROVER_MANAGER: "WAITING_MANAGER_APPROVAL",
        APPROVER_ACCOUNTING: "WAITING_ACCOUNTING_APPROVAL",
        CEO: "WAITING_CEO_APPROVAL",
      };

      await prisma.$transaction([
        prisma.expense.update({
          where: { id: validated.expenseId },
          data: {
            status: statusMap[nextStep.approverRole] ?? "SUBMITTED",
            currentApprovalStep: nextStep.stepOrder,
          },
        }),
        prisma.approvalRequest.update({
          where: { id: request.id },
          data: { currentStepOrder: nextStep.stepOrder },
        }),
      ]);
    } else {
      // All steps completed
      await prisma.$transaction([
        prisma.expense.update({
          where: { id: validated.expenseId },
          data: { status: "APPROVED" },
        }),
        prisma.approvalRequest.update({
          where: { id: request.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        }),
      ]);
    }
  }

  revalidatePath("/approvals");
  revalidatePath("/expenses");
}

export async function getPendingApprovals(page = 1) {
  const user = await getSessionUser();
  const limit = 20;

  // Determine which approval statuses this user can handle
  const statusFilters: string[] = [];
  if (hasRole(user, "APPROVER_MANAGER") || hasRole(user, "MANAGER")) {
    statusFilters.push("WAITING_MANAGER_APPROVAL");
  }
  if (hasRole(user, "APPROVER_ACCOUNTING")) {
    statusFilters.push("WAITING_ACCOUNTING_APPROVAL");
  }
  if (hasRole(user, "CEO")) {
    statusFilters.push("WAITING_CEO_APPROVAL");
  }
  if (hasRole(user, "ADMIN")) {
    statusFilters.push(
      "WAITING_MANAGER_APPROVAL",
      "WAITING_ACCOUNTING_APPROVAL",
      "WAITING_CEO_APPROVAL"
    );
  }

  const where = { status: { in: [...new Set(statusFilters)] } };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { name: true, employeeCode: true } },
        department: true,
        _count: { select: { expenseItems: true, expenseAlerts: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return { expenses, total, page, limit };
}
