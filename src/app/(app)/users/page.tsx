import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { employeeCode: "asc" },
    include: {
      department: true,
      employeePosition: true,
      userRoles: { include: { role: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ユーザー管理</h1>
        <p className="text-muted-foreground">
          登録ユーザー ({users.length}名)
        </p>
      </div>

      <div className="space-y-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.employeeCode}
                  </span>
                  {!user.isActive && (
                    <Badge variant="destructive" className="text-xs">
                      無効
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user.email} ・{" "}
                  {user.department?.departmentName ?? "未所属"} ・{" "}
                  {user.employeePosition?.positionName ?? ""}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {user.userRoles.map((ur) => (
                  <Badge key={ur.id} variant="outline" className="text-xs">
                    {ur.role.roleName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
