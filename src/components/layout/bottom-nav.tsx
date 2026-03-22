"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Receipt,
  CheckCircle,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const bottomItems = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/visits", label: "訪問", icon: MapPin },
  { href: "/expenses", label: "経費", icon: Receipt },
  { href: "/approvals", label: "承認", icon: CheckCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card lg:hidden safe-bottom">
      <div className="flex items-center justify-around h-14">
        {bottomItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
