"use client";

import { useState } from "react";
import { createVisit, startVisit, endVisit } from "@/actions/visits";
import { captureGps } from "@/actions/gps";
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
import {
  MapPin,
  Play,
  Square,
  Plus,
  Camera,
  Clock,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import type { ACTIVITY_TYPES } from "@/types";

type Client = { id: string; clientName: string; clientCode: string };
type Visit = {
  id: string;
  activityDate: Date;
  activityType: string;
  visitStartAt: Date | null;
  visitEndAt: Date | null;
  memo: string | null;
  client: { clientName: string } | null;
  visitDestination: { destinationName: string } | null;
  gpsLogs: { latitude: number; longitude: number }[];
  _count: {
    uploadedPhotos: number;
    audioRecords: number;
    activityReports: number;
  };
};

type Props = {
  initialData: {
    visits: Visit[];
    total: number;
  };
  clients: Client[];
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  NEW_SALES_VISIT: "新規営業訪問",
  FOLLOW_UP_VISIT: "フォロー訪問",
  CEO_APPROVED_ACTIVITY: "社長認定活動",
  LUNCH_MEETING: "ランチミーティング",
  DINNER_MEETING: "ディナーミーティング",
  NETWORKING_EVENT: "交流会",
  MATCHING_EVENT: "マッチングイベント",
  OTHER: "その他",
};

export function VisitsClient({ initialData, clients }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await createVisit({
        clientId: (form.get("clientId") as string) || undefined,
        activityDate: form.get("activityDate") as string,
        activityType: form.get("activityType") as string,
        memo: (form.get("memo") as string) || undefined,
      });
      toast.success("訪問記録を作成しました");
      setShowForm(false);
    } catch (err) {
      toast.error("作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartVisit(visitId: string) {
    try {
      // Capture GPS at visit start
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await captureGps({
              visitLogId: visitId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              sourceType: "VISIT_START",
            });
          },
          () => {
            toast.error("GPS取得に失敗しました");
          }
        );
      }
      await startVisit(visitId);
      toast.success("訪問を開始しました");
    } catch {
      toast.error("操作に失敗しました");
    }
  }

  async function handleEndVisit(visitId: string) {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await captureGps({
              visitLogId: visitId,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              sourceType: "VISIT_END",
            });
          },
          () => {
            toast.error("GPS取得に失敗しました");
          }
        );
      }
      await endVisit(visitId);
      toast.success("訪問を終了しました");
    } catch {
      toast.error("操作に失敗しました");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">訪問記録</h1>
          <p className="text-muted-foreground">
            訪問活動の記録・GPS打刻・写真添付
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          新規訪問
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規訪問記録</CardTitle>
            <CardDescription>訪問先・活動種別を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="activityDate">活動日</Label>
                  <Input
                    id="activityDate"
                    name="activityDate"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activityType">活動種別</Label>
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
                  <Label htmlFor="clientId">顧客</Label>
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
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="memo">メモ</Label>
                  <Textarea
                    id="memo"
                    name="memo"
                    placeholder="訪問に関するメモ"
                    rows={2}
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
        {initialData.visits.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              訪問記録がありません
            </CardContent>
          </Card>
        ) : (
          initialData.visits.map((visit) => (
            <Card key={visit.id}>
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium truncate">
                      {visit.client?.clientName ?? "顧客未設定"}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {ACTIVITY_TYPE_LABELS[visit.activityType] ??
                        visit.activityType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(visit.activityDate).toLocaleDateString("ja-JP")}
                    </span>
                    {visit.gpsLogs.length > 0 && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        GPS {visit.gpsLogs.length}件
                      </span>
                    )}
                    {visit._count.uploadedPhotos > 0 && (
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        写真 {visit._count.uploadedPhotos}件
                      </span>
                    )}
                  </div>
                  {visit.memo && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {visit.memo}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!visit.visitStartAt ? (
                    <Button
                      size="sm"
                      onClick={() => handleStartVisit(visit.id)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      開始
                    </Button>
                  ) : !visit.visitEndAt ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleEndVisit(visit.id)}
                    >
                      <Square className="mr-1 h-3 w-3" />
                      終了
                    </Button>
                  ) : (
                    <Badge variant="outline">完了</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
