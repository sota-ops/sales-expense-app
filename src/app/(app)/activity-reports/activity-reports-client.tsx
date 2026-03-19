"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, FileText, Building2 } from "lucide-react";
import { toast } from "sonner";

type Report = {
  id: string;
  reportDate: Date;
  activityType: string;
  counterpartName: string | null;
  counterpartCompany: string | null;
  summary: string | null;
  nextAction: string | null;
  client: { clientName: string } | null;
};

type Client = { id: string; clientName: string };

type Props = {
  reports: Report[];
  clients: Client[];
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  NEW_SALES_VISIT: "新規営業",
  FOLLOW_UP_VISIT: "フォロー",
  CEO_APPROVED_ACTIVITY: "社長認定",
  LUNCH_MEETING: "ランチ",
  DINNER_MEETING: "ディナー",
  NETWORKING_EVENT: "交流会",
  MATCHING_EVENT: "マッチング",
  OTHER: "その他",
};

export function ActivityReportsClient({ reports, clients }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/activity-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: form.get("reportDate"),
          activityType: form.get("activityType"),
          clientId: form.get("clientId") || null,
          counterpartName: form.get("counterpartName") || null,
          counterpartCompany: form.get("counterpartCompany") || null,
          summary: form.get("summary") || null,
          nextAction: form.get("nextAction") || null,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      toast.success("活動報告を作成しました");
      setShowForm(false);
      window.location.reload();
    } catch {
      toast.error("作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">活動報告</h1>
          <p className="text-muted-foreground">営業活動の報告・記録</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          新規報告
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規活動報告</CardTitle>
            <CardDescription>活動内容を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>報告日</Label>
                  <Input
                    name="reportDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>活動種別</Label>
                  <Select name="activityType" defaultValue="NEW_SALES_VISIT">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(
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
                  <Label>顧客</Label>
                  <Select name="clientId">
                    <SelectTrigger>
                      <SelectValue placeholder="顧客を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>相手先担当者</Label>
                  <Input name="counterpartName" placeholder="山田太郎" />
                </div>
                <div className="space-y-2">
                  <Label>相手先会社</Label>
                  <Input name="counterpartCompany" placeholder="株式会社○○" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>活動概要</Label>
                <Textarea name="summary" rows={3} placeholder="活動内容を記入" />
              </div>
              <div className="space-y-2">
                <Label>次回アクション</Label>
                <Input name="nextAction" placeholder="次のステップ" />
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
        {reports.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              活動報告がありません
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {new Date(report.reportDate).toLocaleDateString(
                          "ja-JP"
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {ACTIVITY_TYPE_LABELS[report.activityType] ??
                          report.activityType}
                      </Badge>
                      {report.client && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {report.client.clientName}
                        </span>
                      )}
                    </div>
                    {report.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.summary}
                      </p>
                    )}
                    {report.counterpartName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        担当: {report.counterpartName}
                        {report.counterpartCompany &&
                          ` (${report.counterpartCompany})`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
