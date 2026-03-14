"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, ChevronLeft, ChevronRight, Menu, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    icon: LayoutDashboard,
    label: "운영 현황",
    description: "실시간 매출, 가동률, 이용 흐름",
    href: "/dashboard",
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-50 md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "relative hidden h-screen flex-col border-r border-sidebar-border/80 bg-sidebar/90 px-4 py-4 backdrop-blur-xl transition-all duration-300 md:flex",
          "before:pointer-events-none before:absolute before:-left-12 before:top-0 before:h-60 before:w-60 before:rounded-full before:bg-[radial-gradient(circle,rgba(0,120,255,0.22),transparent_70%)]",
          collapsed ? "w-[92px]" : "w-[290px]",
          mobileOpen && "!fixed inset-y-0 left-0 z-50 !flex w-[290px]"
        )}
      >
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#3393FF,#0041E6)] font-semibold text-white">
                  S
                </div>
                {!collapsed && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A3D1FF]">
                      Lifetime Mobility
                    </p>
                    <strong className="block text-lg font-semibold text-white">SOCAR Ops</strong>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {!collapsed && (
              <p className="text-sm leading-6 text-[#CBD1DC]">
                원하는 이동을 필요한 만큼만. 운영 신호를 한 화면에서 읽고 즉시 대응하는 SOCAR 대시보드입니다.
              </p>
            )}
          </div>

          <nav className="relative z-10 flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-3xl border px-3 py-3 transition-all duration-200",
                  "border-[rgba(255,255,255,0.06)] bg-white/[0.03] hover:border-[rgba(102,176,255,0.22)] hover:bg-white/[0.06]",
                  "shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(0,120,255,0.18)] text-[#A3D1FF] transition-colors group-hover:bg-[rgba(0,120,255,0.24)] group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                {!collapsed && (
                  <div className="min-w-0">
                    <strong className="block truncate text-sm font-semibold text-white">{item.label}</strong>
                    <small className="block truncate text-xs text-[#99A1B1]">{item.description}</small>
                  </div>
                )}
              </Link>
            ))}
          </nav>

          {!collapsed && (
            <div className="relative z-10 mt-4 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.2)]">
              <div className="mb-3 flex items-center gap-2 text-[#A3D1FF]">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em]">Brand Mode</span>
              </div>
              <p className="text-sm font-semibold text-white">서울 운영 센터</p>
              <p className="mt-2 text-sm leading-6 text-[#CBD1DC]">
                복잡한 장식보다 빠른 판단과 분명한 우선순위. 쏘카 브랜드 톤에 맞춰 UI를 단정하고 강하게 유지합니다.
              </p>
            </div>
          )}

          <div className="mt-4 hidden border-t border-white/8 pt-3 md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full rounded-2xl"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
