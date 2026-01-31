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
  const [text, setText] = useState<string>(defaultMyCompProps.title ?? "");
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
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [coverVideoUrl, setCoverVideoUrl] = useState<string>("");
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
  const [logoImageUrl, setLogoImageUrl] = useState<string>("");
  const [audioDataUrl, setAudioDataUrl] = useState<string | undefined>(
    defaultMyCompProps.audioDataUrl,
  );
  const [audioMediaId, setAudioMediaId] = useState<string | undefined>(
    undefined,
  );
  const [audioUrl, setAudioUrl] = useState<string>(
    defaultMyCompProps.audioDataUrl ?? "",
  );
  const [imageSequenceItems, setImageSequenceItems] = useState<
    ImageSequenceItem[]
  >([]);
  const [coverImageSequenceItems, setCoverImageSequenceItems] = useState<
    MediaSequenceItem[]
  >([]);
  const [coverVideoSequenceItems, setCoverVideoSequenceItems] = useState<
    MediaSequenceItem[]
  >([]);
  const [audioSequenceItems, setAudioSequenceItems] = useState<
    MediaSequenceItem[]
  >([]);
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
  const [coverImageObjectUrls, setCoverImageObjectUrls] = useState<string[]>(
    [],
  );
  const [coverVideoObjectUrls, setCoverVideoObjectUrls] = useState<string[]>(
    [],
  );
  const [audioObjectUrls, setAudioObjectUrls] = useState<string[]>([]);
  const [imageObjectUrls, setImageObjectUrls] = useState<string[]>([]);
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
  const [coverImageServerDataUrls, setCoverImageServerDataUrls] = useState<
    string[]
  >([]);
  const [coverVideoServerDataUrls, setCoverVideoServerDataUrls] = useState<
    string[]
  >([]);
  const [audioServerDataUrls, setAudioServerDataUrls] = useState<string[]>([]);
  const [imageServerDataUrls, setImageServerDataUrls] = useState<string[]>([]);
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
  const [titleDisplayFrames, setTitleDisplayFrames] = useState<number>(
    defaultMyCompProps.titleDisplayFrames ?? 90,
  );
  const [captionsFontSize, setCaptionsFontSize] = useState<number>(
    defaultMyCompProps.captionsFontSize ?? 28,
  );
  const [captionsFontFamily, setCaptionsFontFamily] = useState<string>(
    defaultMyCompProps.captionsFontFamily ?? "inter",
  );
  const [durationInFrames, setDurationInFrames] = useState<number>(
    defaultMyCompProps.durationInFrames ?? DURATION_IN_FRAMES,
  );
  const [coverMediaType, setCoverMediaType] = useState<
    "image" | "video" | "mixed"
  >(
    defaultMyCompProps.coverMediaType ?? "image",
  );
  const [mediaFit, setMediaFit] = useState<"cover" | "contain">(
    defaultMyCompProps.mediaFit ?? "cover",
  );
  const [mediaPosition, setMediaPosition] = useState<
    "center" | "top" | "bottom" | "left" | "right"
  >(defaultMyCompProps.mediaPosition ?? "center");
  const [layout, setLayout] = useState<
    "center" | "left" | "image-top" | "full-screen"
  >(
    defaultMyCompProps.layout ?? "center",
  );
  const [showRings, setShowRings] = useState<boolean>(
    defaultMyCompProps.showRings ?? true,
  );
  const [subtitles, setSubtitles] = useState<string[]>([]);
  const [imageEffect, setImageEffect] = useState<
    "none" | "zoom-in" | "zoom-out"
  >(defaultMyCompProps.imageEffect ?? "none");
  const [transitionEffect, setTransitionEffect] = useState<"none" | "fade">(
    defaultMyCompProps.transitionEffect ?? "fade",
  );
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("builtin");
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
      setText(defaultMyCompProps.title ?? "");
      setSubtitle(defaultMyCompProps.subtitle ?? "");
      setBadgeText(defaultMyCompProps.badgeText ?? "");
      setCoverImageDataUrl(defaultMyCompProps.coverImageDataUrl);
      setCoverVideoDataUrl(defaultMyCompProps.coverVideoDataUrl);
      setLogoImageDataUrl(defaultMyCompProps.logoImageDataUrl);
      setCoverImageMediaId(undefined);
      setCoverVideoMediaId(undefined);
      setLogoImageMediaId(undefined);
      setAudioMediaId(undefined);
      setCoverImageUrl("");
      setCoverVideoUrl("");
      setLogoImageUrl("");
      setAudioDataUrl(defaultMyCompProps.audioDataUrl);
      setAudioUrl(defaultMyCompProps.audioDataUrl ?? "");
      setImageSequenceItems(
        (defaultMyCompProps.imageArray ?? []).map((url) => ({
          type: "url",
          url,
        })),
      );
      setCoverImageSequenceItems([]);
      setCoverVideoSequenceItems([]);
      setAudioSequenceItems([]);
      setCoverImageObjectUrl(undefined);
      setCoverVideoObjectUrl(undefined);
      setLogoImageObjectUrl(undefined);
      setAudioObjectUrl(undefined);
      setCoverImageObjectUrls([]);
      setCoverVideoObjectUrls([]);
      setAudioObjectUrls([]);
      setImageObjectUrls([]);
      setBackgroundColor(defaultMyCompProps.backgroundColor);
      setTextColor(defaultMyCompProps.textColor);
      setAccentColor(defaultMyCompProps.accentColor);
      setTitleFontSize(defaultMyCompProps.titleFontSize ?? 70);
      setSubtitleFontSize(defaultMyCompProps.subtitleFontSize ?? 24);
      setTitleDisplayFrames(defaultMyCompProps.titleDisplayFrames ?? 90);
      setCaptionsFontSize(defaultMyCompProps.captionsFontSize ?? 28);
      setCaptionsFontFamily(defaultMyCompProps.captionsFontFamily ?? "inter");
      setDurationInFrames(
        defaultMyCompProps.durationInFrames ?? DURATION_IN_FRAMES,
      );
      setCoverMediaType(defaultMyCompProps.coverMediaType ?? "image");
      setMediaFit(defaultMyCompProps.mediaFit ?? "cover");
      setMediaPosition(defaultMyCompProps.mediaPosition ?? "center");
      setLayout(defaultMyCompProps.layout ?? "center");
      setShowRings(defaultMyCompProps.showRings ?? true);
      setSubtitles(defaultMyCompProps.subtitles ?? []);
      setImageEffect(defaultMyCompProps.imageEffect ?? "none");
      setTransitionEffect(defaultMyCompProps.transitionEffect ?? "fade");
      return;
    }
    const selected = availableWorks.find((work) => work.id === selectedWorkId);
    if (selected) {
      const fallbackImageSequenceItems: ImageSequenceItem[] = [
        ...(selected.imageMediaIds ?? []).map((mediaId) => ({
          type: "upload" as const,
          mediaId,
        })),
        ...(selected.imageUrls ?? []).map((url) => ({
          type: "url" as const,
          url,
        })),
      ];
      const fallbackCoverImageSequenceItems: MediaSequenceItem[] = [
        ...(selected.coverImageMediaId
          ? [
              {
                type: "upload" as const,
                mediaId: selected.coverImageMediaId,
              },
            ]
          : []),
        ...(selected.coverImageUrl
          ? [
              {
                type: "url" as const,
                url: selected.coverImageUrl,
              },
            ]
          : []),
        ...(selected.coverImageDataUrl
          ? [
              {
                type: "url" as const,
                url: selected.coverImageDataUrl,
              },
            ]
          : []),
      ];
      const fallbackCoverVideoSequenceItems: MediaSequenceItem[] = [
        ...(selected.coverVideoMediaId
          ? [
              {
                type: "upload" as const,
                mediaId: selected.coverVideoMediaId,
              },
            ]
          : []),
        ...(selected.coverVideoUrl
          ? [
              {
                type: "url" as const,
                url: selected.coverVideoUrl,
              },
            ]
          : []),
        ...(selected.coverVideoDataUrl
          ? [
              {
                type: "url" as const,
                url: selected.coverVideoDataUrl,
              },
            ]
          : []),
      ];
      const fallbackAudioSequenceItems: MediaSequenceItem[] = [
        ...(selected.audioMediaId
          ? [
              {
                type: "upload" as const,
                mediaId: selected.audioMediaId,
              },
            ]
          : []),
        ...(selected.audioUrl
          ? [
              {
                type: "url" as const,
                url: selected.audioUrl,
              },
            ]
          : []),
        ...(selected.audioDataUrl
          ? [
              {
                type: "url" as const,
                url: selected.audioDataUrl,
              },
            ]
          : []),
      ];
      const nextSequenceItems =
        selected.imageSequenceItems && selected.imageSequenceItems.length > 0
          ? selected.imageSequenceItems
          : fallbackImageSequenceItems;
      const nextCoverImageSequenceItems =
        selected.coverImageSequenceItems &&
        selected.coverImageSequenceItems.length > 0
          ? selected.coverImageSequenceItems
          : fallbackCoverImageSequenceItems;
      const nextCoverVideoSequenceItems =
        selected.coverVideoSequenceItems &&
        selected.coverVideoSequenceItems.length > 0
          ? selected.coverVideoSequenceItems
          : fallbackCoverVideoSequenceItems;
      const nextAudioSequenceItems =
        selected.audioSequenceItems && selected.audioSequenceItems.length > 0
          ? selected.audioSequenceItems
          : fallbackAudioSequenceItems;
      setText(selected.title ?? "");
      setSubtitle(selected.subtitle ?? "");
      setBadgeText(selected.badgeText ?? "");
      setCoverImageDataUrl(selected.coverImageDataUrl);
      setCoverVideoDataUrl(selected.coverVideoDataUrl);
      setLogoImageDataUrl(selected.logoImageDataUrl);
      setCoverImageMediaId(selected.coverImageMediaId);
      setCoverVideoMediaId(selected.coverVideoMediaId);
      setLogoImageMediaId(selected.logoImageMediaId);
      setAudioMediaId(selected.audioMediaId);
      setImageSequenceItems(nextSequenceItems);
      setCoverImageSequenceItems(nextCoverImageSequenceItems);
      setCoverVideoSequenceItems(nextCoverVideoSequenceItems);
      setAudioSequenceItems(nextAudioSequenceItems);
      setCoverImageUrl(
        nextCoverImageSequenceItems.find((item) => item.type === "url")?.url ??
          selected.coverImageUrl ??
          "",
      );
      setCoverVideoUrl(
        nextCoverVideoSequenceItems.find((item) => item.type === "url")?.url ??
          selected.coverVideoUrl ??
          "",
      );
      setLogoImageUrl(selected.logoImageUrl ?? "");
      setAudioDataUrl(selected.audioDataUrl);
      setAudioUrl(
        nextAudioSequenceItems.find((item) => item.type === "url")?.url ??
          selected.audioUrl ??
          "",
      );
      setBackgroundColor(selected.backgroundColor);
      setTextColor(selected.textColor);
      setAccentColor(selected.accentColor);
      setTitleFontSize(selected.titleFontSize ?? 70);
      setSubtitleFontSize(selected.subtitleFontSize ?? 24);
      setTitleDisplayFrames(selected.titleDisplayFrames ?? 90);
      setCaptionsFontSize(selected.captionsFontSize ?? 28);
      setCaptionsFontFamily(selected.captionsFontFamily ?? "inter");
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
      setSubtitles(selected.subtitles ?? []);
      setImageEffect(selected.imageEffect ?? "none");
      setTransitionEffect(selected.transitionEffect ?? "fade");
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

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    const run = async () => {
      if (coverImageMediaIds.length === 0) {
        setCoverImageObjectUrls([]);
        setCoverImageServerDataUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        const nextServerUrls: string[] = [];
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
          const dataUrl = await blobToDataUrl(blob);
          nextServerUrls.push(dataUrl);
        }
        if (active) {
          setCoverImageObjectUrls(nextObjectUrls);
          setCoverImageServerDataUrls(nextServerUrls);
        }
      } catch {
        if (active) {
          setCoverImageObjectUrls([]);
          setCoverImageServerDataUrls([]);
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
        setCoverVideoServerDataUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        const nextServerUrls: string[] = [];
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
          const dataUrl = await blobToDataUrl(blob);
          nextServerUrls.push(dataUrl);
        }
        if (active) {
          setCoverVideoObjectUrls(nextObjectUrls);
          setCoverVideoServerDataUrls(nextServerUrls);
        }
      } catch {
        if (active) {
          setCoverVideoObjectUrls([]);
          setCoverVideoServerDataUrls([]);
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
    const objectUrls: string[] = [];
    const run = async () => {
      if (audioMediaIds.length === 0) {
        setAudioObjectUrls([]);
        setAudioServerDataUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        const nextServerUrls: string[] = [];
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
          const dataUrl = await blobToDataUrl(blob);
          nextServerUrls.push(dataUrl);
        }
        if (active) {
          setAudioObjectUrls(nextObjectUrls);
          setAudioServerDataUrls(nextServerUrls);
        }
      } catch {
        if (active) {
          setAudioObjectUrls([]);
          setAudioServerDataUrls([]);
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
        setImageServerDataUrls([]);
        return;
      }
      try {
        const nextObjectUrls: string[] = [];
        const nextServerUrls: string[] = [];
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
          const dataUrl = await blobToDataUrl(blob);
          nextServerUrls.push(dataUrl);
        }
        if (active) {
          setImageObjectUrls(nextObjectUrls);
          setImageServerDataUrls(nextServerUrls);
        }
      } catch {
        if (active) {
          setImageObjectUrls([]);
          setImageServerDataUrls([]);
        }
      }
    };
    void run();
    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageMediaIds]);
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
  const imageServerDataUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    imageMediaIds.forEach((mediaId, index) => {
      const dataUrl = imageServerDataUrls[index];
      if (dataUrl) {
        map.set(mediaId, dataUrl);
      }
    });
    return map;
  }, [imageMediaIds, imageServerDataUrls]);
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
  const coverImageServerDataUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    coverImageMediaIds.forEach((mediaId, index) => {
      const dataUrl = coverImageServerDataUrls[index];
      if (dataUrl) {
        map.set(mediaId, dataUrl);
      }
    });
    return map;
  }, [coverImageMediaIds, coverImageServerDataUrls]);
  const coverVideoServerDataUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    coverVideoMediaIds.forEach((mediaId, index) => {
      const dataUrl = coverVideoServerDataUrls[index];
      if (dataUrl) {
        map.set(mediaId, dataUrl);
      }
    });
    return map;
  }, [coverVideoMediaIds, coverVideoServerDataUrls]);
  const audioServerDataUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    audioMediaIds.forEach((mediaId, index) => {
      const dataUrl = audioServerDataUrls[index];
      if (dataUrl) {
        map.set(mediaId, dataUrl);
      }
    });
    return map;
  }, [audioMediaIds, audioServerDataUrls]);

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
    const resolvedCoverImageSequence = coverImageSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? coverImageObjectUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedCoverVideoSequence = coverVideoSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? coverVideoObjectUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedAudioSequence = audioSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? audioObjectUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedImageSequence = imageSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? imageObjectUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedImageArray = resolvedImageSequence.map((item) => item.src);
    return {
      title: text,
      subtitle: subtitle || undefined,
      badgeText: badgeText || undefined,
      coverImageDataUrl: resolvedCoverImage,
      coverVideoDataUrl: resolvedCoverVideo,
      logoImageDataUrl: resolvedLogoImage,
      coverImageSequence:
        resolvedCoverImageSequence.length > 0
          ? resolvedCoverImageSequence
          : undefined,
      coverVideoSequence:
        resolvedCoverVideoSequence.length > 0
          ? resolvedCoverVideoSequence
          : undefined,
      audioSequence:
        resolvedAudioSequence.length > 0 ? resolvedAudioSequence : undefined,
      imageArray:
        resolvedImageSequence.length === 0 && resolvedImageArray.length > 0
          ? resolvedImageArray
          : undefined,
      imageSequence:
        resolvedImageSequence.length > 0 ? resolvedImageSequence : undefined,
      imageEffect,
      transitionEffect,
      subtitles: subtitles.length > 0 ? subtitles : undefined,
      audioDataUrl: resolvedAudio,
      backgroundColor,
      textColor,
      accentColor,
      titleFontSize,
      subtitleFontSize,
      titleDisplayFrames,
      captionsFontSize,
      captionsFontFamily,
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
    audioObjectUrlMap,
    audioSequenceItems,
    audioUrl,
    backgroundColor,
    badgeText,
    coverImageDataUrl,
    coverImageObjectUrl,
    coverImageObjectUrlMap,
    coverImageSequenceItems,
    coverImageUrl,
    coverVideoDataUrl,
    coverVideoObjectUrl,
    coverVideoObjectUrlMap,
    coverVideoSequenceItems,
    coverVideoUrl,
    coverMediaType,
    imageEffect,
    imageObjectUrlMap,
    imageSequenceItems,
    layout,
    logoImageDataUrl,
    logoImageObjectUrl,
    logoImageUrl,
    mediaFit,
    mediaPosition,
    showRings,
    subtitle,
    subtitleFontSize,
    subtitles,
    text,
    textColor,
    titleFontSize,
    titleDisplayFrames,
    captionsFontSize,
    captionsFontFamily,
    transitionEffect,
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
    const resolvedCoverImageSequence = coverImageSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? coverImageServerDataUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedCoverVideoSequence = coverVideoSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? coverVideoServerDataUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedAudioSequence = audioSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? audioServerDataUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedImageSequence = imageSequenceItems
      .map((item) => {
        const src =
          item.type === "upload"
            ? item.mediaId
              ? imageServerDataUrlMap.get(item.mediaId)
              : undefined
            : item.url;
        if (!src) {
          return null;
        }
        return {
          src,
          durationInFrames: item.durationInFrames,
        };
      })
      .filter(Boolean) as Array<{
      src: string;
      durationInFrames?: number;
    }>;
    const resolvedImageArray = resolvedImageSequence.map((item) => item.src);
    return {
      title: text,
      subtitle: subtitle || undefined,
      badgeText: badgeText || undefined,
      coverImageDataUrl: resolvedCoverImage,
      coverVideoDataUrl: resolvedCoverVideo,
      logoImageDataUrl: resolvedLogoImage,
      coverImageSequence:
        resolvedCoverImageSequence.length > 0
          ? resolvedCoverImageSequence
          : undefined,
      coverVideoSequence:
        resolvedCoverVideoSequence.length > 0
          ? resolvedCoverVideoSequence
          : undefined,
      audioSequence:
        resolvedAudioSequence.length > 0 ? resolvedAudioSequence : undefined,
      imageArray:
        resolvedImageSequence.length === 0 && resolvedImageArray.length > 0
          ? resolvedImageArray
          : undefined,
      imageSequence:
        resolvedImageSequence.length > 0 ? resolvedImageSequence : undefined,
      imageEffect,
      transitionEffect,
      subtitles: subtitles.length > 0 ? subtitles : undefined,
      audioDataUrl: resolvedAudio,
      backgroundColor,
      textColor,
      accentColor,
      titleFontSize,
      subtitleFontSize,
      titleDisplayFrames,
      captionsFontSize,
      captionsFontFamily,
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
    audioSequenceItems,
    audioServerDataUrlMap,
    audioUrl,
    backgroundColor,
    badgeText,
    coverImageDataUrl,
    coverImageServerDataUrl,
    coverImageSequenceItems,
    coverImageServerDataUrlMap,
    coverImageUrl,
    coverVideoDataUrl,
    coverVideoServerDataUrl,
    coverVideoSequenceItems,
    coverVideoServerDataUrlMap,
    coverVideoUrl,
    coverMediaType,
    imageEffect,
    imageSequenceItems,
    imageServerDataUrlMap,
    layout,
    logoImageDataUrl,
    logoImageServerDataUrl,
    logoImageUrl,
    mediaFit,
    mediaPosition,
    showRings,
    subtitle,
    subtitleFontSize,
    subtitles,
    text,
    textColor,
    titleFontSize,
    titleDisplayFrames,
    captionsFontSize,
    captionsFontFamily,
    transitionEffect,
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
                  {work.title ?? "未命名作品"}
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
                      {work.title ?? "未命名作品"}
                    </div>
                    <div className="text-xs text-subtitle">
                      {work.addToRenderPage ? "已加入渲染页" : "未加入渲染页"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/works/new?workId=${work.id}`}
                      className="text-xs text-foreground border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                    >
                      编辑
                    </Link>
                    <button
                      className="text-xs text-foreground border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
                      onClick={() => handleToggleRenderPage(work.id)}
                    >
                      {work.addToRenderPage ? "从渲染页移除" : "加入渲染页"}
                    </button>
                    <button
                      className="text-xs text-foreground border border-unfocused-border-color rounded-geist px-2 py-1 hover:border-focused-border-color"
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
