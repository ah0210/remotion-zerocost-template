import { Composition } from "remotion";
import { Main } from "./MyComp/Main";
import {
  COMP_NAME,
  defaultMyCompProps,
  DURATION_IN_FRAMES,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { NextLogo } from "./MyComp/NextLogo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={defaultMyCompProps.durationInFrames ?? DURATION_IN_FRAMES}
        calculateMetadata={({ props }) => {
          const resolvedProps = props as {
            durationInFrames?: number;
            imageDurationInFrames?: number;
            titleDisplayFrames?: number;
            coverMediaType?: "image" | "video" | "mixed";
            coverImageSequence?: Array<{ src: string; durationInFrames?: number }>;
            coverVideoSequence?: Array<{ src: string; durationInFrames?: number }>;
            imageSequence?: Array<{ src: string; durationInFrames?: number }>;
            imageArray?: string[];
            coverImageDataUrl?: string;
            coverVideoDataUrl?: string;
          };
          const fallbackItemDuration = Math.max(
            1,
            Math.floor(resolvedProps.imageDurationInFrames ?? VIDEO_FPS),
          );
          const normalizeDuration = (value?: number) => {
            const duration = value ? Math.floor(value) : 0;
            return duration > 0 ? duration : fallbackItemDuration;
          };
          const sumDuration = (
            items?: Array<{ durationInFrames?: number }>,
          ) => {
            if (!items || items.length === 0) {
              return 0;
            }
            return items.reduce(
              (acc, item) => acc + normalizeDuration(item.durationInFrames),
              0,
            );
          };
          const normalizedCoverImageSequence =
            resolvedProps.coverImageSequence?.filter(
              (item) => item.src.trim().length > 0,
            ) ?? [];
          const normalizedCoverVideoSequence =
            resolvedProps.coverVideoSequence?.filter(
              (item) => item.src.trim().length > 0,
            ) ?? [];
          const resolvedCoverImageItems =
            normalizedCoverImageSequence.length > 0
              ? normalizedCoverImageSequence
              : resolvedProps.coverImageDataUrl
                ? [{ src: resolvedProps.coverImageDataUrl }]
                : [];
          const resolvedVideoItems =
            normalizedCoverVideoSequence.length > 0
              ? normalizedCoverVideoSequence
              : resolvedProps.coverVideoDataUrl
                ? [{ src: resolvedProps.coverVideoDataUrl }]
                : [];
          const resolvedMediaType = resolvedProps.coverMediaType ?? "image";
          const useCoverVideo =
            resolvedCoverImageItems.length === 0 &&
            (resolvedMediaType === "video" || resolvedMediaType === "mixed") &&
            resolvedVideoItems.length > 0;
          const coverItems =
            resolvedCoverImageItems.length > 0
              ? resolvedCoverImageItems
              : useCoverVideo
                ? [resolvedVideoItems[0]]
                : [];
          const coverDuration = sumDuration(coverItems);
          const titleDisplayFrames =
            resolvedProps.titleDisplayFrames && resolvedProps.titleDisplayFrames > 0
              ? Math.floor(resolvedProps.titleDisplayFrames)
              : 0;
          const coverDisplayDuration = Math.max(coverDuration, titleDisplayFrames);
          const contentVideoItems = useCoverVideo
            ? resolvedVideoItems.slice(1)
            : resolvedVideoItems;
          const normalizedImageSequence =
            resolvedProps.imageSequence?.filter(
              (item) => item.src.trim().length > 0,
            ) ?? [];
          const normalizedImageArray = (resolvedProps.imageArray ?? [])
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => ({
              src: item,
              durationInFrames: resolvedProps.imageDurationInFrames,
            }));
          const contentImageItems =
            normalizedImageSequence.length > 0
              ? normalizedImageSequence
              : normalizedImageArray;
          const contentDuration = sumDuration([
            ...contentImageItems,
            ...contentVideoItems,
          ]);
          const resolvedDuration =
            typeof resolvedProps.durationInFrames === "number"
              ? resolvedProps.durationInFrames
              : DURATION_IN_FRAMES;
          const totalDuration = Math.max(
            resolvedDuration,
            coverDisplayDuration + contentDuration,
          );
          return {
            durationInFrames: totalDuration,
          };
        }}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
    </>
  );
};
