import { TdtMap } from "@/components/geo/TdtMap";
import { AppShell } from "@/components/shell/AppShell";
import { hasTianditu } from "@/lib/site";

export default function Page() {
  return <AppShell active="/maps" title="地图观察" subtitle="天地图标准底图">
    {hasTianditu ? <TdtMap labels className="max-w-4xl" /> :
      <p className="panel max-w-2xl p-5 text-sm leading-6 text-muted">请在 <code>.env.local</code> 中配置天地图 Key 和审图号，重新构建并启动后即可打开地图。</p>}
  </AppShell>;
}
