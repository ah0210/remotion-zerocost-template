import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { CompositionProps } from "../../../types/constants";
import { NextLogo } from "./NextLogo";
import { loadFont, fontFamily } from "@remotion/google-fonts/Inter";
import React from "react";
import { Rings } from "./Rings";
import { TextFade } from "./TextFade";

loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "700"],
});
export const Main = ({
  title,
  subtitle,
  badgeText,
  coverImageDataUrl,
  coverVideoDataUrl,
  logoImageDataUrl,
  imageArray,
  imageSequence,
  coverImageSequence,
  coverVideoSequence,
  audioSequence,
  imageEffect,
  transitionEffect,
  imageDurationInFrames,
  subtitles,
  audioDataUrl,
  backgroundColor,
  textColor,
  accentColor,
  titleFontSize,
  subtitleFontSize,
  titleDisplayFrames,
  captionsFontSize,
  captionsFontFamily,
  coverMediaType,
  mediaFit,
  mediaPosition,
  layout,
  showRings,
}: z.infer<typeof CompositionProps>) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const transitionStart = 2 * fps;
  const transitionDuration = 1 * fps;
  const resolvedTitleSize =
    titleFontSize ?? (layout === "center" ? 70 : 64);
  const resolvedSubtitleSize = subtitleFontSize ?? 24;
  const resolvedTitleDisplayFrames =
    titleDisplayFrames && titleDisplayFrames > 0
      ? Math.floor(titleDisplayFrames)
      : 0;
  const resolvedCaptionsSize =
    captionsFontSize && captionsFontSize > 0 ? captionsFontSize : 28;
  const resolvedCaptionsFontFamily =
    captionsFontFamily === "serif"
      ? "serif"
      : captionsFontFamily === "system"
        ? "system-ui"
        : fontFamily;
  const resolvedFit = mediaFit ?? "cover";
  const resolvedPosition = mediaPosition ?? "center";
  const resolvedMediaType = coverMediaType ?? "image";
  const resolvedCoverImageSource = coverImageDataUrl;
  const resolvedCoverVideoSource = coverVideoDataUrl;
  const resolvedImageArray = (imageArray ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const resolvedImageSequence = (imageSequence ?? [])
    .map((item) => ({
      src: item.src.trim(),
      durationInFrames: item.durationInFrames,
      effect: item.effect,
    }))
    .filter((item) => item.src.length > 0);
  const resolvedCoverImageSequence = (coverImageSequence ?? [])
    .map((item) => ({
      src: item.src.trim(),
      durationInFrames: item.durationInFrames,
    }))
    .filter((item) => item.src.length > 0);
  const resolvedCoverVideoSequence = (coverVideoSequence ?? [])
    .map((item) => ({
      src: item.src.trim(),
      durationInFrames: item.durationInFrames,
    }))
    .filter((item) => item.src.length > 0);
  const resolvedAudioSequence = (audioSequence ?? [])
    .map((item) => ({
      src: item.src.trim(),
      durationInFrames: item.durationInFrames,
    }))
    .filter((item) => item.src.length > 0);
  const resolvedSubtitles = (subtitles ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const resolvedImageEffect = imageEffect ?? "none";
  const resolvedTransitionEffect = transitionEffect ?? "fade";
  const resolvedTitle = title?.trim();
  const resolvedSubtitle = subtitle?.trim();
  const hasTitle = Boolean(resolvedTitle);
  const hasSubtitle = Boolean(resolvedSubtitle);
  const showTitleInCover =
    resolvedTitleDisplayFrames > 0 && frame < resolvedTitleDisplayFrames;

  const logoOut = spring({
    fps,
    frame,
    config: {
      damping: 200,
    },
    durationInFrames: transitionDuration,
    delay: transitionStart,
  });

  const fallbackItemDuration = Math.max(1, Math.floor(imageDurationInFrames ?? fps));
  const normalizeDuration = (value: number | undefined, fallback: number) => {
    const duration = value ? Math.floor(value) : 0;
    return duration > 0 ? duration : fallback;
  };
  const buildTimeline = (
    items: Array<{ src: string; durationInFrames?: number }>,
    fallbackDuration: number,
  ) => {
    if (items.length === 0) {
      return [];
    }
    const timeline: Array<{
      src: string;
      start: number;
      durationInFrames: number;
    }> = [];
    let start = 0;
    for (const item of items) {
      const durationInFrames = normalizeDuration(
        item.durationInFrames,
        fallbackDuration,
      );
      timeline.push({
        src: item.src,
        start,
        durationInFrames,
      });
      start += durationInFrames;
    }
    return timeline;
  };
  const resolvedImageItems =
    resolvedImageSequence.length > 0
      ? resolvedImageSequence
      : resolvedImageArray.map((src) => ({
          src,
          durationInFrames: imageDurationInFrames,
          effect: resolvedImageEffect,
        }));
  const resolvedCoverImageItems =
    resolvedCoverImageSequence.length > 0
      ? resolvedCoverImageSequence
      : resolvedCoverImageSource
        ? [{ src: resolvedCoverImageSource, durationInFrames: undefined }]
        : [];
  const resolvedVideoItems =
    resolvedCoverVideoSequence.length > 0
      ? resolvedCoverVideoSequence
      : resolvedCoverVideoSource
        ? [{ src: resolvedCoverVideoSource, durationInFrames: undefined }]
        : [];
  const useCoverVideo =
    resolvedCoverImageItems.length === 0 &&
    (resolvedMediaType === "video" || resolvedMediaType === "mixed") &&
    resolvedVideoItems.length > 0;
  const coverVideoItems = useCoverVideo ? [resolvedVideoItems[0]] : [];
  const contentVideoItems = useCoverVideo
    ? resolvedVideoItems.slice(1)
    : resolvedVideoItems;
  const coverItems =
    resolvedCoverImageItems.length > 0 ? resolvedCoverImageItems : coverVideoItems;
  const coverContentType =
    resolvedCoverImageItems.length > 0
      ? "image"
      : coverVideoItems.length > 0
        ? "video"
        : null;
  const coverTimeline = buildTimeline(coverItems, fallbackItemDuration);
  const coverDuration =
    coverTimeline.length > 0
      ? coverTimeline[coverTimeline.length - 1].start +
        coverTimeline[coverTimeline.length - 1].durationInFrames
      : 0;
  const coverDisplayDuration = Math.max(
    0,
    Math.floor(
      resolvedTitleDisplayFrames > 0
        ? Math.max(resolvedTitleDisplayFrames, coverDuration)
        : coverDuration,
    ),
  );
  const contentStart = coverDisplayDuration;
  const showTitleInContent = false;
  const contentTimeline = (() => {
    const timeline: Array<{
      src: string;
      start: number;
      durationInFrames: number;
      type: "image" | "video";
      effect?: "none" | "zoom-in" | "zoom-out";
    }> = [];
    let start = 0;
    const items: Array<{
      type: "image" | "video";
      src: string;
      durationInFrames?: number;
      effect?: "none" | "zoom-in" | "zoom-out";
    }> = [
      ...resolvedImageItems.map((item) => ({
        type: "image" as const,
        src: item.src,
        durationInFrames: item.durationInFrames,
        effect: item.effect,
      })),
      ...contentVideoItems.map((item) => ({
        type: "video" as const,
        src: item.src,
        durationInFrames: item.durationInFrames,
      })),
    ];
    for (const item of items) {
      const durationInFrames = normalizeDuration(
        item.durationInFrames,
        fallbackItemDuration,
      );
      timeline.push({
        src: item.src,
        start,
        durationInFrames,
        type: item.type,
        effect: item.effect,
      });
      start += durationInFrames;
    }
    return timeline;
  })();
  const contentDuration =
    contentTimeline.length > 0
      ? contentTimeline[contentTimeline.length - 1].start +
        contentTimeline[contentTimeline.length - 1].durationInFrames
      : Math.max(0, durationInFrames - contentStart);
  const coverExtraDuration = Math.max(0, coverDisplayDuration - coverDuration);
  const coverContentTransition =
    resolvedTransitionEffect === "fade" && coverDisplayDuration > 0 && contentDuration > 0
      ? Math.min(
          Math.floor(fps * 0.5),
          Math.floor(Math.min(coverDisplayDuration, contentDuration) / 2),
        )
      : 0;
  const coverOpacity =
    coverContentTransition > 0
      ? interpolate(
          frame,
          [coverDisplayDuration - coverContentTransition, coverDisplayDuration],
          [1, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        )
      : 1;
  const contentOpacity =
    coverContentTransition > 0
      ? interpolate(
          frame,
          [coverDisplayDuration - coverContentTransition, coverDisplayDuration],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        )
      : 1;
  const audioTimeline = buildTimeline(
    resolvedAudioSequence.length > 0
      ? resolvedAudioSequence
      : audioDataUrl
        ? [{ src: audioDataUrl }]
        : [],
    fallbackItemDuration,
  );
  const getOpacity = (
    relativeFrame: number,
    durationInFrames: number,
    fadeDuration: number,
    fadeIn: boolean,
    fadeOut: boolean,
  ) => {
    if (!fadeIn && !fadeOut) {
      return 1;
    }
    const safeFadeDuration =
      fadeDuration > 0 && durationInFrames - fadeDuration > fadeDuration
        ? fadeDuration
        : 0;
    if (safeFadeDuration === 0) {
      return 1;
    }
    if (fadeIn && fadeOut) {
      return interpolate(
        relativeFrame,
        [
          0,
          safeFadeDuration,
          durationInFrames - safeFadeDuration,
          durationInFrames,
        ],
        [0, 1, 1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
    }
    if (fadeIn) {
      return interpolate(
        relativeFrame,
        [0, safeFadeDuration],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
    }
    return interpolate(
      relativeFrame,
      [durationInFrames - safeFadeDuration, durationInFrames],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  };
  const perSubtitleDuration =
    resolvedSubtitles.length > 0
      ? Math.max(1, Math.floor(contentDuration / resolvedSubtitles.length))
      : 0;

  return (
    <AbsoluteFill
      className="bg-white"
      style={{
        backgroundColor: backgroundColor ?? "#ffffff",
      }}
    >
      {coverDisplayDuration > 0 ? (
        <Sequence durationInFrames={coverDisplayDuration}>
          <AbsoluteFill style={{ opacity: coverOpacity }}>
            {coverTimeline.length > 0 ? (
              coverTimeline.map((item, index) => {
                const isLast = index === coverTimeline.length - 1;
                const durationInFrames =
                  item.durationInFrames + (isLast ? coverExtraDuration : 0);
                const relativeFrame = frame - item.start;
                const fadeDuration =
                  resolvedTransitionEffect === "fade" && coverTimeline.length > 1
                    ? Math.min(
                        Math.floor(fps * 0.5),
                        Math.floor(durationInFrames / 2),
                      )
                    : 0;
                const opacity = getOpacity(
                  relativeFrame,
                  durationInFrames,
                  fadeDuration,
                  fadeDuration > 0,
                  fadeDuration > 0,
                );
                return (
                  <Sequence
                    key={`cover-${item.src}-${index}`}
                    from={item.start}
                    durationInFrames={durationInFrames}
                  >
                    {coverContentType === "video" ? (
                      <Video
                        src={item.src}
                        className="absolute inset-0 w-full h-full"
                        style={{
                          objectFit: resolvedFit,
                          objectPosition: resolvedPosition,
                          opacity,
                        }}
                      />
                    ) : (
                      <Img
                        src={item.src}
                        alt="封面素材"
                        className="absolute inset-0 w-full h-full"
                        style={{
                          objectFit: resolvedFit,
                          objectPosition: resolvedPosition,
                          opacity,
                        }}
                      />
                    )}
                  </Sequence>
                );
              })
            ) : null}
          </AbsoluteFill>
        </Sequence>
      ) : null}
      {showRings ? (
        <Sequence durationInFrames={transitionStart + transitionDuration}>
          <Rings outProgress={logoOut} accentColor={accentColor}></Rings>
          <AbsoluteFill className="justify-center items-center">
            <NextLogo outProgress={logoOut}></NextLogo>
          </AbsoluteFill>
        </Sequence>
      ) : null}
      <Sequence from={contentStart}>
        <AbsoluteFill style={{ opacity: contentOpacity }}>
          <TextFade centered={layout !== "full-screen"} enableMask={layout !== "full-screen"}>
            {layout === "left" ? (
            <div className="flex items-center justify-between gap-12 px-24">
              <div className="flex flex-col gap-6 max-w-[520px]">
                {badgeText ? (
                  <span
                    className="text-sm font-semibold px-3 py-1 rounded-full w-fit"
                    style={{
                      backgroundColor: accentColor ?? "#2563eb",
                      color: "#ffffff",
                    }}
                  >
                    {badgeText}
                  </span>
                ) : null}
                {logoImageDataUrl ? (
                  <Img
                    src={logoImageDataUrl}
                    alt="作品徽标"
                    className="w-[120px] h-[120px] object-contain"
                  />
                ) : null}
              {showTitleInContent && hasTitle ? (
                <h1
                  className="font-bold text-left"
                  style={{
                    fontFamily,
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedTitleSize}px`,
                  }}
                >
                  {resolvedTitle}
                </h1>
              ) : null}
              {showTitleInContent && hasSubtitle ? (
                  <p
                    className="text-left"
                    style={{
                      color: textColor ?? "#111827",
                      fontSize: `${resolvedSubtitleSize}px`,
                    }}
                  >
                  {resolvedSubtitle}
                  </p>
                ) : null}
              </div>
              {contentTimeline.length > 0 ? (
                <div className="relative w-[420px] h-[260px] rounded-2xl shadow-lg overflow-hidden">
                  {contentTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = contentTimeline.length === 1;
                    const effect =
                      item.type === "image"
                        ? item.effect ?? (isSingle ? resolvedImageEffect : "none")
                        : "none";
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      contentTimeline.length > 1
                        ? Math.min(
                            Math.floor(fps * 0.5),
                            Math.floor(item.durationInFrames / 2),
                          )
                        : 0;
                    const safeFadeDuration =
                      fadeDuration > 0 &&
                      item.durationInFrames - fadeDuration > fadeDuration
                        ? fadeDuration
                        : 0;
                    const opacity =
                      safeFadeDuration > 0
                        ? interpolate(
                            relativeFrame,
                            [
                              0,
                              safeFadeDuration,
                              item.durationInFrames - safeFadeDuration,
                              item.durationInFrames,
                            ],
                            [0, 1, 1, 0],
                            {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                            },
                          )
                        : 1;
                    const progress =
                      item.durationInFrames > 0
                        ? Math.min(
                            1,
                            Math.max(0, relativeFrame / item.durationInFrames),
                          )
                        : 0;
                    const scale =
                      item.type === "image" && isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : item.type === "image" && isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.type}-${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
                        {item.type === "video" ? (
                          <Video
                            src={item.src}
                            className="w-[420px] h-[260px] relative"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        ) : (
                          <Img
                            src={item.src}
                            alt="作品素材"
                            className="w-[420px] h-[260px] relative"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        )}
                      </Sequence>
                    );
                  })}
                </div>
              ) : null}
            </div>
            ) : layout === "image-top" ? (
            <div className="flex flex-col items-center gap-6">
              {contentTimeline.length > 0 ? (
                <div className="relative w-[520px] h-[300px] rounded-2xl shadow-lg overflow-hidden">
                  {contentTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = contentTimeline.length === 1;
                    const effect =
                      item.type === "image"
                        ? item.effect ?? (isSingle ? resolvedImageEffect : "none")
                        : "none";
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      contentTimeline.length > 1
                        ? Math.min(
                            Math.floor(fps * 0.5),
                            Math.floor(item.durationInFrames / 2),
                          )
                        : 0;
                    const safeFadeDuration =
                      fadeDuration > 0 &&
                      item.durationInFrames - fadeDuration > fadeDuration
                        ? fadeDuration
                        : 0;
                    const opacity =
                      safeFadeDuration > 0
                        ? interpolate(
                            relativeFrame,
                            [
                              0,
                              safeFadeDuration,
                              item.durationInFrames - safeFadeDuration,
                              item.durationInFrames,
                            ],
                            [0, 1, 1, 0],
                            {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                            },
                          )
                        : 1;
                    const progress =
                      item.durationInFrames > 0
                        ? Math.min(
                            1,
                            Math.max(0, relativeFrame / item.durationInFrames),
                          )
                        : 0;
                    const scale =
                      item.type === "image" && isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : item.type === "image" && isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.type}-${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
                        {item.type === "video" ? (
                          <Video
                            src={item.src}
                            className="w-[520px] h-[300px] relative"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        ) : (
                          <Img
                            src={item.src}
                            alt="作品素材"
                            className="w-[520px] h-[300px] relative"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        )}
                      </Sequence>
                    );
                  })}
                </div>
              ) : null}
              {badgeText ? (
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full w-fit"
                  style={{
                    backgroundColor: accentColor ?? "#2563eb",
                    color: "#ffffff",
                  }}
                >
                  {badgeText}
                </span>
              ) : null}
              {showTitleInContent && hasTitle ? (
                <h1
                  className="font-bold text-center"
                  style={{
                    fontFamily,
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedTitleSize}px`,
                  }}
                >
                  {resolvedTitle}
                </h1>
              ) : null}
              {showTitleInContent && hasSubtitle ? (
                <p
                  className="text-center"
                  style={{
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedSubtitleSize}px`,
                  }}
                >
                  {resolvedSubtitle}
                </p>
              ) : null}
              {logoImageDataUrl ? (
                <Img
                  src={logoImageDataUrl}
                  alt="作品徽标"
                  className="w-[120px] h-[120px] object-contain"
                />
              ) : null}
            </div>
            ) : layout === "full-screen" ? (
            <div className="relative w-full h-full">
              {contentTimeline.length > 0 ? (
                <div className="absolute inset-0">
                  {contentTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = contentTimeline.length === 1;
                    const effect =
                      item.type === "image"
                        ? item.effect ?? (isSingle ? resolvedImageEffect : "none")
                        : "none";
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      contentTimeline.length > 1
                        ? Math.min(
                            Math.floor(fps * 0.5),
                            Math.floor(item.durationInFrames / 2),
                          )
                        : 0;
                    const safeFadeDuration =
                      fadeDuration > 0 &&
                      item.durationInFrames - fadeDuration > fadeDuration
                        ? fadeDuration
                        : 0;
                    const opacity =
                      safeFadeDuration > 0
                        ? interpolate(
                            relativeFrame,
                            [
                              0,
                              safeFadeDuration,
                              item.durationInFrames - safeFadeDuration,
                              item.durationInFrames,
                            ],
                            [0, 1, 1, 0],
                            {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                            },
                          )
                        : 1;
                    const progress =
                      item.durationInFrames > 0
                        ? Math.min(
                            1,
                            Math.max(0, relativeFrame / item.durationInFrames),
                          )
                        : 0;
                    const scale =
                      item.type === "image" && isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : item.type === "image" && isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.type}-${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
                        {item.type === "video" ? (
                          <Video
                            src={item.src}
                            className="absolute inset-0 w-full h-full"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        ) : (
                          <Img
                            src={item.src}
                            alt="作品素材"
                            className="absolute inset-0 w-full h-full"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        )}
                      </Sequence>
                    );
                  })}
                </div>
              ) : null}
              {showTitleInContent && (hasTitle || hasSubtitle) ? (
                <TextFade centered={false} enableMask>
                  <AbsoluteFill className="items-center justify-center">
                    <div className="flex flex-col items-center gap-4 px-12">
                      {badgeText ? (
                        <span
                          className="text-sm font-semibold px-3 py-1 rounded-full w-fit"
                          style={{
                            backgroundColor: accentColor ?? "#2563eb",
                            color: "#ffffff",
                          }}
                        >
                          {badgeText}
                        </span>
                      ) : null}
                      {logoImageDataUrl ? (
                        <Img
                          src={logoImageDataUrl}
                          alt="作品徽标"
                          className="w-[120px] h-[120px] object-contain"
                        />
                      ) : null}
                      {hasTitle ? (
                        <h1
                          className="font-bold text-center"
                          style={{
                            fontFamily,
                            color: textColor ?? "#ffffff",
                            fontSize: `${resolvedTitleSize}px`,
                          }}
                        >
                          {resolvedTitle}
                        </h1>
                      ) : null}
                      {hasSubtitle ? (
                        <p
                          className="text-center"
                          style={{
                            color: textColor ?? "#ffffff",
                            fontSize: `${resolvedSubtitleSize}px`,
                          }}
                        >
                          {resolvedSubtitle}
                        </p>
                      ) : null}
                    </div>
                  </AbsoluteFill>
                </TextFade>
              ) : null}
            </div>
            ) : (
            <div className="flex flex-col items-center gap-6">
              {badgeText ? (
                <span
                  className="text-sm font-semibold px-3 py-1 rounded-full w-fit"
                  style={{
                    backgroundColor: accentColor ?? "#2563eb",
                    color: "#ffffff",
                  }}
                >
                  {badgeText}
                </span>
              ) : null}
              {logoImageDataUrl ? (
                <Img
                  src={logoImageDataUrl}
                  alt="作品徽标"
                  className="w-[120px] h-[120px] object-contain"
                />
              ) : null}
              {showTitleInContent && hasTitle ? (
                <h1
                  className="font-bold text-center"
                  style={{
                    fontFamily,
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedTitleSize}px`,
                  }}
                >
                  {resolvedTitle}
                </h1>
              ) : null}
              {showTitleInContent && hasSubtitle ? (
                <p
                  className="text-center"
                  style={{
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedSubtitleSize}px`,
                  }}
                >
                  {resolvedSubtitle}
                </p>
              ) : null}
              {contentTimeline.length > 0 ? (
                <div className="relative w-[460px] h-[260px] rounded-2xl shadow-lg overflow-hidden">
                  {contentTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = contentTimeline.length === 1;
                    const effect =
                      item.type === "image"
                        ? item.effect ?? (isSingle ? resolvedImageEffect : "none")
                        : "none";
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      contentTimeline.length > 1
                        ? Math.min(
                            Math.floor(fps * 0.5),
                            Math.floor(item.durationInFrames / 2),
                          )
                        : 0;
                    const safeFadeDuration =
                      fadeDuration > 0 &&
                      item.durationInFrames - fadeDuration > fadeDuration
                        ? fadeDuration
                        : 0;
                    const opacity =
                      safeFadeDuration > 0
                        ? interpolate(
                            relativeFrame,
                            [
                              0,
                              safeFadeDuration,
                              item.durationInFrames - safeFadeDuration,
                              item.durationInFrames,
                            ],
                            [0, 1, 1, 0],
                            {
                              extrapolateLeft: "clamp",
                              extrapolateRight: "clamp",
                            },
                          )
                        : 1;
                    const progress =
                      item.durationInFrames > 0
                        ? Math.min(
                            1,
                            Math.max(0, relativeFrame / item.durationInFrames),
                          )
                        : 0;
                    const scale =
                      item.type === "image" && isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : item.type === "image" && isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.type}-${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
                        {item.type === "video" ? (
                          <Video
                            src={item.src}
                            className="w-[460px] h-[260px]"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        ) : (
                          <Img
                            src={item.src}
                            alt="作品素材"
                            className="w-[460px] h-[260px]"
                            style={{
                              objectFit: resolvedFit,
                              objectPosition: resolvedPosition,
                              opacity,
                              transform: `scale(${scale})`,
                            }}
                          />
                        )}
                      </Sequence>
                    );
                  })}
                </div>
              ) : null}
            </div>
            )}
          </TextFade>
        </AbsoluteFill>
      </Sequence>
      {showTitleInCover && (hasTitle || hasSubtitle) ? (
        <Sequence durationInFrames={resolvedTitleDisplayFrames}>
          <AbsoluteFill className="items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-12">
              {hasTitle ? (
                <h1
                  className="font-bold text-center"
                  style={{
                    fontFamily,
                    color: textColor ?? "#ffffff",
                    fontSize: `${resolvedTitleSize}px`,
                  }}
                >
                  {resolvedTitle}
                </h1>
              ) : null}
              {hasSubtitle ? (
                <p
                  className="text-center"
                  style={{
                    color: textColor ?? "#ffffff",
                    fontSize: `${resolvedSubtitleSize}px`,
                  }}
                >
                  {resolvedSubtitle}
                </p>
              ) : null}
            </div>
          </AbsoluteFill>
        </Sequence>
      ) : null}
      {resolvedSubtitles.length > 0
        ? resolvedSubtitles.map((line, index) => {
            const isLast = index === resolvedSubtitles.length - 1;
            const durationInFrames = isLast
              ? contentDuration - perSubtitleDuration * index
              : perSubtitleDuration;
            return (
              <Sequence
                key={`${line}-${index}`}
                from={contentStart + index * perSubtitleDuration}
                durationInFrames={durationInFrames}
              >
                <AbsoluteFill className="items-center justify-end pb-12">
                  <div
                    className="px-5 py-2 rounded-full font-semibold"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.55)",
                      color: "#ffffff",
                      fontFamily: resolvedCaptionsFontFamily,
                      fontSize: `${resolvedCaptionsSize}px`,
                    }}
                  >
                    {line}
                  </div>
                </AbsoluteFill>
              </Sequence>
            );
          })
        : null}
      {audioTimeline.length > 0
        ? audioTimeline.map((item, index) => (
            <Sequence
              key={`${item.src}-${index}`}
              from={item.start}
              durationInFrames={item.durationInFrames}
            >
              <Audio src={item.src} />
            </Sequence>
          ))
        : null}
    </AbsoluteFill>
  );
};
