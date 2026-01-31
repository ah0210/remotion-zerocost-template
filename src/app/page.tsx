"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import {
  COMP_NAME,
  defaultMyCompProps,
  CompositionProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { RenderControls } from "../components/RenderControls";
import { Spacing } from "../components/Spacing";
import { Tips } from "../components/Tips";
import { Main } from "../remotion/MyComp/Main";

type WorkItem = {
  id: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  coverImageDataUrl?: string;
  coverVideoDataUrl?: string;
  logoImageDataUrl?: string;
  coverImageMediaId?: string;
  coverVideoMediaId?: string;
  logoImageMediaId?: string;
  audioMediaId?: string;
  coverImageUrl?: string;
  coverVideoUrl?: string;
  logoImageUrl?: string;
  audioDataUrl?: string;
  audioUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  durationInFrames?: number;
  coverMediaType?: "image" | "video";
  mediaFit?: "cover" | "contain";
  mediaPosition?: "center" | "top" | "bottom" | "left" | "right";
  layout?: "center" | "left" | "image-top";
  showRings?: boolean;
  addToRenderPage: boolean;
  createdAt: number;
};

const STORAGE_KEY = "remotion-works";
const MEDIA_DB = "remotion-media";
const MEDIA_STORE = "assets";

const openMediaDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB 不可用"));
      return;
    }
    const request = indexedDB.open(MEDIA_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("打开存储失败"));
  });
};

const loadMediaBlob = async (mediaId: string): Promise<Blob | undefined> => {
  const db = await openMediaDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readonly");
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.get(mediaId);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () =>
      reject(request.error ?? new Error("读取素材失败"));
  });
  db.close();
  return blob;
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("读取素材失败"));
      }
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("读取素材失败"));
    reader.readAsDataURL(blob);
  });
};

