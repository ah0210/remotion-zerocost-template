"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { DURATION_IN_FRAMES } from "../../../../types/constants";

type WorkItem = {
  id: string;
  title?: string;
  subtitle?: string;
  badgeText?: string;
  coverImageDataUrl?: string;
  coverVideoDataUrl?: string;
  logoImageDataUrl?: string;
  coverImageMediaId?: string;
  coverVideoMediaId?: string;
  logoImageMediaId?: string;
  audioMediaId?: string;
  coverImageSequenceItems?: MediaSequenceItem[];
  coverVideoSequenceItems?: MediaSequenceItem[];
  audioSequenceItems?: MediaSequenceItem[];
  imageMediaIds?: string[];
  imageSequenceItems?: ImageSequenceItem[];
  imageEffect?: "none" | "zoom-in" | "zoom-out";
  transitionEffect?: "none" | "fade";
  coverImageUrl?: string;
  coverVideoUrl?: string;
  logoImageUrl?: string;
  imageUrls?: string[];
  audioDataUrl?: string;
  audioUrl?: string;
  subtitles?: string[];
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  titleDisplayFrames?: number;
  captionsFontSize?: number;
  captionsFontFamily?: string;
  durationInFrames?: number;
  coverMediaType?: "image" | "video" | "mixed";
  mediaFit?: "cover" | "contain";
  mediaPosition?: "center" | "top" | "bottom" | "left" | "right";
  layout?: "center" | "left" | "image-top" | "full-screen";
  showRings?: boolean;
  addToRenderPage: boolean;
  createdAt: number;
};

type ImageSequenceItem = {
  type: "upload" | "url";
  mediaId?: string;
  url?: string;
  durationInFrames?: number;
};

type MediaSequenceItem = {
  type: "upload" | "url";
  mediaId?: string;
  url?: string;
  durationInFrames?: number;
};

const STORAGE_KEY = "remotion-works";
const MEDIA_DB = "remotion-media";
const MEDIA_STORE = "assets";

const readWorks = (): WorkItem[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as WorkItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeWorks = (works: WorkItem[]) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
  } catch {
    throw new Error("写入存储失败");
  }
};

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

