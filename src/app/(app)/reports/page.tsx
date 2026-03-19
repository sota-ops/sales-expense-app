import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ReportsPage() {
  const user = await getSessionUser();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    thisMonthVisits,
    lastMonthVisits,
    thisMonthExpenses,
    lastMonthExpenses,
    approvedExpenses,
  ] = await Promise.all([
    prisma.visitLog.count({
      where: { userId: user.id, activityDate: { gte: startOfMonth } },
    }),
    prisma.visitLog.count({
      where: {
        userId: user.id,
        activityDate: { gte: startOfLastMonth, lt: startOfMonth },
      },
    }),
    prisma.expense.aggregate({
      where: { userId: user.id, createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: {
        userId: user.id,
        status: "APPROVED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">レポート</h1>
        <p className="text-muted-foreground">月次活動・経費サマリー</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">今月の訪問数</CardTitle>
            <CardDescription>先月比</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{thisMonthVisits}</p>
            <p className="text-sm text-muted-foreground">
              先月: {lastMonthVisits}件
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">今月の経費申請</CardTitle>
            <CardDescription>申請件数・金額</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {thisMonthExpenses._count}件
            </p>
            <p className="text-sm text-muted-foreground">
              ¥{(thisMonthExpenses._sum.totalAmount ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">承認済み経費</CardTitle>
            <CardDescription>今月承認分</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {approvedExpenses._count}件
            </p>
            <p className="text-sm text-muted-foreground">
              ¥{(approvedExpenses._sum.totalAmount ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">先月の経費</CardTitle>
            <CardDescription>先月の合計</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {lastMonthExpenses._count}件
            </p>
            <p className="text-sm text-muted-foreground">
              ¥{(lastMonthExpenses._sum.totalAmount ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
