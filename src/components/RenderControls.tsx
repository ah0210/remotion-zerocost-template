import { z } from "zod";
import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button";
import { InputContainer } from "./Container";
import { ErrorComp } from "./Error";
import { Input } from "./Input";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";
import { COMP_NAME, CompositionProps } from "../../types/constants";
import {
  CompositionConfig,
  useBrowserRendering,
  useServerRendering,
} from "../helpers/use-server-rendering";

export const RenderControls: React.FC<{
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  inputProps: z.infer<typeof CompositionProps>;
  serverInputProps: z.infer<typeof CompositionProps>;
  selectedWorkId: string;
  serverMediaReady: boolean;
  serverSelectionReady: boolean;
  composition: CompositionConfig;
}> = ({
  text,
  setText,
  inputProps,
  serverInputProps,
  selectedWorkId,
  serverMediaReady,
  serverSelectionReady,
  composition,
}) => {
  const [mode, setMode] = useState<"browser" | "server">("server");
  const [outputPath, setOutputPath] = useState("");

  const serverRenderer = useServerRendering(
    COMP_NAME,
    serverInputProps,
    selectedWorkId,
    outputPath,
  );
  const browserRenderer = useBrowserRendering(composition, inputProps);

  const { renderMedia, state, undo, downloadVideo } =
    mode === "server" ? serverRenderer : browserRenderer;
  const canStartRender =
    state.status !== "preparing" &&
    (mode !== "server" || (serverMediaReady && serverSelectionReady));

  return (
    <InputContainer>
      <div className="flex flex-row gap-2 mb-4">
        <Button
          secondary={mode !== "browser"}
          disabled={state.status === "preparing" || state.status === "rendering" || state.status === "finalizing" || state.status === "bundling"}
          onClick={() => setMode("browser")}
        >
          浏览器渲染
        </Button>
        <Button
          secondary={mode !== "server"}
          disabled={state.status === "preparing" || state.status === "rendering" || state.status === "finalizing" || state.status === "bundling"}
          onClick={() => setMode("server")}
        >
          服务器渲染
        </Button>
      </div>
      {state.status === "init" ||
      state.status === "preparing" ||
      state.status === "error" ? (
        <>
          <Input
            disabled={state.status === "preparing"}
            setText={setText}
            text={text}
          ></Input>
          <Spacing></Spacing>
          {mode === "server" ? (
            <>
              <label className="flex flex-col gap-2 text-sm text-foreground">
                输出路径
                <input
                  className="leading-[1.7] block w-full rounded-geist bg-background p-geist-half text-foreground text-sm border border-unfocused-border-color transition-colors duration-150 ease-in-out focus:border-focused-border-color outline-none"
                  disabled={state.status === "preparing"}
                  value={outputPath}
                  onChange={(e) => setOutputPath(e.currentTarget.value)}
                  placeholder="例如：C:\Videos\my-video.mp4 或 C:\Videos"
                />
              </label>
              <Spacing></Spacing>
            </>
          ) : null}
          <AlignEnd>
            <Button
              disabled={!canStartRender}
              loading={state.status === "preparing"}
              onClick={renderMedia}
            >
              开始渲染
            </Button>
          </AlignEnd>
          {mode === "server" && !serverMediaReady ? (
            <div className="text-xs text-subtitle">
              上传素材正在转换中，完成后即可开始服务器渲染
            </div>
          ) : null}
          {mode === "server" && serverMediaReady && !serverSelectionReady ? (
            <div className="text-xs text-subtitle">
              作品切换中，请稍候再开始渲染
            </div>
          ) : null}
          {state.status === "error" ? (
            <ErrorComp message={state.error.message}></ErrorComp>
          ) : null}
        </>
      ) : null}
      {(state.status === "bundling" || 
        state.status === "rendering" || 
        state.status === "finalizing" || 
        state.status === "done") ? (
        <>
          <ProgressBar
            progress={
              state.status === "bundling" ? state.progress :
              state.status === "rendering" ? state.progress :
              state.status === "finalizing" ? state.progress :
              1
            }
          />
          <Spacing></Spacing>
          <AlignEnd>
            {state.status === "done" ? (
              <Button onClick={downloadVideo}>
                下载视频
              </Button>
            ) : null}
            {state.status === "bundling" ? (
              <Button disabled>
                打包中...
              </Button>
            ) : null}
            {state.status === "rendering" ? (
              <Button disabled>
                渲染中...
              </Button>
            ) : null}
            {state.status === "finalizing" ? (
              <Button disabled>
                生成中...
              </Button>
            ) : null}
            <Spacing></Spacing>
            <Button onClick={undo} secondary>
              重新开始
            </Button>
          </AlignEnd>
        </>
      ) : null}
    </InputContainer>
  );
};
