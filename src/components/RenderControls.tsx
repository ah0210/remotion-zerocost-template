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
  composition: CompositionConfig;
}> = ({ text, setText, inputProps, serverInputProps, composition }) => {
  const [mode, setMode] = useState<"browser" | "server">("server");

  const serverRenderer = useServerRendering(COMP_NAME, serverInputProps);
  const browserRenderer = useBrowserRendering(composition, inputProps);

  const { renderMedia, state, undo, downloadVideo } =
    mode === "server" ? serverRenderer : browserRenderer;

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
          <AlignEnd>
            <Button
              disabled={state.status === "preparing"}
              loading={state.status === "preparing"}
              onClick={renderMedia}
            >
              开始渲染
            </Button>
          </AlignEnd>
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