const storeMediaBlob = async (blob: Blob): Promise<string> => {
  const db = await openMediaDb();
  const mediaId = `media_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.put(blob, mediaId);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error("保存素材失败"));
    tx.onabort = () => reject(tx.error ?? new Error("保存素材失败"));
  });
  db.close();
  return mediaId;
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

const NewWorkPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [layout, setLayout] = useState<
    "center" | "left" | "image-top" | "full-screen"
  >("center");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111827");
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [coverImageDataUrl, setCoverImageDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [coverVideoDataUrl, setCoverVideoDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [logoImageDataUrl, setLogoImageDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [coverImageMediaId, setCoverImageMediaId] = useState<
    string | undefined
  >(undefined);
  const [coverVideoMediaId, setCoverVideoMediaId] = useState<
    string | undefined
  >(undefined);
  const [logoImageMediaId, setLogoImageMediaId] = useState<string | undefined>(
    undefined,
  );
  const [audioMediaId, setAudioMediaId] = useState<string | undefined>(
    undefined,
  );
  const [coverImageSequenceItems, setCoverImageSequenceItems] = useState<
    MediaSequenceItem[]
  >([]);
  const [coverVideoSequenceItems, setCoverVideoSequenceItems] = useState<
    MediaSequenceItem[]
  >([]);
  const [audioSequenceItems, setAudioSequenceItems] = useState<
    MediaSequenceItem[]
  >([]);
  const [imageSequenceItems, setImageSequenceItems] = useState<
    ImageSequenceItem[]
  >([]);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverVideoUrl, setCoverVideoUrl] = useState("");
  const [logoImageUrl, setLogoImageUrl] = useState("");
  const [audioDataUrl, setAudioDataUrl] = useState<string | undefined>(undefined);
  const [audioUrl, setAudioUrl] = useState("");
  const [imageUrlsInput, setImageUrlsInput] = useState("");
  const [logoImageObjectUrl, setLogoImageObjectUrl] = useState<
    string | undefined
  >(undefined);
  const [coverImageObjectUrls, setCoverImageObjectUrls] = useState<string[]>(
    [],
  );
  const [coverVideoObjectUrls, setCoverVideoObjectUrls] = useState<string[]>(
    [],
  );
  const [audioObjectUrls, setAudioObjectUrls] = useState<string[]>([]);
  const [imageObjectUrls, setImageObjectUrls] = useState<string[]>([]);
  const [subtitlesText, setSubtitlesText] = useState("");
  const [titleFontSize, setTitleFontSize] = useState("70");
  const [subtitleFontSize, setSubtitleFontSize] = useState("24");
  const [titleDisplayFrames, setTitleDisplayFrames] = useState("90");
  const [captionsFontSize, setCaptionsFontSize] = useState("28");
  const [captionsFontFamily, setCaptionsFontFamily] = useState("inter");
  const [durationInFrames, setDurationInFrames] = useState(
    String(DURATION_IN_FRAMES),
  );
  const [coverMediaType, setCoverMediaType] = useState<
    "image" | "video" | "mixed"
  >("image");
  const [mediaFit, setMediaFit] = useState<"cover" | "contain">("cover");
  const [mediaPosition, setMediaPosition] = useState<
    "center" | "top" | "bottom" | "left" | "right"
  >("center");
  const [showRings, setShowRings] = useState(true);
  const [imageEffect, setImageEffect] = useState<
    "none" | "zoom-in" | "zoom-out"
  >("none");
  const [transitionEffect, setTransitionEffect] = useState<"none" | "fade">(
    "fade",
  );
  const [addToRenderPage, setAddToRenderPage] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const imageMediaIds = useMemo(() => {
    return imageSequenceItems
      .filter((item) => item.type === "upload" && item.mediaId)
      .map((item) => item.mediaId as string);
  }, [imageSequenceItems]);
  const coverImageMediaIds = useMemo(() => {
    return coverImageSequenceItems
      .filter((item) => item.type === "upload" && item.mediaId)
      .map((item) => item.mediaId as string);
  }, [coverImageSequenceItems]);
  const coverVideoMediaIds = useMemo(() => {
    return coverVideoSequenceItems
      .filter((item) => item.type === "upload" && item.mediaId)
      .map((item) => item.mediaId as string);
  }, [coverVideoSequenceItems]);
  const audioMediaIds = useMemo(() => {
    return audioSequenceItems
      .filter((item) => item.type === "upload" && item.mediaId)
      .map((item) => item.mediaId as string);
  }, [audioSequenceItems]);

  const templates = useMemo(
    () => [
      {
        id: "template-product",
        name: "产品发布",
        description: "强调标签 + 左侧图文",
        data: {
          title: "新品发布会",
          subtitle: "为你的产品故事注入亮点",
          badgeText: "热销推荐",
          layout: "left" as const,
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
          accentColor: "#22d3ee",
          titleFontSize: 64,
          subtitleFontSize: 26,
          durationInFrames: 240,
          coverMediaType: "image" as const,
          mediaFit: "cover" as const,
          mediaPosition: "center" as const,
          showRings: true,
        },
      },
      {
        id: "template-brand",
        name: "品牌展示",
        description: "居中排版 + 简洁背景",
        data: {
          title: "品牌形象片",
          subtitle: "让你的品牌更有温度",
          badgeText: "故事感",
          layout: "center" as const,
          backgroundColor: "#ffffff",
          textColor: "#111827",
          accentColor: "#2563eb",
          titleFontSize: 72,
          subtitleFontSize: 24,
          durationInFrames: 200,
          coverMediaType: "image" as const,
          mediaFit: "contain" as const,
          mediaPosition: "center" as const,
          showRings: true,
        },
      },
      {
        id: "template-video",
        name: "视频节奏",
        description: "顶部视频 + 强节奏",
        data: {
          title: "节奏感视频",
          subtitle: "适合活动回顾或短片",
          badgeText: "氛围感",
          layout: "image-top" as const,
          backgroundColor: "#111827",
          textColor: "#f8fafc",
          accentColor: "#f97316",
          titleFontSize: 60,
          subtitleFontSize: 24,
          durationInFrames: 180,
          coverMediaType: "video" as const,
          mediaFit: "cover" as const,
          mediaPosition: "center" as const,
          showRings: false,
        },
      },
      {
        id: "template-wechat-video",
        name: "视频号短片",
        description: "高对比 + 适合短视频",
        data: {
          title: "视频号新品发布",
          subtitle: "15 秒抓住观众注意力",
          badgeText: "视频号推荐",
          layout: "image-top" as const,
          backgroundColor: "#0f172a",
          textColor: "#f8fafc",
          accentColor: "#38bdf8",
          titleFontSize: 64,
          subtitleFontSize: 22,
          durationInFrames: 150,
          coverMediaType: "image" as const,
          mediaFit: "cover" as const,
          mediaPosition: "center" as const,
          showRings: false,
        },
      },
    ],
    [],
  );

  const applyTemplate = (template: (typeof templates)[number]) => {
    setTitle(template.data.title);
    setSubtitle(template.data.subtitle);
    setBadgeText(template.data.badgeText);
    setLayout(template.data.layout);
    setBackgroundColor(template.data.backgroundColor);
    setTextColor(template.data.textColor);
    setAccentColor(template.data.accentColor);
    setTitleFontSize(String(template.data.titleFontSize));
    setSubtitleFontSize(String(template.data.subtitleFontSize));
    setTitleDisplayFrames("90");
    setCaptionsFontSize("28");
    setCaptionsFontFamily("inter");
    setDurationInFrames(String(template.data.durationInFrames));
    setCoverMediaType(template.data.coverMediaType);
    setMediaFit(template.data.mediaFit);
    setMediaPosition(template.data.mediaPosition);
    setShowRings(template.data.showRings);
    setCoverImageDataUrl(undefined);
    setCoverVideoDataUrl(undefined);
    setCoverImageMediaId(undefined);
    setCoverVideoMediaId(undefined);
    setLogoImageMediaId(undefined);
    setAudioMediaId(undefined);
    setCoverImageSequenceItems([]);
    setCoverVideoSequenceItems([]);
    setAudioSequenceItems([]);
    setCoverImageUrl("");
    setCoverVideoUrl("");
    setLogoImageDataUrl(undefined);
    setLogoImageUrl("");
    setAudioDataUrl(undefined);
    setAudioUrl("");
    setLogoImageObjectUrl(undefined);
    setCoverImageObjectUrls([]);
    setCoverVideoObjectUrls([]);
    setAudioObjectUrls([]);
    setImageSequenceItems([]);
    setImageObjectUrls([]);
    setImageUrlsInput("");
    setSubtitlesText("");
    setImageEffect("none");
    setTransitionEffect("fade");
    setSuccess("已套用模板，可继续调整。");
    setError("");
  };

  useEffect(() => {
    const workId = searchParams.get("workId");
    if (!workId) {
      setEditingId(null);
      return;
    }
    const works = readWorks();
    const target = works.find((work) => work.id === workId);
    if (!target) {
      setError("未找到对应的作品。");
      setEditingId(null);
      return;
    }
    setEditingId(target.id);
    setTitle(target.title ?? "");
    setSubtitle(target.subtitle ?? "");
    setBadgeText(target.badgeText ?? "");
    setLayout(target.layout ?? "center");
    setBackgroundColor(target.backgroundColor ?? "#ffffff");
    setTextColor(target.textColor ?? "#111827");
    setAccentColor(target.accentColor ?? "#2563eb");
    setCoverImageDataUrl(target.coverImageDataUrl);
    setCoverVideoDataUrl(target.coverVideoDataUrl);
    setLogoImageDataUrl(target.logoImageDataUrl);
    setCoverImageMediaId(target.coverImageMediaId);
    setCoverVideoMediaId(target.coverVideoMediaId);
    setLogoImageMediaId(target.logoImageMediaId);
    setAudioMediaId(target.audioMediaId);
    const fallbackCoverImageSequenceItems: MediaSequenceItem[] = [
      ...(target.coverImageMediaId
        ? [
            {
              type: "upload" as const,
              mediaId: target.coverImageMediaId,
            },
          ]
        : []),
      ...(target.coverImageUrl
        ? [
            {
              type: "url" as const,
              url: target.coverImageUrl,
            },
          ]
        : []),
      ...(target.coverImageDataUrl
        ? [
            {
              type: "url" as const,
              url: target.coverImageDataUrl,
            },
          ]
        : []),
    ];
    const fallbackCoverVideoSequenceItems: MediaSequenceItem[] = [
      ...(target.coverVideoMediaId
        ? [
            {
              type: "upload" as const,
              mediaId: target.coverVideoMediaId,
            },
          ]
        : []),
      ...(target.coverVideoUrl
        ? [
            {
              type: "url" as const,
              url: target.coverVideoUrl,
            },
          ]
        : []),
      ...(target.coverVideoDataUrl
        ? [
            {
              type: "url" as const,
              url: target.coverVideoDataUrl,
            },
          ]
        : []),
    ];
    const fallbackAudioSequenceItems: MediaSequenceItem[] = [
      ...(target.audioMediaId
        ? [
            {
              type: "upload" as const,
              mediaId: target.audioMediaId,
            },
          ]
        : []),
      ...(target.audioUrl
        ? [
            {
              type: "url" as const,
              url: target.audioUrl,
            },
          ]
        : []),
      ...(target.audioDataUrl
        ? [
            {
              type: "url" as const,
              url: target.audioDataUrl,
            },
          ]
        : []),
    ];
    const nextCoverImageSequenceItems =
      target.coverImageSequenceItems && target.coverImageSequenceItems.length > 0
        ? target.coverImageSequenceItems
        : fallbackCoverImageSequenceItems;
    const nextCoverVideoSequenceItems =
      target.coverVideoSequenceItems && target.coverVideoSequenceItems.length > 0
        ? target.coverVideoSequenceItems
        : fallbackCoverVideoSequenceItems;
    const nextAudioSequenceItems =
      target.audioSequenceItems && target.audioSequenceItems.length > 0
        ? target.audioSequenceItems
        : fallbackAudioSequenceItems;
    setCoverImageSequenceItems(nextCoverImageSequenceItems);
    setCoverVideoSequenceItems(nextCoverVideoSequenceItems);
    setAudioSequenceItems(nextAudioSequenceItems);
    const fallbackImageSequenceItems: ImageSequenceItem[] = [
      ...(target.imageMediaIds ?? []).map((mediaId) => ({
        type: "upload" as const,
        mediaId,
      })),
      ...(target.imageUrls ?? []).map((url) => ({
        type: "url" as const,
        url,
      })),
    ];
    const nextSequenceItems =
      target.imageSequenceItems && target.imageSequenceItems.length > 0
        ? target.imageSequenceItems
        : fallbackImageSequenceItems;
    setImageSequenceItems(nextSequenceItems);
    setCoverImageUrl(
      nextCoverImageSequenceItems.find((item) => item.type === "url")?.url ??
        target.coverImageUrl ??
        "",
    );
    setCoverVideoUrl(
      nextCoverVideoSequenceItems.find((item) => item.type === "url")?.url ??
        target.coverVideoUrl ??
        "",
    );
    setLogoImageUrl(target.logoImageUrl ?? "");
    setAudioDataUrl(target.audioDataUrl);
    setAudioUrl(
      nextAudioSequenceItems.find((item) => item.type === "url")?.url ??
        target.audioUrl ??
        "",
    );
    setImageUrlsInput(
      nextSequenceItems
        .filter((item) => item.type === "url")
        .map((item) => item.url ?? "")
        .filter(Boolean)
        .join("\n"),
    );
    setSubtitlesText((target.subtitles ?? []).join("\n"));
    setTitleFontSize(String(target.titleFontSize ?? 70));
    setSubtitleFontSize(String(target.subtitleFontSize ?? 24));
    setTitleDisplayFrames(String(target.titleDisplayFrames ?? 90));
    setCaptionsFontSize(String(target.captionsFontSize ?? 28));
    setCaptionsFontFamily(target.captionsFontFamily ?? "inter");
    setDurationInFrames(String(target.durationInFrames ?? DURATION_IN_FRAMES));
    setCoverMediaType(target.coverMediaType ?? "image");
    setMediaFit(target.mediaFit ?? "cover");
    setMediaPosition(target.mediaPosition ?? "center");
    setShowRings(target.showRings ?? true);
    setImageEffect(target.imageEffect ?? "none");
    setTransitionEffect(target.transitionEffect ?? "fade");
    setAddToRenderPage(target.addToRenderPage);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const run = async () => {
      if (coverImageMediaIds.length === 0) {
        setCoverImageObjectUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        for (const mediaId of coverImageMediaIds) {
          const blob = await loadMediaBlob(mediaId);
          if (!active) {
            return;
          }
          if (!blob) {
            continue;
          }
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          nextObjectUrls.push(objectUrl);
        }
        if (active) {
          setCoverImageObjectUrls(nextObjectUrls);
        }
      } catch {
        if (active) {
          setCoverImageObjectUrls([]);
        }
      }
    };
    void run();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverImageMediaIds]);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const run = async () => {
      if (coverVideoMediaIds.length === 0) {
        setCoverVideoObjectUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        for (const mediaId of coverVideoMediaIds) {
          const blob = await loadMediaBlob(mediaId);
          if (!active) {
            return;
          }
          if (!blob) {
            continue;
          }
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          nextObjectUrls.push(objectUrl);
        }
        if (active) {
          setCoverVideoObjectUrls(nextObjectUrls);
        }
      } catch {
        if (active) {
          setCoverVideoObjectUrls([]);
        }
      }
    };
    void run();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [coverVideoMediaIds]);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    const run = async () => {
      if (!logoImageMediaId) {
        setLogoImageObjectUrl(undefined);
        return;
      }
      try {
        const blob = await loadMediaBlob(logoImageMediaId);
        if (!active) {
          return;
        }
        if (!blob) {
          setLogoImageObjectUrl(undefined);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setLogoImageObjectUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return objectUrl;
        });
      } catch {
        if (active) {
          setLogoImageObjectUrl(undefined);
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
    const objectUrls: string[] = [];
    const run = async () => {
      if (audioMediaIds.length === 0) {
        setAudioObjectUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        for (const mediaId of audioMediaIds) {
          const blob = await loadMediaBlob(mediaId);
          if (!active) {
            return;
          }
          if (!blob) {
            continue;
          }
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          nextObjectUrls.push(objectUrl);
        }
        if (active) {
          setAudioObjectUrls(nextObjectUrls);
        }
      } catch {
        if (active) {
          setAudioObjectUrls([]);
        }
      }
    };
    void run();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [audioMediaIds]);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const run = async () => {
      if (imageMediaIds.length === 0) {
        setImageObjectUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        for (const mediaId of imageMediaIds) {
          const blob = await loadMediaBlob(mediaId);
          if (!active) {
            return;
          }
          if (!blob) {
            continue;
          }
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.push(objectUrl);
          nextObjectUrls.push(objectUrl);
        }
        if (active) {
          setImageObjectUrls(nextObjectUrls);
        }
      } catch {
        if (active) {
          setImageObjectUrls([]);
        }
      }
    };
    void run();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageMediaIds]);

  const previewStyle = useMemo(() => {
    return {
      backgroundColor,
    };
  }, [backgroundColor]);
  const resolvedTitleFontSize = Number(titleFontSize) || 70;
  const resolvedSubtitleFontSize = Number(subtitleFontSize) || 24;
  const resolvedTitleDisplayFrames = Number(titleDisplayFrames) || 0;
  const resolvedCaptionsFontSize = Number(captionsFontSize) || 28;
  const resolvedCaptionsFontFamily = captionsFontFamily.trim() || "inter";
  const resolvedDurationInFrames = Number(durationInFrames) || DURATION_IN_FRAMES;
  const resolvedTitleText = title.trim();
  const resolvedSubtitleText = subtitle.trim();
  const hasTitle = resolvedTitleText.length > 0;
  const hasSubtitle = resolvedSubtitleText.length > 0;
  const coverImageObjectUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    coverImageMediaIds.forEach((mediaId, index) => {
      const objectUrl = coverImageObjectUrls[index];
      if (objectUrl) {
        map.set(mediaId, objectUrl);
      }
    });
    return map;
  }, [coverImageMediaIds, coverImageObjectUrls]);
  const coverVideoObjectUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    coverVideoMediaIds.forEach((mediaId, index) => {
      const objectUrl = coverVideoObjectUrls[index];
      if (objectUrl) {
        map.set(mediaId, objectUrl);
      }
    });
    return map;
  }, [coverVideoMediaIds, coverVideoObjectUrls]);
  const audioObjectUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    audioMediaIds.forEach((mediaId, index) => {
      const objectUrl = audioObjectUrls[index];
      if (objectUrl) {
        map.set(mediaId, objectUrl);
      }
    });
    return map;
  }, [audioMediaIds, audioObjectUrls]);
  const resolvedCoverImageItems = useMemo(() => {
    return coverImageSequenceItems
      .map((item) => {
        if (item.type === "upload") {
          return item.mediaId ? coverImageObjectUrlMap.get(item.mediaId) : null;
        }
        return item.url?.trim() ?? null;
      })
      .filter(Boolean) as string[];
  }, [coverImageObjectUrlMap, coverImageSequenceItems]);
  const resolvedCoverVideoItems = useMemo(() => {
    return coverVideoSequenceItems
      .map((item) => {
        if (item.type === "upload") {
          return item.mediaId ? coverVideoObjectUrlMap.get(item.mediaId) : null;
        }
        return item.url?.trim() ?? null;
      })
      .filter(Boolean) as string[];
  }, [coverVideoObjectUrlMap, coverVideoSequenceItems]);
  const resolvedAudioItems = useMemo(() => {
    return audioSequenceItems
      .map((item) => {
        if (item.type === "upload") {
          return item.mediaId ? audioObjectUrlMap.get(item.mediaId) : null;
        }
        return item.url?.trim() ?? null;
      })
      .filter(Boolean) as string[];
  }, [audioObjectUrlMap, audioSequenceItems]);
  const resolvedCoverImage =
    resolvedCoverImageItems[0] ??
    (coverImageUrl.trim() ? coverImageUrl.trim() : coverImageDataUrl);
  const resolvedCoverVideo =
    resolvedCoverVideoItems[0] ??
    (coverVideoUrl.trim() ? coverVideoUrl.trim() : coverVideoDataUrl);
  const resolvedLogoImage =
    logoImageUrl.trim().length > 0
      ? logoImageUrl.trim()
      : logoImageObjectUrl ?? logoImageDataUrl;
  const resolvedAudio =
    resolvedAudioItems[0] ??
    (audioUrl.trim() ? audioUrl.trim() : audioDataUrl);
  const imageObjectUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    imageMediaIds.forEach((mediaId, index) => {
      const objectUrl = imageObjectUrls[index];
      if (objectUrl) {
        map.set(mediaId, objectUrl);
      }
    });
    return map;
  }, [imageMediaIds, imageObjectUrls]);
  const resolvedImageArray = useMemo(() => {
    return imageSequenceItems
      .map((item) => {
        if (item.type === "upload") {
          return item.mediaId ? imageObjectUrlMap.get(item.mediaId) : undefined;
        }
        return item.url?.trim();
      })
      .filter(Boolean) as string[];
  }, [imageObjectUrlMap, imageSequenceItems]);
  const previewMediaType =
    coverMediaType === "mixed" && resolvedCoverVideo
      ? resolvedImageArray.length > 0 || resolvedCoverImage
        ? "mixed"
        : "video"
      : resolvedImageArray.length > 0
        ? "multi-image"
        : coverMediaType === "video" && resolvedCoverVideo
          ? "video"
          : resolvedCoverImage
            ? "image"
            : "empty";

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const files = Array.from(e.currentTarget.files ?? []);
    if (files.length === 0) {
      return;
    }
    if (coverMediaType !== "mixed") {
      setCoverMediaType("image");
    }
    setCoverImageUrl("");
    setCoverImageDataUrl(undefined);
    try {
      const mediaIds: string[] = [];
      for (const file of files) {
        const mediaId = await storeMediaBlob(file);
        mediaIds.push(mediaId);
      }
      const uploadItems = mediaIds.map((mediaId) => ({
        type: "upload" as const,
        mediaId,
        durationInFrames: 60,
      }));
      setCoverImageSequenceItems((prev) => [...prev, ...uploadItems]);
    } catch {
      setError("封面素材保存失败，请改用链接或更小的文件。");
      setCoverImageSequenceItems((prev) =>
        prev.filter((item) => item.type !== "upload"),
      );
      setCoverImageObjectUrls([]);
    }
  };

  const handleVideoChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const files = Array.from(e.currentTarget.files ?? []);
    if (files.length === 0) {
      return;
    }
    if (coverMediaType !== "mixed") {
      setCoverMediaType("video");
    }
    setCoverVideoUrl("");
    setCoverVideoDataUrl(undefined);
    try {
      const mediaIds: string[] = [];
      for (const file of files) {
        const mediaId = await storeMediaBlob(file);
        mediaIds.push(mediaId);
      }
      const uploadItems = mediaIds.map((mediaId) => ({
        type: "upload" as const,
        mediaId,
        durationInFrames: 60,
      }));
      setCoverVideoSequenceItems((prev) => [...prev, ...uploadItems]);
    } catch {
      setError("视频素材保存失败，请改用链接或更小的文件。");
      setCoverVideoSequenceItems((prev) =>
        prev.filter((item) => item.type !== "upload"),
      );
      setCoverVideoObjectUrls([]);
    }
  };

  const handleAudioChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const files = Array.from(e.currentTarget.files ?? []);
    if (files.length === 0) {
      return;
    }
    setAudioUrl("");
    setAudioDataUrl(undefined);
    try {
      const mediaIds: string[] = [];
      for (const file of files) {
        const mediaId = await storeMediaBlob(file);
        mediaIds.push(mediaId);
      }
      const uploadItems = mediaIds.map((mediaId) => ({
        type: "upload" as const,
        mediaId,
        durationInFrames: 60,
      }));
      setAudioSequenceItems((prev) => [...prev, ...uploadItems]);
    } catch {
      setError("音频素材保存失败，请改用链接或更小的文件。");
      setAudioSequenceItems((prev) =>
        prev.filter((item) => item.type !== "upload"),
      );
      setAudioObjectUrls([]);
    }
  };

  const handleLogoChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.currentTarget.files?.[0];
    if (!file) {
      setLogoImageDataUrl(undefined);
      setLogoImageMediaId(undefined);
      setLogoImageObjectUrl(undefined);
      return;
    }
    setLogoImageUrl("");
    setLogoImageDataUrl(undefined);
    try {
      const mediaId = await storeMediaBlob(file);
      const objectUrl = URL.createObjectURL(file);
      setLogoImageMediaId(mediaId);
      setLogoImageObjectUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return objectUrl;
      });
    } catch {
      setError("徽标素材保存失败，请改用链接或更小的文件。");
      setLogoImageMediaId(undefined);
      setLogoImageObjectUrl(undefined);
    }
  };

  const handleMultiImageChange: React.ChangeEventHandler<HTMLInputElement> =
    async (e) => {
      const files = Array.from(e.currentTarget.files ?? []);
      if (files.length === 0) {
        return;
      }
      try {
        const mediaIds: string[] = [];
        for (const file of files) {
          const mediaId = await storeMediaBlob(file);
          mediaIds.push(mediaId);
        }
        const uploadItems = mediaIds.map((mediaId) => ({
          type: "upload" as const,
          mediaId,
          durationInFrames: 30,
        }));
        setImageSequenceItems((prev) => [...prev, ...uploadItems]);
      } catch {
        setError("多图素材保存失败，请改用链接或更小的文件。");
        setImageSequenceItems((prev) =>
          prev.filter((item) => item.type !== "upload"),
        );
        setImageObjectUrls([]);
      }
    };
  const syncImageUrlsInput = (items: ImageSequenceItem[]) => {
    const nextInput = items
      .filter((item) => item.type === "url")
      .map((item) => item.url ?? "")
      .filter(Boolean)
      .join("\n");
    setImageUrlsInput(nextInput);
  };
  const handleImageUrlsInputChange = (value: string) => {
    setImageUrlsInput(value);
    const urls = value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
    setImageSequenceItems((prev) => {
      const next: ImageSequenceItem[] = [];
      let urlIndex = 0;
      for (const item of prev) {
        if (item.type === "url") {
          if (urlIndex < urls.length) {
            next.push({
              ...item,
              url: urls[urlIndex],
            });
            urlIndex += 1;
          }
        } else {
          next.push(item);
        }
      }
      for (; urlIndex < urls.length; urlIndex += 1) {
        next.push({ type: "url", url: urls[urlIndex] });
      }
      return next;
    });
  };
  const moveImageSequenceItem = (fromIndex: number, toIndex: number) => {
    setImageSequenceItems((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      syncImageUrlsInput(next);
      return next;
    });
  };
  const removeImageSequenceItem = (index: number) => {
    setImageSequenceItems((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      syncImageUrlsInput(next);
      return next;
    });
  };
  const removeCoverImageSequenceItem = (index: number) => {
    setCoverImageSequenceItems((prev) => {
      const target = prev[index];
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      if (target?.type === "url") {
        setCoverImageUrl("");
      }
      return next;
    });
  };
  const updateCoverImageSequenceItem = (
    index: number,
    updates: Partial<MediaSequenceItem>,
  ) => {
    setCoverImageSequenceItems((prev) => {
      const target = prev[index];
      const next = prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      );
      if (target?.type === "url" && typeof updates.url === "string") {
        setCoverImageUrl(updates.url);
      }
      return next;
    });
  };
  const removeCoverVideoSequenceItem = (index: number) => {
    setCoverVideoSequenceItems((prev) => {
      const target = prev[index];
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      if (target?.type === "url") {
        setCoverVideoUrl("");
      }
      return next;
    });
  };
  const updateCoverVideoSequenceItem = (
    index: number,
    updates: Partial<MediaSequenceItem>,
  ) => {
    setCoverVideoSequenceItems((prev) => {
      const target = prev[index];
      const next = prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      );
      if (target?.type === "url" && typeof updates.url === "string") {
        setCoverVideoUrl(updates.url);
      }
      return next;
    });
  };
  const removeAudioSequenceItem = (index: number) => {
    setAudioSequenceItems((prev) => {
      const target = prev[index];
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      if (target?.type === "url") {
        setAudioUrl("");
      }
      return next;
    });
  };
  const updateAudioSequenceItem = (
    index: number,
    updates: Partial<MediaSequenceItem>,
  ) => {
    setAudioSequenceItems((prev) => {
      const target = prev[index];
      const next = prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      );
      if (target?.type === "url" && typeof updates.url === "string") {
        setAudioUrl(updates.url);
      }
      return next;
    });
  };
  const updateImageSequenceItem = (
    index: number,
    updates: Partial<ImageSequenceItem>,
  ) => {
    setImageSequenceItems((prev) => {
      const next = prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...updates } : item,
      );
      syncImageUrlsInput(next);
      return next;
    });
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (resolvedTitleFontSize <= 0) {
      setError("标题字号必须大于 0。");
      return;
    }
    if (resolvedSubtitleFontSize <= 0) {
      setError("副标题字号必须大于 0。");
      return;
    }
    if (resolvedTitleDisplayFrames < 0) {
      setError("标题展示帧数不能为负数。");
      return;
    }
    if (resolvedCaptionsFontSize <= 0) {
      setError("字幕字号必须大于 0。");
      return;
    }
    if (resolvedDurationInFrames <= 0) {
      setError("视频时长必须大于 0。");
      return;
    }
    if (
      coverImageSequenceItems.some(
        (item) =>
          item.durationInFrames !== undefined && item.durationInFrames <= 0,
      )
    ) {
      setError("封面素材帧数必须大于 0。");
      return;
    }
    if (
      coverVideoSequenceItems.some(
        (item) =>
          item.durationInFrames !== undefined && item.durationInFrames <= 0,
      )
    ) {
      setError("视频素材帧数必须大于 0。");
      return;
    }
    if (
      audioSequenceItems.some(
        (item) =>
          item.durationInFrames !== undefined && item.durationInFrames <= 0,
      )
    ) {
      setError("音频素材帧数必须大于 0。");
      return;
    }
    const resolvedSubtitles = subtitlesText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const normalizedImageSequenceItems = imageSequenceItems
      .map((item) => {
        if (item.type === "url") {
          const url = item.url?.trim();
          if (!url) {
            return null;
          }
          return {
            ...item,
            url,
          };
        }
        if (!item.mediaId) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as ImageSequenceItem[];
    const normalizedCoverImageSequenceItems = coverImageSequenceItems
      .map((item) => {
        if (item.type === "url") {
          const url = item.url?.trim();
          if (!url) {
            return null;
          }
          return {
            ...item,
            url,
          };
        }
        if (!item.mediaId) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as MediaSequenceItem[];
    const normalizedCoverVideoSequenceItems = coverVideoSequenceItems
      .map((item) => {
        if (item.type === "url") {
          const url = item.url?.trim();
          if (!url) {
            return null;
          }
          return {
            ...item,
            url,
          };
        }
        if (!item.mediaId) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as MediaSequenceItem[];
    const normalizedAudioSequenceItems = audioSequenceItems
      .map((item) => {
        if (item.type === "url") {
          const url = item.url?.trim();
          if (!url) {
            return null;
          }
          return {
            ...item,
            url,
          };
        }
        if (!item.mediaId) {
          return null;
        }
        return item;
      })
      .filter(Boolean) as MediaSequenceItem[];
    const resolvedImageMediaIds = normalizedImageSequenceItems
      .filter((item) => item.type === "upload")
      .map((item) => item.mediaId as string);
    const resolvedImageUrlsFromItems = normalizedImageSequenceItems
      .filter((item) => item.type === "url")
      .map((item) => item.url as string);

    const works = readWorks();
    if (editingId) {
      const nextWorks = works.map((work) =>
        work.id === editingId
          ? {
              ...work,
              title: resolvedTitleText.length > 0 ? resolvedTitleText : undefined,
              subtitle:
                resolvedSubtitleText.length > 0 ? resolvedSubtitleText : undefined,
              badgeText: badgeText.trim() ? badgeText.trim() : undefined,
              coverImageDataUrl,
              coverVideoDataUrl,
              logoImageDataUrl,
              coverImageMediaId,
              coverVideoMediaId,
              logoImageMediaId,
              audioMediaId,
              coverImageSequenceItems:
                normalizedCoverImageSequenceItems.length > 0
                  ? normalizedCoverImageSequenceItems
                  : undefined,
              coverVideoSequenceItems:
                normalizedCoverVideoSequenceItems.length > 0
                  ? normalizedCoverVideoSequenceItems
                  : undefined,
              audioSequenceItems:
                normalizedAudioSequenceItems.length > 0
                  ? normalizedAudioSequenceItems
                  : undefined,
              imageMediaIds:
                resolvedImageMediaIds.length > 0
                  ? resolvedImageMediaIds
                  : undefined,
              imageSequenceItems:
                normalizedImageSequenceItems.length > 0
                  ? normalizedImageSequenceItems
                  : undefined,
              imageEffect,
              transitionEffect,
              coverImageUrl: coverImageUrl.trim() || undefined,
              coverVideoUrl: coverVideoUrl.trim() || undefined,
              logoImageUrl: logoImageUrl.trim() || undefined,
              audioDataUrl,
              audioUrl: audioUrl.trim() || undefined,
              imageUrls:
                resolvedImageUrlsFromItems.length > 0
                  ? resolvedImageUrlsFromItems
                  : undefined,
              subtitles: resolvedSubtitles.length > 0 ? resolvedSubtitles : undefined,
              backgroundColor,
              textColor,
              accentColor,
              titleFontSize: resolvedTitleFontSize,
              subtitleFontSize: resolvedSubtitleFontSize,
              titleDisplayFrames: resolvedTitleDisplayFrames,
              captionsFontSize: resolvedCaptionsFontSize,
              captionsFontFamily: resolvedCaptionsFontFamily,
              durationInFrames: resolvedDurationInFrames,
              coverMediaType,
              mediaFit,
              mediaPosition,
              layout,
              showRings,
              addToRenderPage,
            }
          : work,
      );
      try {
        writeWorks(nextWorks);
      } catch {
        setError("保存失败：本地存储空间不足，请删除旧作品或改用链接。");
        return;
      }
      if (addToRenderPage) {
        router.push(`/?workId=${editingId}`);
        return;
      }
      setSuccess("作品已更新，未加入渲染页面。");
      return;
    }

    const newWork: WorkItem = {
      id: `work_${Date.now()}`,
      title: resolvedTitleText.length > 0 ? resolvedTitleText : undefined,
      subtitle: resolvedSubtitleText.length > 0 ? resolvedSubtitleText : undefined,
      badgeText: badgeText.trim() ? badgeText.trim() : undefined,
      coverImageDataUrl,
      coverVideoDataUrl,
      logoImageDataUrl,
      coverImageMediaId,
      coverVideoMediaId,
      logoImageMediaId,
      audioMediaId,
      coverImageSequenceItems:
        normalizedCoverImageSequenceItems.length > 0
          ? normalizedCoverImageSequenceItems
          : undefined,
      coverVideoSequenceItems:
        normalizedCoverVideoSequenceItems.length > 0
          ? normalizedCoverVideoSequenceItems
          : undefined,
      audioSequenceItems:
        normalizedAudioSequenceItems.length > 0
          ? normalizedAudioSequenceItems
          : undefined,
      imageMediaIds:
        resolvedImageMediaIds.length > 0 ? resolvedImageMediaIds : undefined,
      imageSequenceItems:
        normalizedImageSequenceItems.length > 0
          ? normalizedImageSequenceItems
          : undefined,
      imageEffect,
      transitionEffect,
      coverImageUrl: coverImageUrl.trim() || undefined,
      coverVideoUrl: coverVideoUrl.trim() || undefined,
      logoImageUrl: logoImageUrl.trim() || undefined,
      audioDataUrl,
      audioUrl: audioUrl.trim() || undefined,
      imageUrls:
        resolvedImageUrlsFromItems.length > 0
          ? resolvedImageUrlsFromItems
          : undefined,
      subtitles: resolvedSubtitles.length > 0 ? resolvedSubtitles : undefined,
      backgroundColor,
      textColor,
      accentColor,
      titleFontSize: resolvedTitleFontSize,
      subtitleFontSize: resolvedSubtitleFontSize,
      titleDisplayFrames: resolvedTitleDisplayFrames,
      captionsFontSize: resolvedCaptionsFontSize,
      captionsFontFamily: resolvedCaptionsFontFamily,
      durationInFrames: resolvedDurationInFrames,
      coverMediaType,
      mediaFit,
      mediaPosition,
      layout,
      showRings,
      addToRenderPage,
      createdAt: Date.now(),
    };

    try {
      writeWorks([newWork, ...works]);
    } catch {
      setError("保存失败：本地存储空间不足，请删除旧作品或改用链接。");
      return;
    }

    if (addToRenderPage) {
      router.push(`/?workId=${newWork.id}`);
      return;
    }

    setSuccess("作品已保存，未加入渲染页面。");
  };

  return (
    <div className="max-w-screen-md m-auto mb-12 mt-16 font-geist px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {editingId ? "编辑 Remotion 作品" : "新增 Remotion 作品"}
          </h1>
          <p className="text-sm text-subtitle mt-2">
            通过表单上传或填写素材，快速生成你的新作品。
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-foreground border border-unfocused-border-color rounded-geist px-3 py-2 hover:border-focused-border-color"
        >
          返回渲染页面
        </Link>
      </div>
      <div className="border border-unfocused-border-color rounded-geist bg-background p-geist mb-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">模板一键套用</h2>
          <p className="text-sm text-subtitle mt-1">
            选择模板后可继续修改素材与样式
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              className="text-left border border-unfocused-border-color rounded-geist p-3 hover:border-focused-border-color transition-colors"
              onClick={() => applyTemplate(template)}
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
      <form
        onSubmit={handleSubmit}
        className="border border-unfocused-border-color rounded-geist bg-background p-geist flex flex-col gap-4"
      >
        <label className="flex flex-col gap-2 text-sm text-foreground">
          作品标题
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            placeholder="例如：我的第一支视频"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          副标题
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={subtitle}
            onChange={(e) => setSubtitle(e.currentTarget.value)}
            placeholder="可选，用于补充说明"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          强调标签
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={badgeText}
            onChange={(e) => setBadgeText(e.currentTarget.value)}
            placeholder="可选，例如：新品发布"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          布局风格
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={layout}
            onChange={(e) =>
              setLayout(
                e.currentTarget.value as
                  | "center"
                  | "left"
                  | "image-top"
                  | "full-screen",
              )
            }
          >
            <option value="center">居中标题布局</option>
            <option value="left">左侧图文布局</option>
            <option value="image-top">图片在上布局</option>
            <option value="full-screen">铺满屏幕布局</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          素材类型
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={coverMediaType}
            onChange={(e) =>
              setCoverMediaType(
                e.currentTarget.value as "image" | "video" | "mixed",
              )
            }
          >
            <option value="image">图片</option>
            <option value="video">视频</option>
            <option value="mixed">图片 + 视频</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          素材裁切
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={mediaFit}
            onChange={(e) =>
              setMediaFit(e.currentTarget.value as "cover" | "contain")
            }
          >
            <option value="cover">裁切填充</option>
            <option value="contain">完整展示</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          素材对齐
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={mediaPosition}
            onChange={(e) =>
              setMediaPosition(
                e.currentTarget.value as
                  | "center"
                  | "top"
                  | "bottom"
                  | "left"
                  | "right",
              )
            }
          >
            <option value="center">居中</option>
            <option value="top">顶部</option>
            <option value="bottom">底部</option>
            <option value="left">左侧</option>
            <option value="right">右侧</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          背景颜色
          <input
            className="h-10 w-32 rounded-geist border border-unfocused-border-color p-1"
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.currentTarget.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          文本颜色
          <input
            className="h-10 w-32 rounded-geist border border-unfocused-border-color p-1"
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.currentTarget.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          强调色
          <input
            className="h-10 w-32 rounded-geist border border-unfocused-border-color p-1"
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.currentTarget.value)}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          标题字号
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            type="number"
            min={24}
            max={120}
            value={titleFontSize}
            onChange={(e) => setTitleFontSize(e.currentTarget.value)}
            placeholder="例如：70"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          副标题字号
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            type="number"
            min={16}
            max={80}
            value={subtitleFontSize}
            onChange={(e) => setSubtitleFontSize(e.currentTarget.value)}
            placeholder="例如：24"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          标题/副标题展示帧数
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            type="number"
            min={0}
            max={600}
            value={titleDisplayFrames}
            onChange={(e) => setTitleDisplayFrames(e.currentTarget.value)}
            placeholder="例如：90"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          视频时长（帧）
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            type="number"
            min={30}
            max={2000}
            value={durationInFrames}
            onChange={(e) => setDurationInFrames(e.currentTarget.value)}
            placeholder={`例如：${DURATION_IN_FRAMES}`}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          封面素材链接
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={coverImageUrl}
            onChange={(e) => {
              const nextUrl = e.currentTarget.value;
              setCoverImageUrl(nextUrl);
              if (coverMediaType !== "mixed") {
                setCoverMediaType("image");
              }
              setCoverImageDataUrl(undefined);
              setCoverImageMediaId(undefined);
              setCoverImageSequenceItems((prev) => {
                const uploadItems = prev.filter(
                  (item) => item.type === "upload",
                );
                const url = nextUrl.trim();
                if (!url) {
                  return uploadItems;
                }
                return [...uploadItems, { type: "url", url }];
              });
            }}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          上传封面素材
          <input
            className="text-sm"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
        {coverImageSequenceItems.length > 0 ? (
          <div className="flex flex-col gap-3 text-sm text-foreground">
            <div className="font-medium text-foreground">封面素材列表</div>
            <div className="flex flex-col gap-3">
              {coverImageSequenceItems.map((item, index) => {
                const previewSrc =
                  item.type === "upload"
                    ? item.mediaId
                      ? coverImageObjectUrlMap.get(item.mediaId)
                      : undefined
                    : item.url;
                return (
                  <div
                    key={`cover-image-${item.mediaId ?? item.url ?? index}`}
                    className="flex flex-col gap-2 border border-unfocused-border-color rounded-geist p-3"
                  >
                    <div className="flex items-center gap-3">
                      {previewSrc ? (
                        <Image
                          src={previewSrc}
                          alt="封面素材预览"
                          width={96}
                          height={64}
                          className="w-[96px] h-[64px] rounded-md object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-[96px] h-[64px] rounded-md bg-muted flex items-center justify-center text-xs text-subtitle">
                          无预览
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        {item.type === "url" ? (
                          <input
                            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                            value={item.url ?? ""}
                            onChange={(e) =>
                              updateCoverImageSequenceItem(index, {
                                url: e.currentTarget.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        ) : (
                          <div className="text-xs text-subtitle">上传素材</div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-subtitle">
                            显示帧数
                          </span>
                          <input
                            className="leading-[1.7] w-24 rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                            type="number"
                            min={1}
                            value={
                              item.durationInFrames !== undefined
                                ? item.durationInFrames
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.currentTarget.value;
                              const duration = value
                                ? Number(value)
                                : undefined;
                              updateCoverImageSequenceItem(index, {
                                durationInFrames:
                                  duration && duration > 0
                                    ? duration
                                    : undefined,
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color text-geist-error"
                        onClick={() => removeCoverImageSequenceItem(index)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <label className="flex flex-col gap-2 text-sm text-foreground">
          多图素材链接（每行一条）
          <textarea
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none min-h-[96px]"
            value={imageUrlsInput}
            onChange={(e) => handleImageUrlsInputChange(e.currentTarget.value)}
            placeholder="https://...&#10;https://..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          上传多张图片
          <input
            className="text-sm"
            type="file"
            accept="image/*"
            multiple
            onChange={handleMultiImageChange}
          />
        </label>
        {imageSequenceItems.length > 0 ? (
          <div className="flex flex-col gap-3 text-sm text-foreground">
            <div className="font-medium text-foreground">多图素材列表</div>
            <div className="flex flex-col gap-3">
              {imageSequenceItems.map((item, index) => {
                const previewSrc =
                  item.type === "upload"
                    ? item.mediaId
                      ? imageObjectUrlMap.get(item.mediaId)
                      : undefined
                    : item.url;
                return (
                  <div
                    key={`${item.type}-${item.mediaId ?? item.url ?? index}`}
                    className="flex flex-col gap-2 border border-unfocused-border-color rounded-geist p-3"
                  >
                    <div className="flex items-center gap-3">
                      {previewSrc ? (
                        <Image
                          src={previewSrc}
                          alt="多图素材预览"
                          width={96}
                          height={64}
                          className="w-[96px] h-[64px] rounded-md object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-[96px] h-[64px] rounded-md bg-muted flex items-center justify-center text-xs text-subtitle">
                          无预览
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        {item.type === "url" ? (
                          <input
                            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                            value={item.url ?? ""}
                            onChange={(e) =>
                              updateImageSequenceItem(index, {
                                url: e.currentTarget.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        ) : (
                          <div className="text-xs text-subtitle">
                            上传素材
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-subtitle">
                            显示帧数
                          </span>
                          <input
                            className="leading-[1.7] w-24 rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                            type="number"
                            min={1}
                            value={
                              item.durationInFrames !== undefined
                                ? item.durationInFrames
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.currentTarget.value;
                              const duration = value
                                ? Number(value)
                                : undefined;
                              updateImageSequenceItem(index, {
                                durationInFrames:
                                  duration && duration > 0
                                    ? duration
                                    : undefined,
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                        onClick={() => moveImageSequenceItem(index, index - 1)}
                        disabled={index === 0}
                      >
                        上移
                      </button>
                      <button
                        type="button"
                        className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                        onClick={() => moveImageSequenceItem(index, index + 1)}
                        disabled={index === imageSequenceItems.length - 1}
                      >
                        下移
                      </button>
                      <button
                        type="button"
                        className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color text-geist-error"
                        onClick={() => removeImageSequenceItem(index)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <label className="flex flex-col gap-2 text-sm text-foreground">
          单图特效
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={imageEffect}
            onChange={(e) =>
              setImageEffect(
                e.currentTarget.value as "none" | "zoom-in" | "zoom-out",
              )
            }
          >
            <option value="none">无特效</option>
            <option value="zoom-in">轻微放大</option>
            <option value="zoom-out">轻微缩小</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          多图过渡
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={transitionEffect}
            onChange={(e) =>
              setTransitionEffect(
                e.currentTarget.value as "none" | "fade",
              )
            }
          >
            <option value="fade">淡入淡出</option>
            <option value="none">无过渡</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          视频素材链接
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={coverVideoUrl}
            onChange={(e) => {
              const nextUrl = e.currentTarget.value;
              setCoverVideoUrl(nextUrl);
              if (coverMediaType !== "mixed") {
                setCoverMediaType("video");
              }
              setCoverVideoDataUrl(undefined);
              setCoverVideoMediaId(undefined);
              setCoverVideoSequenceItems((prev) => {
                const uploadItems = prev.filter(
                  (item) => item.type === "upload",
                );
                const url = nextUrl.trim();
                if (!url) {
                  return uploadItems;
                }
                return [...uploadItems, { type: "url", url }];
              });
            }}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          上传视频素材
          <input
            className="text-sm"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
          />
        </label>
        {coverVideoSequenceItems.length > 0 ? (
          <div className="flex flex-col gap-3 text-sm text-foreground">
            <div className="font-medium text-foreground">视频素材列表</div>
            <div className="flex flex-col gap-3">
              {coverVideoSequenceItems.map((item, index) => {
                const previewSrc =
                  item.type === "upload"
                    ? item.mediaId
                      ? coverVideoObjectUrlMap.get(item.mediaId)
                      : undefined
                    : item.url;
                return (
                  <div
                    key={`cover-video-${item.mediaId ?? item.url ?? index}`}
                    className="flex flex-col gap-2 border border-unfocused-border-color rounded-geist p-3"
                  >
                    <div className="flex items-center gap-3">
                      {previewSrc ? (
                        <video
                          className="w-[140px] h-[88px] rounded-md bg-muted object-cover"
                          src={previewSrc}
                          controls
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="w-[140px] h-[88px] rounded-md bg-muted flex items-center justify-center text-xs text-subtitle">
                          无预览
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        {item.type === "url" ? (
                          <input
                            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                            value={item.url ?? ""}
                            onChange={(e) =>
                              updateCoverVideoSequenceItem(index, {
                                url: e.currentTarget.value,
                              })
                            }
                            placeholder="https://..."
                          />
                        ) : (
                          <div className="text-xs text-subtitle">上传素材</div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-subtitle">
                            显示帧数
                          </span>
                          <input
                            className="leading-[1.7] w-24 rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                            type="number"
                            min={1}
                            value={
                              item.durationInFrames !== undefined
                                ? item.durationInFrames
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.currentTarget.value;
                              const duration = value
                                ? Number(value)
                                : undefined;
                              updateCoverVideoSequenceItem(index, {
                                durationInFrames:
                                  duration && duration > 0
                                    ? duration
                                    : undefined,
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color text-geist-error"
                        onClick={() => removeCoverVideoSequenceItem(index)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <label className="flex flex-col gap-2 text-sm text-foreground">
          音频素材链接
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={audioUrl}
            onChange={(e) => {
              const nextUrl = e.currentTarget.value;
              setAudioUrl(nextUrl);
              setAudioDataUrl(undefined);
              setAudioMediaId(undefined);
              setAudioSequenceItems((prev) => {
                const uploadItems = prev.filter(
                  (item) => item.type === "upload",
                );
                const url = nextUrl.trim();
                if (!url) {
                  return uploadItems;
                }
                return [...uploadItems, { type: "url", url }];
              });
            }}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          上传音频素材
          <input
            className="text-sm"
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
          />
        </label>
        {audioSequenceItems.length > 0 ? (
          <div className="flex flex-col gap-3 text-sm text-foreground">
            <div className="font-medium text-foreground">音频素材列表</div>
            <div className="flex flex-col gap-3">
              {audioSequenceItems.map((item, index) => {
                const previewSrc =
                  item.type === "upload"
                    ? item.mediaId
                      ? audioObjectUrlMap.get(item.mediaId)
                      : undefined
                    : item.url;
                return (
                  <div
                    key={`audio-${item.mediaId ?? item.url ?? index}`}
                    className="flex flex-col gap-2 border border-unfocused-border-color rounded-geist p-3"
                  >
                    <div className="flex items-center gap-3">
                      {previewSrc ? (
                        <audio
                          className="w-full"
                          controls
                          src={previewSrc}
                        />
                      ) : (
                        <div className="w-full h-12 rounded-md bg-muted flex items-center justify-center text-xs text-subtitle">
                          无预览
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.type === "url" ? (
                        <input
                          className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                          value={item.url ?? ""}
                          onChange={(e) =>
                            updateAudioSequenceItem(index, {
                              url: e.currentTarget.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      ) : (
                        <div className="text-xs text-subtitle">上传素材</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-subtitle">显示帧数</span>
                      <input
                        className="leading-[1.7] w-24 rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                        type="number"
                        min={1}
                        value={
                          item.durationInFrames !== undefined
                            ? item.durationInFrames
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.currentTarget.value;
                          const duration = value ? Number(value) : undefined;
                          updateAudioSequenceItem(index, {
                            durationInFrames:
                              duration && duration > 0 ? duration : undefined,
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color text-geist-error"
                        onClick={() => removeAudioSequenceItem(index)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
        <label className="flex flex-col gap-2 text-sm text-foreground">
          徽标素材链接
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={logoImageUrl}
            onChange={(e) => {
              setLogoImageUrl(e.currentTarget.value);
              setLogoImageDataUrl(undefined);
              setLogoImageMediaId(undefined);
              setLogoImageObjectUrl(undefined);
            }}
            placeholder="https://..."
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          上传徽标素材
          <input
            className="text-sm"
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          字幕内容（每行一句）
          <textarea
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none min-h-[96px]"
            value={subtitlesText}
            onChange={(e) => setSubtitlesText(e.currentTarget.value)}
            placeholder="第一句字幕&#10;第二句字幕"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          字幕字号
          <input
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            type="number"
            min={12}
            max={120}
            value={captionsFontSize}
            onChange={(e) => setCaptionsFontSize(e.currentTarget.value)}
            placeholder="例如：28"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-foreground">
          字幕字体
          <select
            className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
            value={captionsFontFamily}
            onChange={(e) => setCaptionsFontFamily(e.currentTarget.value)}
          >
            <option value="inter">Inter</option>
            <option value="system">系统默认</option>
            <option value="serif">衬线字体</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={showRings}
            onChange={(e) => setShowRings(e.currentTarget.checked)}
          />
          展示背景光环
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={addToRenderPage}
            onChange={(e) => setAddToRenderPage(e.currentTarget.checked)}
          />
          添加到渲染功能页面
        </label>
        {error ? <div className="text-geist-error text-sm">{error}</div> : null}
        {success ? (
          <div className="text-sm text-foreground">{success}</div>
        ) : null}
        <button
          type="submit"
          className="border-foreground border rounded-geist bg-foreground text-background px-geist-half font-geist h-10 font-medium transition-all duration-150 ease-in-out inline-flex items-center justify-center text-sm hover:bg-background hover:text-foreground hover:border-focused-border-color"
        >
          {editingId ? "保存修改" : "保存作品"}
        </button>
      </form>
      <div className="mt-8 border border-unfocused-border-color rounded-geist bg-background p-geist">
        <h3 className="text-base font-bold text-foreground mb-3">预览效果</h3>
        <div className="rounded-2xl p-6" style={previewStyle}>
          {layout === "left" ? (
            <div className="flex items-center justify-between gap-8">
              <div className="flex flex-col gap-3">
                {badgeText ? (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full w-fit"
                    style={{ backgroundColor: accentColor, color: "#ffffff" }}
                  >
                    {badgeText}
                  </span>
                ) : null}
                {resolvedLogoImage ? (
                  <Image
                    src={resolvedLogoImage}
                    alt="徽标预览"
                    width={72}
                    height={72}
                    className="w-[72px] h-[72px] object-contain"
                    unoptimized
                  />
                ) : null}
                {hasTitle ? (
                  <div
                    className="font-bold"
                    style={{
                      color: textColor,
                      fontSize: `${resolvedTitleFontSize}px`,
                    }}
                  >
                    {resolvedTitleText}
                  </div>
                ) : null}
                {hasSubtitle ? (
                  <div
                    className="text-sm"
                    style={{
                      color: textColor,
                      fontSize: `${resolvedSubtitleFontSize}px`,
                    }}
                  >
                    {resolvedSubtitleText}
                  </div>
                ) : null}
              </div>
              {previewMediaType === "video" && resolvedCoverVideo ? (
                <video
                  className="w-[220px] h-[140px] rounded-xl shadow-md"
                  src={resolvedCoverVideo}
                  muted
                  playsInline
                  loop
                  autoPlay
                  style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                />
              ) : previewMediaType === "multi-image" && resolvedImageArray[0] ? (
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={resolvedImageArray[0]}
                    alt="作品素材预览"
                    width={220}
                    height={140}
                    className="w-[220px] h-[140px] rounded-xl shadow-md"
                    style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                    unoptimized
                  />
                  <div className="text-[11px] text-subtitle">
                    共 {resolvedImageArray.length} 张
                  </div>
                </div>
              ) : previewMediaType === "image" && resolvedCoverImage ? (
                <Image
                  src={resolvedCoverImage}
                  alt="作品素材预览"
                  width={220}
                  height={140}
                  className="w-[220px] h-[140px] rounded-xl shadow-md"
                  style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                  unoptimized
                />
              ) : (
                <div className="w-[220px] h-[140px] rounded-xl border border-dashed border-unfocused-border-color flex items-center justify-center text-xs text-subtitle">
                  暂未上传素材
                </div>
              )}
            </div>
          ) : layout === "image-top" ? (
            <div className="flex flex-col items-center gap-3">
              {previewMediaType === "video" && resolvedCoverVideo ? (
                <video
                  className="w-[320px] h-[180px] rounded-xl shadow-md"
                  src={resolvedCoverVideo}
                  muted
                  playsInline
                  loop
                  autoPlay
                  style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                />
              ) : previewMediaType === "multi-image" && resolvedImageArray[0] ? (
                <div className="flex flex-col items-center gap-2">
                  <Image
                    src={resolvedImageArray[0]}
                    alt="作品素材预览"
                    width={320}
                    height={180}
                    className="w-[320px] h-[180px] rounded-xl shadow-md"
                    style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                    unoptimized
                  />
                  <div className="text-[11px] text-subtitle">
                    共 {resolvedImageArray.length} 张
                  </div>
                </div>
              ) : previewMediaType === "image" && resolvedCoverImage ? (
                <Image
                  src={resolvedCoverImage}
                  alt="作品素材预览"
                  width={320}
                  height={180}
                  className="w-[320px] h-[180px] rounded-xl shadow-md"
                  style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                  unoptimized
                />
              ) : (
                <div className="w-[320px] h-[180px] rounded-xl border border-dashed border-unfocused-border-color flex items-center justify-center text-xs text-subtitle">
                  暂未上传素材
                </div>
              )}
              {badgeText ? (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full w-fit"
                  style={{ backgroundColor: accentColor, color: "#ffffff" }}
                >
                  {badgeText}
                </span>
              ) : null}
              {hasTitle ? (
                <div
                  className="font-bold"
                  style={{
                    color: textColor,
                    fontSize: `${resolvedTitleFontSize}px`,
                  }}
                >
                  {resolvedTitleText}
                </div>
              ) : null}
              {hasSubtitle ? (
                <div
                  className="text-sm"
                  style={{
                    color: textColor,
                    fontSize: `${resolvedSubtitleFontSize}px`,
                  }}
                >
                  {resolvedSubtitleText}
                </div>
              ) : null}
              {resolvedLogoImage ? (
                <Image
                  src={resolvedLogoImage}
                  alt="徽标预览"
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] object-contain"
                  unoptimized
                />
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {badgeText ? (
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full w-fit"
                  style={{ backgroundColor: accentColor, color: "#ffffff" }}
                >
                  {badgeText}
                </span>
              ) : null}
            {resolvedLogoImage ? (
                <Image
                src={resolvedLogoImage}
                  alt="徽标预览"
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] object-contain"
                  unoptimized
                />
              ) : null}
            {hasTitle ? (
              <div
                className="font-bold"
                style={{
                  color: textColor,
                  fontSize: `${resolvedTitleFontSize}px`,
                }}
              >
                {resolvedTitleText}
              </div>
            ) : null}
            {hasSubtitle ? (
              <div
                className="text-sm"
                style={{
                  color: textColor,
                  fontSize: `${resolvedSubtitleFontSize}px`,
                }}
              >
                {resolvedSubtitleText}
              </div>
            ) : null}
            {previewMediaType === "video" && resolvedCoverVideo ? (
                <video
                className="w-[320px] h-[180px] rounded-xl shadow-md"
                src={resolvedCoverVideo}
                muted
                playsInline
                loop
                autoPlay
                style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
              />
              ) : previewMediaType === "multi-image" && resolvedImageArray[0] ? (
                <div className="flex flex-col items-center gap-2">
                  <Image
                  src={resolvedImageArray[0]}
                    alt="作品素材预览"
                    width={320}
                    height={180}
                    className="w-[320px] h-[180px] rounded-xl shadow-md"
                    style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                    unoptimized
                  />
                  <div className="text-[11px] text-subtitle">
                    共 {resolvedImageArray.length} 张
                  </div>
                </div>
              ) : previewMediaType === "image" && resolvedCoverImage ? (
                <Image
                src={resolvedCoverImage}
                  alt="作品素材预览"
                  width={320}
                  height={180}
                  className="w-[320px] h-[180px] rounded-xl shadow-md"
                  style={{ objectFit: mediaFit, objectPosition: mediaPosition }}
                  unoptimized
                />
              ) : (
                <div className="w-[320px] h-[180px] rounded-xl border border-dashed border-unfocused-border-color flex items-center justify-center text-xs text-subtitle">
                  暂未上传素材
                </div>
              )}
            </div>
          )}
        </div>
        {resolvedAudio ? (
          <div className="mt-4">
            <audio src={resolvedAudio} controls className="w-full" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default NewWorkPage;
