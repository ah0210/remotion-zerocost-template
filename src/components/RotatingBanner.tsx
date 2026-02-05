"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type BannerItem = {
  title: string;
  subtitle?: string;
  href: string;
  label?: string;
  image?: string;
};

const clampIndex = (index: number, length: number) => {
  if (length <= 0) {
    return 0;
  }
  const mod = index % length;
  return mod < 0 ? mod + length : mod;
};

/** 循环展示广告 Banner，支持自动轮播与手动切换，并可跳转到介绍页。 */
export const RotatingBanner = ({
  intervalMs = 5000,
  items,
}: {
  intervalMs?: number;
  items?: BannerItem[];
}) => {
  const resolvedItems = useMemo<BannerItem[]>(
    () =>
      items ?? [
        {
          label: "工具介绍",
          title: "Remotion 视频生成器：静态部署、零服务器成本",
          subtitle: "了解它怎么在浏览器里完成渲染与导出",
          href: "/tool",
          image: "/banner-ad.svg",
        },
        {
          label: "快速上手",
          title: "上传图片 / 音频，一键生成可下载视频",
          subtitle: "支持模板与作品管理，适合重复出片",
          href: "/tool#quickstart",
        },
        {
          label: "留言和讨论",
          title: "使用建议和讨论",
          subtitle: "遇到问题或者建议欢迎留言和讨论",
          href: "https://17you.com/tool/remotion%E5%9C%A8%E7%BA%BF%E8%A7%86%E9%A2%91%E7%94%9F%E6%88%90%E6%97%A0%E9%9C%80%E6%9C%8D%E5%8A%A1%E5%99%A8%E6%97%A0%E9%9C%80aws/",
        },
      ],
    [items],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }
    if (resolvedItems.length <= 1) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => clampIndex(prev + 1, resolvedItems.length));
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, paused, resolvedItems.length]);

  const current = resolvedItems[clampIndex(activeIndex, resolvedItems.length)];
  if (!current) {
    return null;
  }

  return (
    <div
      className="sticky top-0 z-50 border-b border-unfocused-border-color bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8 supports-[padding:env(safe-area-inset-top)]:pt-[calc(env(safe-area-inset-top)+0.5rem)] py-2">
        <div className="flex items-center gap-3">
          <Link
            href={current.href}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            {current.image ? (
              <img
                src={current.image}
                alt=""
                className="h-8 w-16 object-cover rounded border border-unfocused-border-color"
              />
            ) : null}
            {current.label ? (
              <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border border-unfocused-border-color text-foreground bg-background">
                {current.label}
              </span>
            ) : null}
            <div className="min-w-0">
              <div
                key={`${activeIndex}-${current.title}`}
                className="text-sm font-medium text-foreground truncate transition-opacity duration-300 ease-in-out"
              >
                {current.title}
              </div>
              {current.subtitle ? (
                <div className="text-xs text-subtitle truncate mt-0.5">
                  {current.subtitle}
                </div>
              ) : null}
            </div>
            <div className="ml-auto text-xs text-subtitle shrink-0 hidden sm:block">
              了解更多 →
            </div>
          </Link>
          {resolvedItems.length > 1 ? (
            <div className="flex items-center gap-1 shrink-0">
              {resolvedItems.map((_, idx) => {
                const isActive = idx === clampIndex(activeIndex, resolvedItems.length);
                return (
                  <button
                    key={`dot-${idx}`}
                    type="button"
                    aria-label={`切换到第 ${idx + 1} 条`}
                    className={
                      "h-2.5 w-2.5 rounded-full border transition-colors " +
                      (isActive
                        ? "bg-foreground border-foreground"
                        : "bg-background border-unfocused-border-color hover:border-focused-border-color")
                    }
                    onClick={() => setActiveIndex(idx)}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

