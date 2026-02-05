import Link from "next/link";

/** 工具介绍页：说明本项目能做什么、如何使用，以及兼容性策略。 */
export default function ToolPage() {
  return (
    <div className="max-w-screen-md m-auto mb-12 mt-10 font-geist px-4">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">工具介绍</h1>
          <p className="text-sm text-subtitle mt-2">
            这是一个基于 Remotion + Next.js 的浏览器端视频生成工具：配置素材与样式后即可渲染并下载视频。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="text-sm font-medium text-foreground border border-unfocused-border-color rounded-geist px-3 py-2 hover:border-focused-border-color"
          >
            返回渲染页面
          </Link>
          <Link
            href="/works/new/template-selection"
            className="text-sm font-medium text-foreground border border-unfocused-border-color rounded-geist px-3 py-2 hover:border-focused-border-color"
          >
            去创建作品
          </Link>
          <Link
            href="https://17you.com/tool/remotion%E5%9C%A8%E7%BA%BF%E8%A7%86%E9%A2%91%E7%94%9F%E6%88%90%E6%97%A0%E9%9C%80%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%97%A0%E9%9C%80aws/"
            className="text-sm font-medium text-foreground border border-unfocused-border-color rounded-geist px-3 py-2 hover:border-focused-border-color"
          >
            留言和讨论
          </Link>
        </div>
      </div>

      <div className="border border-unfocused-border-color rounded-geist bg-background p-geist flex flex-col gap-6">
        <section>
          <h2 className="text-base font-bold text-foreground">它能做什么</h2>
          <ul className="mt-3 text-sm leading-6 text-subtitle list-disc pl-5 space-y-2">
            <li>支持作品管理：保存多个作品，随时切换并渲染。</li>
            <li>支持多种素材来源：本地上传或粘贴链接（图片 / 视频 / 音频）。</li>
            <li>支持模板：快速生成常见风格的成片结构。</li>
            <li>静态部署友好：无需后端服务即可运行。</li>
          </ul>
        </section>

        <section id="quickstart">
          <h2 className="text-base font-bold text-foreground">快速上手</h2>
          <ol className="mt-3 text-sm leading-6 text-subtitle list-decimal pl-5 space-y-2">
            <li>进入“渲染页面”，选择作品或新建作品。</li>
            <li>在作品页上传素材或填入素材链接，并设置样式。</li>
            <li>返回渲染页面点击“开始渲染”，完成后下载视频。</li>
          </ol>
        </section>

        <section id="compat">
          <h2 className="text-base font-bold text-foreground">留言与讨论</h2>
          <ul className="mt-3 text-sm leading-6 text-subtitle list-disc pl-5 space-y-2">
            <li>
              欢迎留言和讨论。
            </li>
            <li>
              <Link
            href="https://17you.com/tool/remotion%E5%9C%A8%E7%BA%BF%E8%A7%86%E9%A2%91%E7%94%9F%E6%88%90%E6%97%A0%E9%9C%80%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%97%A0%E9%9C%80aws/"
            className="text-sm font-medium text-foreground border border-unfocused-border-color rounded-geist px-3 py-2 hover:border-focused-border-color"
          >
            留言和讨论
          </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

