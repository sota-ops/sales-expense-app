"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createExpense, submitExpense } from "@/actions/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Expense = {
  id: string;
  expenseNo: string;
  expenseType: string;
  targetDate: Date;
  totalAmount: number;
  status: string;
  _count: { expenseItems: number; expenseAlerts: number };
};

type Props = {
  initialData: { expenses: Expense[]; total: number };
};

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  TRAVEL_EXPENSE: "旅費交通費",
  SALES_ALLOWANCE: "営業日当",
  ENTERTAINMENT_ALLOWANCE: "接待交際費",
  GENERAL_EXPENSE: "一般経費",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "下書き", className: "bg-muted text-muted-foreground" },
  SUBMITTED: { label: "提出済", className: "bg-blue-100 text-blue-700" },
  WAITING_MANAGER_APPROVAL: {
    label: "上長承認待ち",
    className: "bg-yellow-100 text-yellow-700",
  },
  WAITING_ACCOUNTING_APPROVAL: {
    label: "経理確認待ち",
    className: "bg-yellow-100 text-yellow-700",
  },
  WAITING_CEO_APPROVAL: {
    label: "社長承認待ち",
    className: "bg-orange-100 text-orange-700",
  },
  APPROVED: { label: "承認済", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "却下", className: "bg-red-100 text-red-700" },
  RETURNED: { label: "差戻し", className: "bg-orange-100 text-orange-700" },
  CANCELED: {
    label: "キャンセル",
    className: "bg-muted text-muted-foreground",
  },
};

export function ExpensesClient({ initialData }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      const expense = await createExpense({
        expenseType: form.get("expenseType") as string,
        targetDate: form.get("targetDate") as string,
        remarks: (form.get("remarks") as string) || undefined,
      });
      toast.success("経費申請を作成しました");
      setShowForm(false);
      router.push(`/expenses/${expense.id}`);
    } catch {
      toast.error("作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(expenseId: string) {
    try {
      await submitExpense(expenseId);
      toast.success("経費申請を提出しました");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "提出に失敗しました"
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">経費申請</h1>
          <p className="text-muted-foreground">経費の申請・明細管理</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          新規申請
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規経費申請</CardTitle>
            <CardDescription>経費種別と対象月を選択</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>経費種別</Label>
                  <Select name="expenseType" defaultValue="TRAVEL_EXPENSE">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_TYPE_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>対象日</Label>
                  <Input
                    name="targetDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "作成中..." : "作成"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {initialData.expenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              経費申請がありません
            </CardContent>
          </Card>
        ) : (
          initialData.expenses.map((expense) => {
            const status = STATUS_LABELS[expense.status] ?? {
              label: expense.status,
              className: "bg-muted",
            };
            return (
              <Card
                key={expense.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/expenses/${expense.id}`)}
              >
                <CardContent className="flex items-center gap-4 py-4">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{expense.expenseNo}</span>
                      <Badge variant="secondary" className="text-xs">
                        {EXPENSE_TYPE_LABELS[expense.expenseType] ??
                          expense.expenseType}
                      </Badge>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {new Date(expense.targetDate).toLocaleDateString(
                          "ja-JP"
                        )}
                      </span>
                      <span>明細 {expense._count.expenseItems}件</span>
                      {expense._count.expenseAlerts > 0 && (
                        <span className="flex items-center gap-1 text-orange-600">
                          <AlertCircle className="h-3 w-3" />
                          アラート {expense._count.expenseAlerts}件
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold">
                      ¥{expense.totalAmount.toLocaleString()}
                    </span>
                    {expense.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmit(expense.id);
                        }}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        提出
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
