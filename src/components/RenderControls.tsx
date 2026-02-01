import { z } from "zod";
import type { Dispatch, SetStateAction } from "react";
import { AlignEnd } from "./AlignEnd";
import { Button } from "./Button";
import { InputContainer } from "./Container";
import { ErrorComp } from "./Error";
import { Input } from "./Input";
import { ProgressBar } from "./ProgressBar";
import { Spacing } from "./Spacing";
import { CompositionProps } from "../../types/constants";
import { CompositionConfig, useBrowserRendering } from "../helpers/use-server-rendering";

export const RenderControls: React.FC<{
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  inputProps: z.infer<typeof CompositionProps>;
  composition: CompositionConfig;
}> = ({
  text,
  setText,
  inputProps,
  composition,
}) => {
  const browserRenderer = useBrowserRendering(composition, inputProps);

  const { renderMedia, state, undo, downloadVideo } = browserRenderer;
  const canStartRender = state.status !== "preparing";

  return (
    <InputContainer>
      {state.status === "init" ||
      state.status === "preparing" ||
      state.status === "error" ? (
        <>
          <Input
            disabled={state.status === "preparing"}
            setText={setText}
            text={text}
          ></Input>
          <AlignEnd>
            <Button
              disabled={!canStartRender}
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
