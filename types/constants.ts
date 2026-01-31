import { z } from "zod";
export const COMP_NAME = "MyComp";

const ImageEffect = z.enum(["none", "zoom-in", "zoom-out"]);
const TransitionEffect = z.enum(["none", "fade"]);

export const CompositionProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  coverImageDataUrl: z.string().optional(),
  coverVideoDataUrl: z.string().optional(),
  logoImageDataUrl: z.string().optional(),
  imageArray: z.array(z.string()).optional(),
  imageSequence: z
    .array(
      z.object({
        src: z.string(),
        durationInFrames: z.number().optional(),
        effect: ImageEffect.optional(),
      }),
    )
    .optional(),
  coverImageSequence: z
    .array(
      z.object({
        src: z.string(),
        durationInFrames: z.number().optional(),
      }),
    )
    .optional(),
  coverVideoSequence: z
    .array(
      z.object({
        src: z.string(),
        durationInFrames: z.number().optional(),
      }),
    )
    .optional(),
  audioSequence: z
    .array(
      z.object({
        src: z.string(),
        durationInFrames: z.number().optional(),
      }),
    )
    .optional(),
  imageEffect: ImageEffect.optional(),
  transitionEffect: TransitionEffect.optional(),
  imageDurationInFrames: z.number().optional(),
  subtitles: z.array(z.string()).optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  titleFontSize: z.number().optional(),
  subtitleFontSize: z.number().optional(),
  titleDisplayFrames: z.number().optional(),
  captionsFontSize: z.number().optional(),
  captionsFontFamily: z.string().optional(),
  durationInFrames: z.number().optional(),
  coverMediaType: z.enum(["image", "video", "mixed"]).optional(),
  audioDataUrl: z.string().optional(),
  mediaFit: z.enum(["cover", "contain"]).optional(),
  mediaPosition: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  layout: z.enum(["center", "left", "image-top", "full-screen"]).optional(),
  showRings: z.boolean().optional(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "我的 Remotion 视频",
  subtitle: "用你自己的素材快速生成视频",
  badgeText: "新作品",
  imageArray: [],
  imageSequence: [],
  imageEffect: "none",
  transitionEffect: "fade",
  imageDurationInFrames: 30,
  subtitles: [],
  backgroundColor: "#ffffff",
  textColor: "#111827",
  accentColor: "#2563eb",
  titleFontSize: 70,
  subtitleFontSize: 24,
  titleDisplayFrames: 90,
  captionsFontSize: 28,
  captionsFontFamily: "inter",
  durationInFrames: 200,
  coverMediaType: "image",
  mediaFit: "cover",
  mediaPosition: "center",
  layout: "center",
  showRings: true,
};

export const DURATION_IN_FRAMES = 200;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;
