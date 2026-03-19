"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  FileText,
  Receipt,
  CheckCircle,
  Settings,
  Users,
  Building2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/visits", label: "訪問記録", icon: MapPin },
  { href: "/activity-reports", label: "活動報告", icon: FileText },
  { href: "/expenses", label: "経費申請", icon: Receipt },
  { href: "/approvals", label: "承認", icon: CheckCircle },
  { href: "/clients", label: "顧客管理", icon: Building2 },
  { href: "/reports", label: "レポート", icon: BarChart3 },
  { href: "/users", label: "ユーザー管理", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
