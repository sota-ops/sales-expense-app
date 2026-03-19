"use client";

import { useState } from "react";
import { createClient } from "@/actions/clients";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";

type ClientWithDest = {
  id: string;
  clientCode: string;
  clientName: string;
  isProspect: boolean;
  address: string | null;
  phone: string | null;
  visitDestinations: { id: string; destinationName: string }[];
};

export function ClientsClient({ clients }: { clients: ClientWithDest[] }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await createClient({
        clientCode: form.get("clientCode") as string,
        clientName: form.get("clientName") as string,
        address: (form.get("address") as string) || undefined,
        phone: (form.get("phone") as string) || undefined,
      });
      toast.success("顧客を登録しました");
      setShowForm(false);
    } catch {
      toast.error("登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">顧客管理</h1>
          <p className="text-muted-foreground">
            顧客情報・訪問先の管理
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          新規顧客
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規顧客登録</CardTitle>
            <CardDescription>顧客情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>顧客コード</Label>
                  <Input name="clientCode" required placeholder="CL004" />
                </div>
                <div className="space-y-2">
                  <Label>顧客名</Label>
                  <Input
                    name="clientName"
                    required
                    placeholder="株式会社○○"
                  />
                </div>
                <div className="space-y-2">
                  <Label>住所</Label>
                  <Input name="address" placeholder="東京都..." />
                </div>
                <div className="space-y-2">
                  <Label>電話番号</Label>
                  <Input name="phone" placeholder="03-xxxx-xxxx" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "登録中..." : "登録"}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">
                      {client.clientName}
                    </span>
                    {client.isProspect && (
                      <Badge variant="outline" className="text-xs">
                        見込み
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {client.clientCode}
                  </p>
                  {client.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {client.address}
                    </p>
                  )}
                  {client.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {client.phone}
                    </p>
                  )}
                  {client.visitDestinations.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      訪問先: {client.visitDestinations.length}件
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
