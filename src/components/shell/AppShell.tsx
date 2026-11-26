"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Books, Compass, House, MapTrifold, Moon, Sun, Trophy } from "@/components/ui/Icon";
import { setTheme, useTheme } from "@/lib/settings";
import { hasTianditu, SITE_NAME } from "@/lib/site";
import { OfficialSiteLink, SiteCredits } from "./SiteCredits";

const links = [
  { href: "/home", title: "首页", Icon: House },
  { href: "/courses", title: "教材课程", Icon: Books },
  ...(hasTianditu ? [{ href: "/maps", title: "地图观察", Icon: MapTrifold }] : []),
  { href: "/arena", title: "竞技场", Icon: Trophy },
];

export function AppShell({ active, title, subtitle, actions, children }: {
  active: string; title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
  const theme = useTheme();
  return <div className="min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
    <aside className="border-b border-panel-border bg-bg-2/70 px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:gap-5 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <Link href="/home" className="flex min-w-0 items-center gap-2.5 rounded-lg">
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-ink text-bg"><Compass size={23} weight="duotone" aria-hidden="true" /></span>
          <span className="min-w-0"><span className="block truncate text-[17px] font-extrabold leading-tight">{SITE_NAME}</span><span className="block text-[11px] text-muted">探险学习台</span></span>
        </Link>
        <button type="button" className="btn btn-secondary btn-sm w-9 shrink-0 px-0 lg:hidden" aria-label={theme === "paper" ? "切换夜间主题" : "切换纸面主题"}
          onClick={() => setTheme(theme === "paper" ? "night" : "paper")}>
          {theme === "paper" ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
        </button>
      </div>
      <nav aria-label="主导航" className="mt-3 flex flex-wrap gap-1 lg:mt-0 lg:flex-col">
        {links.map(({ href, title, Icon }) => <Link key={href} href={href}
          aria-current={active === href ? "page" : undefined}
          className={`flex min-h-10 items-center gap-2 rounded-[10px] px-2.5 text-sm font-semibold lg:px-3 ${active === href ? "bg-ink text-bg" : "hover:bg-raised"}`}>
          <Icon size={17} weight={active === href ? "fill" : "regular"} aria-hidden="true" />{title}
        </Link>)}
      </nav>
      <div className="seg mt-auto hidden w-full lg:flex" role="group" aria-label="显示主题">
        <button type="button" className="flex-1 justify-center" aria-pressed={theme === "paper"} onClick={() => setTheme("paper")}><Sun size={15} aria-hidden="true" />纸面</button>
        <button type="button" className="flex-1 justify-center" aria-pressed={theme === "night"} onClick={() => setTheme("night")}><Moon size={15} aria-hidden="true" />夜间</button>
      </div>
    </aside>
    <div className="flex min-w-0 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-border min-h-[76px] px-4 py-3 sm:px-8">
        <div><h1 className="h-display text-2xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
        <div className="flex flex-wrap items-center gap-2">{actions}<OfficialSiteLink /></div>
      </header>
      <main className="flex-1 px-4 pt-6 pb-14 sm:px-8"><div className="mx-auto max-w-[1280px]">{children}</div></main>
      <SiteCredits />
    </div>
  </div>;
}

export function Card({ title, extra, children, className = "" }: { title: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel p-5 ${className}`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[15px] font-bold">{title}</h2>{extra}</div>
    {children}
  </section>;
}
