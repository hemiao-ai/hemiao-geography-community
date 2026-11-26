import { AppShell } from "@/components/shell/AppShell";

export default function Page() {
  return <AppShell active="" title="版权与许可">
    <section className="panel max-w-3xl space-y-5 p-5 text-sm leading-7 sm:p-6">
      <h2 className="h-display text-lg">禾苗地理社区版</h2>
      <p>© 2026 禾苗地理项目贡献者</p>
      <dl className="space-y-4">
        <div>
          <dt className="font-bold">项目代码</dt>
          <dd className="text-muted">按 <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noreferrer" className="text-accent underline">Apache-2.0</a> 提供。</dd>
        </div>
        <div>
          <dt className="font-bold">原创教学内容</dt>
          <dd className="text-muted">原创课程讲解、练习和教学示意图按 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-accent underline">CC BY 4.0</a> 提供。复用时请注明作者、来源、许可及改动。</dd>
        </div>
        <div>
          <dt className="font-bold">教材与第三方素材</dt>
          <dd className="text-muted">教材原书由资源提供方提供。天地图、WMO 气候观测数据和 Kenney 音效沿用各自的服务条款、署名要求或许可证。</dd>
        </div>
        <div>
          <dt className="font-bold">品牌</dt>
          <dd className="text-muted">禾苗名称、标识和宠物形象的品牌权利单独保留。</dd>
        </div>
      </dl>
    </section>
  </AppShell>;
}
