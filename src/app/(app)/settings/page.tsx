import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SettingsPage() {
  const [travelRule, salesRule, entertainmentRule, approvalRoutes] =
    await Promise.all([
      prisma.travelRule.findFirst({
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      }),
      prisma.salesAllowanceRule.findFirst({
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      }),
      prisma.entertainmentAllowanceRule.findFirst({
        where: { effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      }),
      prisma.approvalRoute.findMany({
        include: { steps: { orderBy: { stepOrder: "asc" } } },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground">
          ルール設定・承認フロー管理
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>旅費ルール</CardTitle>
            <CardDescription>交通費・宿泊費の上限設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {travelRule ? (
              <>
                <Row label="宿泊上限（一般）" value={`¥${travelRule.hotelLimitGeneral.toLocaleString()}`} />
                <Row label="宿泊上限（管理職）" value={`¥${travelRule.hotelLimitManager.toLocaleString()}`} />
                <Row label="宿泊上限（社長）" value={`¥${travelRule.hotelLimitCeo.toLocaleString()}`} />
                <Row label="走行距離単価" value={`¥${travelRule.mileageUnitPrice}/km`} />
                <Row label="タクシー短距離" value={`${travelRule.taxiShortDistanceThresholdKm}km`} />
              </>
            ) : (
              <p className="text-muted-foreground">未設定</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>営業日当ルール</CardTitle>
            <CardDescription>営業活動日当の設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {salesRule ? (
              <>
                <Row label="日当（社長）" value={`¥${salesRule.amountCeo.toLocaleString()}`} />
                <Row label="日当（管理職）" value={`¥${salesRule.amountManager.toLocaleString()}`} />
                <Row label="日当（一般）" value={`¥${salesRule.amountGeneral.toLocaleString()}`} />
                <Row label="1日1回制限" value={salesRule.oncePerDay ? "あり" : "なし"} />
                <Row label="活動報告必須" value={salesRule.requireActivityReport ? "あり" : "なし"} />
                <Row label="GPS写真必須" value={salesRule.requireGeoPhoto ? "あり" : "なし"} />
              </>
            ) : (
              <p className="text-muted-foreground">未設定</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>接待交際費ルール</CardTitle>
            <CardDescription>接待費の上限・必須項目</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {entertainmentRule ? (
              <>
                <Row label="上限（社長）" value={`¥${entertainmentRule.limitCeo.toLocaleString()}`} />
                <Row label="上限（管理職）" value={`¥${entertainmentRule.limitManager.toLocaleString()}`} />
                <Row label="上限（一般）" value={`¥${entertainmentRule.limitGeneral.toLocaleString()}`} />
                <Row label="領収書必須" value={entertainmentRule.requireReceipt ? "あり" : "なし"} />
                <Row label="社内のみ不可" value={entertainmentRule.internalOnlyDefaultDisallowed ? "はい" : "いいえ"} />
              </>
            ) : (
              <p className="text-muted-foreground">未設定</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>承認ルート</CardTitle>
            <CardDescription>承認フロー設定</CardDescription>
          </CardHeader>
          <CardContent>
            {approvalRoutes.map((route) => (
              <div key={route.id} className="mb-4 last:mb-0">
                <p className="font-medium text-sm mb-2">
                  {route.routeName}
                  {route.isDefault && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      （デフォルト）
                    </span>
                  )}
                </p>
                <div className="space-y-1">
                  {route.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {step.stepOrder}
                      </span>
                      <span>{step.stepName}</span>
                      {step.isConditional && (
                        <span className="text-xs text-muted-foreground">
                          （条件付: {step.conditionType}）
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
