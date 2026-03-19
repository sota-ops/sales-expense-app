import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, FileText, Receipt, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const user = await getSessionUser();

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [visitCount, reportCount, expenseCount, pendingApprovals] =
    await Promise.all([
      prisma.visitLog.count({
        where: {
          userId: user.id,
          activityDate: { gte: startOfMonth },
        },
      }),
      prisma.activityReport.count({
        where: {
          userId: user.id,
          reportDate: { gte: startOfMonth },
        },
      }),
      prisma.expense.count({
        where: {
          userId: user.id,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.expense.count({
        where: {
          status: {
            in: [
              "WAITING_MANAGER_APPROVAL",
              "WAITING_ACCOUNTING_APPROVAL",
              "WAITING_CEO_APPROVAL",
            ],
          },
        },
      }),
    ]);

  const stats = [
    {
      title: "今月の訪問数",
      value: visitCount,
      icon: MapPin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "今月の活動報告",
      value: reportCount,
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "今月の経費申請",
      value: expenseCount,
      icon: Receipt,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "承認待ち",
      value: pendingApprovals,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">
          こんにちは、{user.name}さん
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-md p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近の訪問記録</CardTitle>
            <CardDescription>直近5件の訪問記録</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentVisits userId={user.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>経費申請状況</CardTitle>
            <CardDescription>直近の経費申請</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentExpenses userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function RecentVisits({ userId }: { userId: string }) {
  const visits = await prisma.visitLog.findMany({
    where: { userId },
    orderBy: { activityDate: "desc" },
    take: 5,
    include: { client: true },
  });

  if (visits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        訪問記録がありません
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <div
          key={visit.id}
          className="flex items-center justify-between border-b pb-2 last:border-0"
        >
          <div>
            <p className="text-sm font-medium">
              {visit.client?.clientName ?? "未設定"}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(visit.activityDate).toLocaleDateString("ja-JP")}
            </p>
          </div>
          <span className="text-xs rounded-full bg-muted px-2 py-1">
            {visit.activityType === "NEW_SALES_VISIT"
              ? "新規訪問"
              : visit.activityType === "FOLLOW_UP_VISIT"
                ? "フォロー訪問"
                : visit.activityType}
          </span>
        </div>
      ))}
    </div>
  );
}

async function RecentExpenses({ userId }: { userId: string }) {
  const expenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        経費申請がありません
      </p>
    );
  }

  const statusLabels: Record<string, { label: string; className: string }> = {
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
    CANCELED: { label: "キャンセル", className: "bg-muted text-muted-foreground" },
  };

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const status = statusLabels[expense.status] ?? {
          label: expense.status,
          className: "bg-muted",
        };
        return (
          <div
            key={expense.id}
            className="flex items-center justify-between border-b pb-2 last:border-0"
          >
            <div>
              <p className="text-sm font-medium">{expense.expenseNo}</p>
              <p className="text-xs text-muted-foreground">
                ¥{expense.totalAmount.toLocaleString()}
              </p>
            </div>
            <span
              className={`text-xs rounded-full px-2 py-1 ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