const Home: NextPage = () => {
  const searchParams = useSearchParams();
  const [text, setText] = useState<string>(defaultMyCompProps.title);
  const [subtitle, setSubtitle] = useState<string>(
    defaultMyCompProps.subtitle ?? "",
  );
  const [coverImageDataUrl, setCoverImageDataUrl] = useState<
    string | undefined
  >(defaultMyCompProps.coverImageDataUrl);
  const [coverVideoDataUrl, setCoverVideoDataUrl] = useState<
    string | undefined
  >(defaultMyCompProps.coverVideoDataUrl);
  const [coverImageMediaId, setCoverImageMediaId] = useState<
    string | undefined
  >(undefined);
  const [coverVideoMediaId, setCoverVideoMediaId] = useState<
    string | undefined
  >(undefined);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(
    defaultMyCompProps.coverImageUrl ?? "",
  );
  const [coverVideoUrl, setCoverVideoUrl] = useState<string>(
    defaultMyCompProps.coverVideoDataUrl ?? "",
  );
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(
    defaultMyCompProps.backgroundColor,
  );
  const [badgeText, setBadgeText] = useState<string>(
    defaultMyCompProps.badgeText ?? "",
  );
  const [logoImageDataUrl, setLogoImageDataUrl] = useState<
    string | undefined
  >(defaultMyCompProps.logoImageDataUrl);
  const [logoImageMediaId, setLogoImageMediaId] = useState<
    string | undefined
  >(undefined);
  const [logoImageUrl, setLogoImageUrl] = useState<string>(
    defaultMyCompProps.logoImageUrl ?? "",
  );
  const [audioDataUrl, setAudioDataUrl] = useState<string | undefined>(
    defaultMyCompProps.audioDataUrl,
  );
  const [audioMediaId, setAudioMediaId] = useState<string | undefined>(
    undefined,
  );
  const [audioUrl, setAudioUrl] = useState<string>(
    defaultMyCompProps.audioDataUrl ?? "",
  );
  const [coverImageObjectUrl, setCoverImageObjectUrl] = useState<
    string | undefined
  >(undefined);
  const [coverVideoObjectUrl, setCoverVideoObjectUrl] = useState<
    string | undefined
  >(undefined);
  const [logoImageObjectUrl, setLogoImageObjectUrl] = useState<
    string | undefined
  >(undefined);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | undefined>(
    undefined,
  );
  const [coverImageServerDataUrl, setCoverImageServerDataUrl] = useState<
    string | undefined
  >(undefined);
  const [coverVideoServerDataUrl, setCoverVideoServerDataUrl] = useState<
    string | undefined
  >(undefined);
  const [logoImageServerDataUrl, setLogoImageServerDataUrl] = useState<
    string | undefined
  >(undefined);
  const [audioServerDataUrl, setAudioServerDataUrl] = useState<
    string | undefined
  >(undefined);
  const [textColor, setTextColor] = useState<string | undefined>(
    defaultMyCompProps.textColor,
  );
  const [accentColor, setAccentColor] = useState<string | undefined>(
    defaultMyCompProps.accentColor,
  );
  const [titleFontSize, setTitleFontSize] = useState<number>(
    defaultMyCompProps.titleFontSize ?? 70,
  );
  const [subtitleFontSize, setSubtitleFontSize] = useState<number>(
    defaultMyCompProps.subtitleFontSize ?? 24,
  );
  const [durationInFrames, setDurationInFrames] = useState<number>(
    defaultMyCompProps.durationInFrames ?? DURATION_IN_FRAMES,
  );
  const [coverMediaType, setCoverMediaType] = useState<"image" | "video">(
    defaultMyCompProps.coverMediaType ?? "image",
  );
  const [mediaFit, setMediaFit] = useState<"cover" | "contain">(
    defaultMyCompProps.mediaFit ?? "cover",
  );
  const [mediaPosition, setMediaPosition] = useState<
    "center" | "top" | "bottom" | "left" | "right"
  >(defaultMyCompProps.mediaPosition ?? "center");
  const [layout, setLayout] = useState<"center" | "left" | "image-top">(
    defaultMyCompProps.layout ?? "center",
  );
  const [showRings, setShowRings] = useState<boolean>(
    defaultMyCompProps.showRings ?? true,
  );
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("builtin");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as WorkItem[];
      if (Array.isArray(parsed)) {
        setWorks(parsed);
      }
    } catch {
      setWorks([]);
    }
  }, []);

  const persistWorks = (nextWorks: WorkItem[]) => {
    setWorks(nextWorks);
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorks));
    } catch {
      return;
    }
  };

  const availableWorks = useMemo(() => {
    return works.filter((work) => work.addToRenderPage);
  }, [works]);

  useEffect(() => {
    const requestedId = searchParams.get("workId");
    if (!requestedId) {
      return;
    }
    const exists = availableWorks.some((work) => work.id === requestedId);
    if (exists) {
      setSelectedWorkId(requestedId);
    }
  }, [availableWorks, searchParams]);

  useEffect(() => {
    if (selectedWorkId === "builtin") {
      setText(defaultMyCompProps.title);
      setSubtitle(defaultMyCompProps.subtitle ?? "");
      setBadgeText(defaultMyCompProps.badgeText ?? "");
      setCoverImageDataUrl(defaultMyCompProps.coverImageDataUrl);
      setCoverVideoDataUrl(defaultMyCompProps.coverVideoDataUrl);
      setLogoImageDataUrl(defaultMyCompProps.logoImageDataUrl);
      setCoverImageMediaId(undefined);
      setCoverVideoMediaId(undefined);
      setLogoImageMediaId(undefined);
      setAudioMediaId(undefined);
      setCoverImageUrl(defaultMyCompProps.coverImageUrl ?? "");
      setCoverVideoUrl(defaultMyCompProps.coverVideoDataUrl ?? "");
      setLogoImageUrl(defaultMyCompProps.logoImageUrl ?? "");
      setAudioDataUrl(defaultMyCompProps.audioDataUrl);
      setAudioUrl(defaultMyCompProps.audioDataUrl ?? "");
      setCoverImageObjectUrl(undefined);
      setCoverVideoObjectUrl(undefined);
      setLogoImageObjectUrl(undefined);
      setAudioObjectUrl(undefined);
      setBackgroundColor(defaultMyCompProps.backgroundColor);
      setTextColor(defaultMyCompProps.textColor);
      setAccentColor(defaultMyCompProps.accentColor);
      setTitleFontSize(defaultMyCompProps.titleFontSize ?? 70);
      setSubtitleFontSize(defaultMyCompProps.subtitleFontSize ?? 24);
      setDurationInFrames(
        defaultMyCompProps.durationInFrames ?? DURATION_IN_FRAMES,
      );
      setCoverMediaType(defaultMyCompProps.coverMediaType ?? "image");
      setMediaFit(defaultMyCompProps.mediaFit ?? "cover");
      setMediaPosition(defaultMyCompProps.mediaPosition ?? "center");
      setLayout(defaultMyCompProps.layout ?? "center");
      setShowRings(defaultMyCompProps.showRings ?? true);
      return;
    }
    const selected = availableWorks.find((work) => work.id === selectedWorkId);
    if (selected) {
      setText(selected.title);
      setSubtitle(selected.subtitle ?? "");
      setBadgeText(selected.badgeText ?? "");
      setCoverImageDataUrl(selected.coverImageDataUrl);
      setCoverVideoDataUrl(selected.coverVideoDataUrl);
      setLogoImageDataUrl(selected.logoImageDataUrl);
      setCoverImageMediaId(selected.coverImageMediaId);
      setCoverVideoMediaId(selected.coverVideoMediaId);
      setLogoImageMediaId(selected.logoImageMediaId);
      setAudioMediaId(selected.audioMediaId);
      setCoverImageUrl(selected.coverImageUrl ?? "");
      setCoverVideoUrl(selected.coverVideoUrl ?? "");
      setLogoImageUrl(selected.logoImageUrl ?? "");
      setAudioDataUrl(selected.audioDataUrl);
      setAudioUrl(selected.audioUrl ?? "");
      setBackgroundColor(selected.backgroundColor);
      setTextColor(selected.textColor);
      setAccentColor(selected.accentColor);
      setTitleFontSize(selected.titleFontSize ?? 70);
      setSubtitleFontSize(selected.subtitleFontSize ?? 24);
      setDurationInFrames(
        selected.durationInFrames ?? DURATION_IN_FRAMES,
      );
      setCoverMediaType(
        selected.coverMediaType ??
          (selected.coverVideoDataUrl || selected.coverVideoUrl
            ? "video"
            : "image"),
      );
      setMediaFit(selected.mediaFit ?? "cover");
      setMediaPosition(selected.mediaPosition ?? "center");
      setLayout(selected.layout ?? "center");
      setShowRings(selected.showRings ?? true);
    }
  }, [availableWorks, selectedWorkId]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const run = async () => {
      if (!coverImageMediaId) {
        setCoverImageObjectUrl(undefined);
        setCoverImageServerDataUrl(undefined);
        return;
      }
      try {
        const blob = await loadMediaBlob(coverImageMediaId);
        if (!active) {
          return;
        }
        if (!blob) {
          setCoverImageObjectUrl(undefined);
          setCoverImageServerDataUrl(undefined);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setCoverImageObjectUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return objectUrl;
        });
        const dataUrl = await blobToDataUrl(blob);
        if (active) {
          setCoverImageServerDataUrl(dataUrl);
        }
      } catch {
        if (active) {
          setCoverImageObjectUrl(undefined);
          setCoverImageServerDataUrl(undefined);
        }
      }
    };
    void run();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [coverImageMediaId]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const run = async () => {
      if (!coverVideoMediaId) {
        setCoverVideoObjectUrl(undefined);
        setCoverVideoServerDataUrl(undefined);
        return;
      }
      try {
        const blob = await loadMediaBlob(coverVideoMediaId);
        if (!active) {
          return;
        }
        if (!blob) {
          setCoverVideoObjectUrl(undefined);
          setCoverVideoServerDataUrl(undefined);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setCoverVideoObjectUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return objectUrl;
        });
        const dataUrl = await blobToDataUrl(blob);
        if (active) {
          setCoverVideoServerDataUrl(dataUrl);
        }
      } catch {
        if (active) {
          setCoverVideoObjectUrl(undefined);
          setCoverVideoServerDataUrl(undefined);
        }
      }
    };
    void run();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [coverVideoMediaId]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const run = async () => {
      if (!logoImageMediaId) {
        setLogoImageObjectUrl(undefined);
        setLogoImageServerDataUrl(undefined);
        return;
      }
      try {
        const blob = await loadMediaBlob(logoImageMediaId);
        if (!active) {
          return;
        }
        if (!blob) {
          setLogoImageObjectUrl(undefined);
          setLogoImageServerDataUrl(undefined);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setLogoImageObjectUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return objectUrl;
        });
        const dataUrl = await blobToDataUrl(blob);
        if (active) {
          setLogoImageServerDataUrl(dataUrl);
        }
      } catch {
        if (active) {
          setLogoImageObjectUrl(undefined);
          setLogoImageServerDataUrl(undefined);
        }
      }
    };
    void run();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [logoImageMediaId]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const run = async () => {
      if (!audioMediaId) {
        setAudioObjectUrl(undefined);
        setAudioServerDataUrl(undefined);
        return;
      }
      try {
        const blob = await loadMediaBlob(audioMediaId);
        if (!active) {
          return;
        }
        if (!blob) {
          setAudioObjectUrl(undefined);
          setAudioServerDataUrl(undefined);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setAudioObjectUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return objectUrl;
        });
        const dataUrl = await blobToDataUrl(blob);
        if (active) {
          setAudioServerDataUrl(dataUrl);
        }
      } catch {
        if (active) {
          setAudioObjectUrl(undefined);
          setAudioServerDataUrl(undefined);
        }
      }
    };
    void run();
    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioMediaId]);

  const inputProps: z.infer<typeof CompositionProps> = useMemo(() => {
    const resolvedCoverImage =
      coverImageUrl.trim().length > 0
        ? coverImageUrl.trim()
        : coverImageObjectUrl ?? coverImageDataUrl;
    const resolvedCoverVideo =
      coverVideoUrl.trim().length > 0
        ? coverVideoUrl.trim()
        : coverVideoObjectUrl ?? coverVideoDataUrl;
    const resolvedLogoImage =
      logoImageUrl.trim().length > 0
        ? logoImageUrl.trim()
        : logoImageObjectUrl ?? logoImageDataUrl;
    const resolvedAudio =
      audioUrl.trim().length > 0
        ? audioUrl.trim()
        : audioObjectUrl ?? audioDataUrl;
    return {
      title: text,
      subtitle: subtitle || undefined,
      badgeText: badgeText || undefined,
      coverImageDataUrl: resolvedCoverImage,
      coverVideoDataUrl: resolvedCoverVideo,
      logoImageDataUrl: resolvedLogoImage,
      audioDataUrl: resolvedAudio,
      backgroundColor,
      textColor,
      accentColor,
      titleFontSize,
      subtitleFontSize,
      durationInFrames,
      coverMediaType,
      mediaFit,
      mediaPosition,
      layout,
      showRings,
    };
  }, [
    accentColor,
    audioDataUrl,
    audioObjectUrl,
    audioUrl,
    backgroundColor,
    badgeText,
    coverImageDataUrl,
    coverImageObjectUrl,
    coverImageUrl,
    coverVideoDataUrl,
    coverVideoObjectUrl,
    coverVideoUrl,
    coverMediaType,
    layout,
    logoImageDataUrl,
    logoImageObjectUrl,
    logoImageUrl,
    mediaFit,
    mediaPosition,
    showRings,
    subtitle,
    subtitleFontSize,
    text,
    textColor,
    titleFontSize,
    durationInFrames,
  ]);

  const serverInputProps: z.infer<typeof CompositionProps> = useMemo(() => {
    const resolvedCoverImage =
      coverImageUrl.trim().length > 0
        ? coverImageUrl.trim()
        : coverImageServerDataUrl ?? coverImageDataUrl;
    const resolvedCoverVideo =
      coverVideoUrl.trim().length > 0
        ? coverVideoUrl.trim()
        : coverVideoServerDataUrl ?? coverVideoDataUrl;
    const resolvedLogoImage =
      logoImageUrl.trim().length > 0
        ? logoImageUrl.trim()
        : logoImageServerDataUrl ?? logoImageDataUrl;
    const resolvedAudio =
      audioUrl.trim().length > 0
        ? audioUrl.trim()
        : audioServerDataUrl ?? audioDataUrl;
    return {
      title: text,
      subtitle: subtitle || undefined,
      badgeText: badgeText || undefined,
      coverImageDataUrl: resolvedCoverImage,
      coverVideoDataUrl: resolvedCoverVideo,
      logoImageDataUrl: resolvedLogoImage,
      audioDataUrl: resolvedAudio,
      backgroundColor,
      textColor,
      accentColor,
      titleFontSize,
      subtitleFontSize,
      durationInFrames,
      coverMediaType,
      mediaFit,
      mediaPosition,
      layout,
      showRings,
    };
  }, [
    accentColor,
    audioDataUrl,
    audioServerDataUrl,
    audioUrl,
    backgroundColor,
    badgeText,
    coverImageDataUrl,
    coverImageServerDataUrl,
    coverImageUrl,
    coverVideoDataUrl,
    coverVideoServerDataUrl,
    coverVideoUrl,
    coverMediaType,
    layout,
    logoImageDataUrl,
    logoImageServerDataUrl,
    logoImageUrl,
    mediaFit,
    mediaPosition,
    showRings,
    subtitle,
    subtitleFontSize,
    text,
    textColor,
    titleFontSize,
    durationInFrames,
  ]);

  const handleDeleteWork = (id: string) => {
    const nextWorks = works.filter((work) => work.id !== id);
    persistWorks(nextWorks);
    if (selectedWorkId === id) {
      setSelectedWorkId("builtin");
    }
  };

  const handleToggleRenderPage = (id: string) => {
    const nextWorks = works.map((work) =>
      work.id === id
        ? { ...work, addToRenderPage: !work.addToRenderPage }
        : work,
    );
    persistWorks(nextWorks);
  };

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
          <Player
            component={Main}
            inputProps={inputProps}
            durationInFrames={durationInFrames}
            fps={VIDEO_FPS}
            compositionHeight={VIDEO_HEIGHT}
            compositionWidth={VIDEO_WIDTH}
            style={{
              // Can't use tailwind class for width since player's default styles take presedence over tailwind's,
              // but not over inline styles
              width: "100%",
            }}
            controls
            autoPlay
            loop
          />
        </div>
        <div className="border border-unfocused-border-color p-geist rounded-geist bg-background font-geist mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-foreground font-medium">选择作品</span>
            <select
              className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
              value={selectedWorkId}
              onChange={(e) => setSelectedWorkId(e.currentTarget.value)}
            >
              <option value="builtin">内置示例作品</option>
              {availableWorks.map((work) => (
                <option value={work.id} key={work.id}>
                  {work.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/works/new"
              className="border-foreground border rounded-geist bg-foreground text-background px-geist-half font-geist h-10 font-medium transition-all duration-150 ease-in-out inline-flex items-center text-sm hover:bg-background hover:text-foreground hover:border-focused-border-color"
            >
              新增作品
            </Link>
            <div className="text-xs text-subtitle flex items-center">
              新增作品后可在此处选择并渲染
            </div>
          </div>
          {works.length > 0 ? (
            <div className="border-t border-unfocused-border-color pt-4 flex flex-col gap-3">
              <div className="text-sm font-medium text-foreground">作品管理</div>
              {works.map((work) => (
                <div
                  key={work.id}
                  className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm"
                >
                  <div className="flex-1">
                    <div className="text-foreground font-medium">
                      {work.title}
                    </div>
                    <div className="text-xs text-subtitle">
                      {work.addToRenderPage ? "已加入渲染页" : "未加入渲染页"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/works/new?workId=${work.id}`}
                      className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                    >
                      编辑
                    </Link>
                    <button
                      className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                      onClick={() => handleToggleRenderPage(work.id)}
                    >
                      {work.addToRenderPage ? "从渲染页移除" : "加入渲染页"}
                    </button>
                    <button
                      className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                      onClick={() => handleDeleteWork(work.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <RenderControls
          text={text}
          setText={setText}
          inputProps={inputProps}
        serverInputProps={serverInputProps}
          composition={{
            component: Main,
            id: COMP_NAME,
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            fps: VIDEO_FPS,
            durationInFrames,
            defaultProps: defaultMyCompProps,
          }}
        ></RenderControls>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <div className="border border-unfocused-border-color p-geist rounded-geist bg-background font-geist">
          <h3 className="text-foreground font-bold text-base mb-3">
            使用帮助
          </h3>
          <ol className="text-sm leading-6 text-subtitle list-decimal pl-5 space-y-2">
            <li>在输入框中填写你的视频标题。</li>
            <li>选择渲染方式：浏览器渲染或服务器渲染。</li>
            <li>点击“开始渲染”，等待进度完成。</li>
            <li>渲染完成后点击“下载视频”保存到本地。</li>
            <li>需要重新生成时，点击“重新开始”。</li>
          </ol>
        </div>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Spacing></Spacing>
        <Tips></Tips>
      </div>
    </div>
  );
};

export default Home;
