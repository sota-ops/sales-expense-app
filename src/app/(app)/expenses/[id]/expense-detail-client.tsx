"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addExpenseItem,
  submitExpense,
  deleteExpenseItem,
} from "@/actions/expenses";
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
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Send,
  Trash2,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

const ITEM_TYPE_LABELS: Record<string, string> = {
  TRAIN: "電車",
  BUS: "バス",
  TAXI: "タクシー",
  CAR_MILEAGE: "車両走行",
  HIGHWAY: "高速道路",
  PARKING: "駐車場",
  HOTEL: "宿泊",
  SALES_DAILY_ALLOWANCE: "営業日当",
  ENTERTAINMENT_ACTIVITY_ALLOWANCE: "接待費",
  GENERAL: "一般",
};

type Client = { id: string; clientName: string; clientCode: string };

type Props = {
  expense: {
    id: string;
    expenseNo: string;
    expenseType: string;
    status: string;
    targetDate: Date;
    totalAmount: number;
    remarks: string | null;
    expenseItems: {
      id: string;
      itemType: string;
      activityDate: Date;
      description: string | null;
      amount: number;
      fromPlace: string | null;
      toPlace: string | null;
      client: { clientName: string } | null;
    }[];
    approvalHistories: {
      id: string;
      stepOrder: number;
      actionType: string;
      actionAt: Date;
      comment: string | null;
      approver: { name: string };
    }[];
    expenseAlerts: {
      id: string;
      alertCode: string;
      alertLevel: string;
      alertMessage: string;
      resolvedFlag: boolean;
    }[];
  };
  clients: Client[];
};

export function ExpenseDetailClient({ expense, clients }: Props) {
  const router = useRouter();
  const [showAddItem, setShowAddItem] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDraft = expense.status === "DRAFT";

  async function handleAddItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await addExpenseItem({
        expenseId: expense.id,
        itemType: form.get("itemType") as string,
        activityDate: form.get("activityDate") as string,
        description: (form.get("description") as string) || undefined,
        amount: parseInt(form.get("amount") as string, 10),
        fromPlace: (form.get("fromPlace") as string) || undefined,
        toPlace: (form.get("toPlace") as string) || undefined,
        clientId: (form.get("clientId") as string) || undefined,
      });
      toast.success("明細を追加しました");
      setShowAddItem(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deleteExpenseItem(itemId);
      toast.success("明細を削除しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  async function handleSubmit() {
    try {
      await submitExpense(expense.id);
      toast.success("経費申請を提出しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "提出に失敗しました");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          戻る
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{expense.expenseNo}</h1>
          <p className="text-muted-foreground">
            {new Date(expense.targetDate).toLocaleDateString("ja-JP")} ・ 合計{" "}
            ¥{expense.totalAmount.toLocaleString()}
          </p>
        </div>
        {isDraft && (
          <Button onClick={handleSubmit}>
            <Send className="mr-2 h-4 w-4" />
            提出
          </Button>
        )}
      </div>

      {/* Alerts */}
      {expense.expenseAlerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              アラート ({expense.expenseAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expense.expenseAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-2 text-sm"
              >
                {alert.resolvedFlag ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                )}
                <span>{alert.alertMessage}</span>
                <Badge
                  variant={
                    alert.alertLevel === "CRITICAL"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {alert.alertLevel}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>明細一覧</CardTitle>
            <CardDescription>
              {expense.expenseItems.length}件の明細
            </CardDescription>
          </div>
          {isDraft && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddItem(!showAddItem)}
            >
              <Plus className="mr-1 h-4 w-4" />
              明細追加
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showAddItem && (
            <form
              onSubmit={handleAddItem}
              className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30"
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>費目</Label>
                  <Select name="itemType" defaultValue="TRAIN">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ITEM_TYPE_LABELS).map(
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
                  <Label>日付</Label>
                  <Input
                    name="activityDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>金額</Label>
                  <Input
                    name="amount"
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>出発地</Label>
                  <Input name="fromPlace" placeholder="東京駅" />
                </div>
                <div className="space-y-2">
                  <Label>到着地</Label>
                  <Input name="toPlace" placeholder="新宿駅" />
                </div>
                <div className="space-y-2">
                  <Label>摘要</Label>
                  <Input name="description" placeholder="内容" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={loading}>
                  追加
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddItem(false)}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          )}

          {expense.expenseItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              明細がありません
            </p>
          ) : (
            <div className="divide-y">
              {expense.expenseItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ITEM_TYPE_LABELS[item.itemType] ?? item.itemType}
                      </Badge>
                      <span className="text-sm">
                        {new Date(item.activityDate).toLocaleDateString(
                          "ja-JP"
                        )}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.fromPlace && item.toPlace
                        ? `${item.fromPlace} → ${item.toPlace}`
                        : item.description ?? ""}
                    </div>
                  </div>
                  <span className="font-medium">
                    ¥{item.amount.toLocaleString()}
                  </span>
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval History */}
      {expense.approvalHistories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>承認履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expense.approvalHistories.map((history) => (
                <div key={history.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {history.approver.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {history.actionType}
                      </Badge>
                      <span className="text-muted-foreground text-xs">
                        {new Date(history.actionAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                    {history.comment && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {history.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
