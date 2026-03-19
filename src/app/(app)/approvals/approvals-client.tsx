"use client";

import { useState } from "react";
import { processApproval } from "@/actions/approvals";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";

type Expense = {
  id: string;
  expenseNo: string;
  expenseType: string;
  totalAmount: number;
  status: string;
  user: { name: string; employeeCode: string };
  department: { departmentName: string } | null;
  _count: { expenseItems: number; expenseAlerts: number };
};

type Props = {
  initialData: { expenses: Expense[]; total: number };
};

const STATUS_LABELS: Record<string, string> = {
  WAITING_MANAGER_APPROVAL: "上長承認待ち",
  WAITING_ACCOUNTING_APPROVAL: "経理確認待ち",
  WAITING_CEO_APPROVAL: "社長承認待ち",
};

export function ApprovalsClient({ initialData }: Props) {
  const [activeExpense, setActiveExpense] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAction(
    expenseId: string,
    actionType: "APPROVE" | "RETURN" | "REJECT"
  ) {
    setLoading(true);
    try {
      await processApproval({
        expenseId,
        actionType,
        comment: comment || undefined,
      });
      const labels = {
        APPROVE: "承認しました",
        RETURN: "差戻ししました",
        REJECT: "却下しました",
      };
      toast.success(labels[actionType]);
      setActiveExpense(null);
      setComment("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">承認</h1>
        <p className="text-muted-foreground">
          承認待ちの経費申請 ({initialData.total}件)
        </p>
      </div>

      {initialData.expenses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            承認待ちの申請はありません
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {initialData.expenses.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{expense.expenseNo}</span>
                      <Badge variant="secondary" className="text-xs">
                        {STATUS_LABELS[expense.status] ?? expense.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {expense.user.name} ({expense.user.employeeCode}) ・
                      {expense.department?.departmentName ?? ""} ・ 明細{" "}
                      {expense._count.expenseItems}件
                    </div>
                  </div>
                  <span className="font-bold">
                    ¥{expense.totalAmount.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setActiveExpense(
                        activeExpense === expense.id ? null : expense.id
                      )
                    }
                  >
                    審査
                  </Button>
                </div>

                {activeExpense === expense.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="コメント（任意）"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(expense.id, "APPROVE")}
                        disabled={loading}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        承認
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(expense.id, "RETURN")}
                        disabled={loading}
                      >
                        <RotateCcw className="mr-1 h-4 w-4" />
                        差戻し
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(expense.id, "REJECT")}
                        disabled={loading}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        却下
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
