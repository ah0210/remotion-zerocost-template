"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const TemplateSelectionPage = () => {
  const router = useRouter();
  const templates = useMemo(
    () => [
      {
        id: "template-product",
        name: "产品发布",
        description: "强调标签 + 左侧图文",
      },
      {
        id: "template-brand",
        name: "品牌展示",
        description: "居中排版 + 简洁背景",
      },
      {
        id: "template-video",
        name: "视频节奏",
        description: "顶部视频 + 强节奏",
      },
      {
        id: "template-wechat-video",
        name: "视频号短片",
        description: "高对比 + 适合短视频",
      },
    ],
    [],
  );

  return (
    <div className="max-w-screen-md m-auto mb-12 mt-10 font-geist px-4">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs text-subtitle">步骤 1/2</div>
          <h1 className="text-2xl font-bold text-foreground">选择模板</h1>
          <p className="text-sm text-subtitle mt-2">
            选择模板后进入素材设置页面。
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-foreground border border-unfocused-border-color rounded-geist px-3 py-2 hover:border-focused-border-color"
        >
          返回渲染页面
        </Link>
      </div>
      <div className="border border-unfocused-border-color rounded-geist bg-background p-geist flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">模板一键套用</h2>
          <p className="text-sm text-subtitle mt-1">
            点击模板即可进入素材设置并继续调整。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="text-left border border-unfocused-border-color rounded-geist p-3 hover:border-focused-border-color transition-colors"
              onClick={() =>
                router.push(
                  `/works/new?templateId=${encodeURIComponent(template.id)}`,
                )
              }
            >
              <div className="text-sm font-medium text-foreground">
                {template.name}
              </div>
              <div className="text-xs text-subtitle mt-1">
                {template.description}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelectionPage;
