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
  const contentStart = transitionStart + transitionDuration / 2;
  const contentDuration = Math.max(1, durationInFrames - contentStart);
  const resolvedTitleSize =
    titleFontSize ?? (layout === "center" ? 70 : 64);
  const resolvedSubtitleSize = subtitleFontSize ?? 24;
  const resolvedFit = mediaFit ?? "cover";
  const resolvedPosition = mediaPosition ?? "center";
  const resolvedMediaType = coverMediaType ?? "image";
  const resolvedCoverImage = coverImageDataUrl;
  const resolvedCoverVideo = coverVideoDataUrl;
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
  const resolvedSubtitles = (subtitles ?? [])
    .map((item) => item.trim())
    .filter(Boolean);
  const resolvedImageEffect = imageEffect ?? "none";
  const resolvedTransitionEffect = transitionEffect ?? "fade";

  const logoOut = spring({
    fps,
    frame,
    config: {
      damping: 200,
    },
    durationInFrames: transitionDuration,
    delay: transitionStart,
  });

  const resolvedImageItems =
    resolvedImageSequence.length > 0
      ? resolvedImageSequence
      : resolvedImageArray.map((src) => ({
          src,
          durationInFrames: imageDurationInFrames,
          effect: resolvedImageEffect,
        }));
  const baseImageDuration =
    imageDurationInFrames && imageDurationInFrames > 0
      ? imageDurationInFrames
      : resolvedImageItems.length > 0
        ? Math.max(1, Math.floor(contentDuration / resolvedImageItems.length))
        : 0;
  const imageTimeline = (() => {
    const timeline: Array<{
      src: string;
      start: number;
      durationInFrames: number;
      effect?: "none" | "zoom-in" | "zoom-out";
    }> = [];
    let start = 0;
    for (const item of resolvedImageItems) {
      if (start >= contentDuration) {
        break;
      }
      const rawDuration = item.durationInFrames ?? baseImageDuration;
      const durationInFrames = Math.max(
        1,
        Math.min(contentDuration - start, Math.floor(rawDuration)),
      );
      timeline.push({
        src: item.src,
        start,
        durationInFrames,
        effect: item.effect,
      });
      start += durationInFrames;
    }
    return timeline;
  })();
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
      {showRings ? (
        <Sequence durationInFrames={transitionStart + transitionDuration}>
          <Rings outProgress={logoOut} accentColor={accentColor}></Rings>
          <AbsoluteFill className="justify-center items-center">
            <NextLogo outProgress={logoOut}></NextLogo>
          </AbsoluteFill>
        </Sequence>
      ) : null}
      <Sequence from={contentStart}>
        <TextFade>
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
                <h1
                  className="font-bold text-left"
                  style={{
                    fontFamily,
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedTitleSize}px`,
                  }}
                >
                  {title}
                </h1>
                {subtitle ? (
                  <p
                    className="text-left"
                    style={{
                      color: textColor ?? "#111827",
                      fontSize: `${resolvedSubtitleSize}px`,
                    }}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {imageTimeline.length > 0 ? (
                <div className="relative w-[420px] h-[260px] rounded-2xl shadow-lg overflow-hidden">
                  {imageTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = imageTimeline.length === 1;
                    const effect =
                      item.effect ?? (isSingle ? resolvedImageEffect : "none");
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      imageTimeline.length > 1
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
                      isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
                        <Img
                          src={item.src}
                          alt="作品素材"
                          className="w-[420px] h-[260px]"
                          style={{
                            objectFit: resolvedFit,
                            objectPosition: resolvedPosition,
                            opacity,
                            transform: `scale(${scale})`,
                          }}
                        />
                      </Sequence>
                    );
                  })}
                </div>
              ) : resolvedMediaType === "video" && resolvedCoverVideo ? (
                <Video
                  src={resolvedCoverVideo}
                  className="w-[420px] h-[260px] rounded-2xl shadow-lg"
                  style={{
                    objectFit: resolvedFit,
                    objectPosition: resolvedPosition,
                  }}
                />
              ) : resolvedCoverImage ? (
                <Img
                  src={resolvedCoverImage}
                  alt="作品素材"
                  className="w-[420px] h-[260px] rounded-2xl shadow-lg"
                  style={{
                    objectFit: resolvedFit,
                    objectPosition: resolvedPosition,
                  }}
                />
              ) : null}
            </div>
          ) : layout === "image-top" ? (
            <div className="flex flex-col items-center gap-6">
              {imageTimeline.length > 0 ? (
                <div className="relative w-[520px] h-[300px] rounded-2xl shadow-lg overflow-hidden">
                  {imageTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = imageTimeline.length === 1;
                    const effect =
                      item.effect ?? (isSingle ? resolvedImageEffect : "none");
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      imageTimeline.length > 1
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
                      isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
                        <Img
                          src={item.src}
                          alt="作品素材"
                          className="w-[520px] h-[300px]"
                          style={{
                            objectFit: resolvedFit,
                            objectPosition: resolvedPosition,
                            opacity,
                            transform: `scale(${scale})`,
                          }}
                        />
                      </Sequence>
                    );
                  })}
                </div>
              ) : resolvedMediaType === "video" && resolvedCoverVideo ? (
                <Video
                  src={resolvedCoverVideo}
                  className="w-[520px] h-[300px] rounded-2xl shadow-lg"
                  style={{
                    objectFit: resolvedFit,
                    objectPosition: resolvedPosition,
                  }}
                />
              ) : resolvedCoverImage ? (
                <Img
                  src={resolvedCoverImage}
                  alt="作品素材"
                  className="w-[520px] h-[300px] rounded-2xl shadow-lg"
                  style={{
                    objectFit: resolvedFit,
                    objectPosition: resolvedPosition,
                  }}
                />
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
              <h1
                className="font-bold text-center"
                style={{
                  fontFamily,
                  color: textColor ?? "#111827",
                  fontSize: `${resolvedTitleSize}px`,
                }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className="text-center"
                  style={{
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedSubtitleSize}px`,
                  }}
                >
                  {subtitle}
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
              <h1
                className="font-bold text-center"
                style={{
                  fontFamily,
                  color: textColor ?? "#111827",
                  fontSize: `${resolvedTitleSize}px`,
                }}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className="text-center"
                  style={{
                    color: textColor ?? "#111827",
                    fontSize: `${resolvedSubtitleSize}px`,
                  }}
                >
                  {subtitle}
                </p>
              ) : null}
              {imageTimeline.length > 0 ? (
                <div className="relative w-[460px] h-[260px] rounded-2xl shadow-lg overflow-hidden">
                  {imageTimeline.map((item, index) => {
                    const relativeFrame = frame - contentStart - item.start;
                    const isSingle = imageTimeline.length === 1;
                    const effect =
                      item.effect ?? (isSingle ? resolvedImageEffect : "none");
                    const fadeDuration =
                      resolvedTransitionEffect === "fade" &&
                      imageTimeline.length > 1
                        ? Math.min(
                            Math.floor(fps * 0.5),
                            Math.floor(item.durationInFrames / 2),
                          )
                        : 0;
                    const opacity =
                      fadeDuration > 0
                        ? interpolate(
                            relativeFrame,
                            [
                              0,
                              fadeDuration,
                              item.durationInFrames - fadeDuration,
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
                      isSingle && effect === "zoom-in"
                        ? 1 + 0.08 * progress
                        : isSingle && effect === "zoom-out"
                          ? 1.08 - 0.08 * progress
                          : 1;
                    return (
                      <Sequence
                        key={`${item.src}-${index}`}
                        from={item.start}
                        durationInFrames={item.durationInFrames}
                      >
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
                      </Sequence>
                    );
                  })}
                </div>
              ) : resolvedMediaType === "video" && resolvedCoverVideo ? (
                <Video
                  src={resolvedCoverVideo}
                  className="w-[460px] h-[260px] rounded-2xl shadow-lg"
                  style={{
                    objectFit: resolvedFit,
                    objectPosition: resolvedPosition,
                  }}
                />
              ) : resolvedCoverImage ? (
                <Img
                  src={resolvedCoverImage}
                  alt="作品素材"
                  className="w-[460px] h-[260px] rounded-2xl shadow-lg"
                  style={{
                    objectFit: resolvedFit,
                    objectPosition: resolvedPosition,
                  }}
                />
              ) : null}
            </div>
          )}
        </TextFade>
      </Sequence>
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
                    className="px-5 py-2 rounded-full text-lg font-semibold"
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.55)",
                      color: "#ffffff",
                    }}
                  >
                    {line}
                  </div>
                </AbsoluteFill>
              </Sequence>
            );
          })
        : null}
      {audioDataUrl ? <Audio src={audioDataUrl} /> : null}
    </AbsoluteFill>
  );
};
