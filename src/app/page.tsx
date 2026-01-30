"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import React, { useMemo, useState } from "react";
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

const Home: NextPage = () => {
  const [text, setText] = useState<string>(defaultMyCompProps.title);

  const inputProps: z.infer<typeof CompositionProps> = useMemo(() => {
    return {
      title: text,
    };
  }, [text]);

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)] mb-10 mt-16">
          <Player
            component={Main}
            inputProps={inputProps}
            durationInFrames={DURATION_IN_FRAMES}
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
        <RenderControls
          text={text}
          setText={setText}
          inputProps={inputProps}
          composition={{
            component: Main,
            id: COMP_NAME,
            width: VIDEO_WIDTH,
            height: VIDEO_HEIGHT,
            fps: VIDEO_FPS,
            durationInFrames: DURATION_IN_FRAMES,
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
