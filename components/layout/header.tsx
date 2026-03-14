"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(13,20,32,0.72)] px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4">
        <div className="min-w-0 pl-10 md:pl-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#A3D1FF]">SOCAR Dashboard</p>
          <h1 className="truncate text-xl font-semibold tracking-[-0.03em] text-white md:text-2xl">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-10 w-10 cursor-pointer rounded-2xl border border-white/10 shadow-[0_12px_24px_rgba(0,0,0,0.2)]">
                <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? "사용자"} />
                <AvatarFallback className="rounded-2xl bg-[linear-gradient(135deg,#3393FF,#0041E6)] text-white">
                  {session?.user?.name?.charAt(0) ?? "S"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-3xl border-white/10 bg-[#111826] text-white">
              <DropdownMenuLabel>
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-[#99A1B1]">{session?.user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/8" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="cursor-pointer rounded-2xl focus:bg-white/8 focus:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
