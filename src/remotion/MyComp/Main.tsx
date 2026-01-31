import { z } from "zod";
import {
  AbsoluteFill,
  Img,
  Sequence,
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
  const resolvedSubtitles = (subtitles ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  const logoOut = spring({
    fps,
    frame,
    config: {
      damping: 200,
    },
    durationInFrames: transitionDuration,
    delay: transitionStart,
  });

  const perImageDuration =
    resolvedImageArray.length > 0
      ? Math.max(1, Math.floor(contentDuration / resolvedImageArray.length))
      : 0;
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
              {resolvedImageArray.length > 0 ? (
                <div className="relative w-[420px] h-[260px] rounded-2xl shadow-lg overflow-hidden">
                  {resolvedImageArray.map((source, index) => {
                    const isLast = index === resolvedImageArray.length - 1;
                    const durationInFrames = isLast
                      ? contentDuration - perImageDuration * index
                      : perImageDuration;
                    return (
                      <Sequence
                        key={`${source}-${index}`}
                        from={index * perImageDuration}
                        durationInFrames={durationInFrames}
                      >
                        <Img
                          src={source}
                          alt="作品素材"
                          className="w-[420px] h-[260px]"
                          style={{
                            objectFit: resolvedFit,
                            objectPosition: resolvedPosition,
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
              {resolvedImageArray.length > 0 ? (
                <div className="relative w-[520px] h-[300px] rounded-2xl shadow-lg overflow-hidden">
                  {resolvedImageArray.map((source, index) => {
                    const isLast = index === resolvedImageArray.length - 1;
                    const durationInFrames = isLast
                      ? contentDuration - perImageDuration * index
                      : perImageDuration;
                    return (
                      <Sequence
                        key={`${source}-${index}`}
                        from={index * perImageDuration}
                        durationInFrames={durationInFrames}
                      >
                        <Img
                          src={source}
                          alt="作品素材"
                          className="w-[520px] h-[300px]"
                          style={{
                            objectFit: resolvedFit,
                            objectPosition: resolvedPosition,
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
              {resolvedImageArray.length > 0 ? (
                <div className="relative w-[460px] h-[260px] rounded-2xl shadow-lg overflow-hidden">
                  {resolvedImageArray.map((source, index) => {
                    const isLast = index === resolvedImageArray.length - 1;
                    const durationInFrames = isLast
                      ? contentDuration - perImageDuration * index
                      : perImageDuration;
                    return (
                      <Sequence
                        key={`${source}-${index}`}
                        from={index * perImageDuration}
                        durationInFrames={durationInFrames}
                      >
                        <Img
                          src={source}
                          alt="作品素材"
                          className="w-[460px] h-[260px]"
                          style={{
                            objectFit: resolvedFit,
                            objectPosition: resolvedPosition,
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
