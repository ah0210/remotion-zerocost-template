import { z } from "zod";
export const COMP_NAME = "MyComp";

export const CompositionProps = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  badgeText: z.string().optional(),
  coverImageDataUrl: z.string().optional(),
  coverVideoDataUrl: z.string().optional(),
  logoImageDataUrl: z.string().optional(),
  imageArray: z.array(z.string()).optional(),
  subtitles: z.array(z.string()).optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  titleFontSize: z.number().optional(),
  subtitleFontSize: z.number().optional(),
  durationInFrames: z.number().optional(),
  coverMediaType: z.enum(["image", "video"]).optional(),
  audioDataUrl: z.string().optional(),
  mediaFit: z.enum(["cover", "contain"]).optional(),
  mediaPosition: z.enum(["center", "top", "bottom", "left", "right"]).optional(),
  layout: z.enum(["center", "left", "image-top"]).optional(),
  showRings: z.boolean().optional(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "我的 Remotion 视频",
  subtitle: "用你自己的素材快速生成视频",
  badgeText: "新作品",
  imageArray: [],
  subtitles: [],
  backgroundColor: "#ffffff",
  textColor: "#111827",
  accentColor: "#2563eb",
  titleFontSize: 70,
  subtitleFontSize: 24,
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
