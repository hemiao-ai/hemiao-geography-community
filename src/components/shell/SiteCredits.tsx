import Link from "next/link";
import { ArrowSquareOut, GithubLogo } from "@/components/ui/Icon";
import { COMMUNITY_REPO_URL, OFFICIAL_SITE_URL } from "@/lib/site";

export function OfficialSiteLink({ className = "" }: { className?: string }) {
  return <a href={OFFICIAL_SITE_URL} target="_blank" rel="noreferrer" className={`btn btn-secondary btn-sm ${className}`}>
    访问官方版<ArrowSquareOut size={14} aria-hidden="true" />
  </a>;
}

export function GitHubLink({ compact = false }: { compact?: boolean }) {
  return <a href={COMMUNITY_REPO_URL} target="_blank" rel="noreferrer" aria-label="GitHub 源码仓库" title="GitHub 源码仓库"
    className={`btn btn-secondary btn-sm shrink-0 ${compact ? "max-sm:w-[34px] max-sm:px-0" : ""}`}>
    <GithubLogo size={17} weight="fill" aria-hidden="true" /><span className={compact ? "hidden sm:inline" : ""}>GitHub</span>
  </a>;
}

export function SiteCredits() {
  return <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-panel-border px-4 py-4 text-xs leading-5 text-muted sm:px-8">
    <span>© 2026 禾苗地理项目贡献者</span>
    <Link href="/licenses" className="font-semibold text-accent hover:underline">版权与许可</Link>
  </footer>;
}
