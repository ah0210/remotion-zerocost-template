import { z } from "zod";
import { useCallback, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { CompositionProps } from "../../types/constants";

export type State =
  | {
      status: "init";
    }
  | {
      status: "preparing";
    }
  | {
      status: "bundling";
      progress: number;
    }
  | {
      status: "rendering";
      progress: number;
    }
  | {
      status: "finalizing";
      progress: number;
    }
  | {
      status: "error";
      error: Error;
    }
  | {
      status: "done";
      videoBlob: Blob;
      fileName: string;
    };

export type CompositionConfig = {
  component: ComponentType<z.infer<typeof CompositionProps>>;
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultProps: z.infer<typeof CompositionProps>;
};

const getSafeFileName = (title?: string) => {
  const resolved = title?.trim() ? title.trim() : "untitled";
  const safeTitle = resolved.replace(/[^a-zA-Z0-9]/g, "_");
  return `${safeTitle}.mp4`;
};

export const useServerRendering = (
  compositionId: string,
  inputProps: z.infer<typeof CompositionProps>,
  outputPath?: string,
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    try {
      setState({ status: "preparing" });

      // 使用CLI渲染API
      const response = await fetch('/api/render-cli', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          compositionId,
          inputProps,
          outputPath: outputPath?.trim() ? outputPath.trim() : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // 读取流式响应
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // 解码数据并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });
        
        // 处理完整的消息
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留未完成的行

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let data: {
              stage: string;
              progress?: number;
              videoBase64?: string;
              fileName?: string;
              error?: string;
            };
            try {
              data = JSON.parse(line.slice(6)) as {
                stage: string;
                progress?: number;
                videoBase64?: string;
                fileName?: string;
                error?: string;
              };
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
              continue;
            }
            switch (data.stage) {
              case 'bundling':
                setState({
                  status: 'bundling',
                  progress: (data.progress ?? 0) / 100,
                });
                break;
              case 'preparing':
                setState({ status: 'preparing' });
                break;
              case 'rendering':
                setState({
                  status: 'rendering',
                  progress: (data.progress ?? 0) / 100,
                });
                break;
              case 'finalizing':
                setState({
                  status: 'finalizing',
                  progress: (data.progress ?? 0) / 100,
                });
                break;
              case 'done': {
                const byteCharacters = atob(data.videoBase64 ?? '');
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const videoBlob = new Blob([byteArray], { type: 'video/mp4' });
                setState({
                  status: 'done',
                  videoBlob,
                  fileName: data.fileName ?? getSafeFileName(inputProps.title),
                });
                break;
              }
              case 'error':
                throw new Error(data.error ?? 'Unknown render error');
            }
          }
        }
      }

    } catch (error) {
      console.error('Server rendering error:', error);
      setState({
        status: "error",
        error: error as Error,
      });
    }
  }, [compositionId, inputProps, outputPath]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  const downloadVideo = useCallback(() => {
    if (state.status === "done") {
      const url = URL.createObjectURL(state.videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = state.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [state]);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
      downloadVideo,
    };
  }, [renderMedia, state, undo, downloadVideo]);
}; 

export const useBrowserRendering = (
  composition: CompositionConfig,
  inputProps: z.infer<typeof CompositionProps>,
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    try {
      setState({ status: "preparing" });

      const { renderMediaOnWeb } = await import("@remotion/web-renderer");

      const result = await renderMediaOnWeb({
        composition,
        inputProps,
        onProgress: (progress) => {
          const renderedFrames =
            progress.encodedFrames ?? progress.renderedFrames ?? 0;
          const normalized =
            composition.durationInFrames === 0
              ? 0
              : renderedFrames / composition.durationInFrames;
          const clamped = Math.max(0, Math.min(1, normalized));
          setState({
            status: "rendering",
            progress: clamped,
          });
        },
      });

      const videoBlob = await result.getBlob();

      setState({
        status: "done",
        videoBlob,
        fileName: getSafeFileName(inputProps.title),
      });
    } catch (error) {
      setState({
        status: "error",
        error: error as Error,
      });
    }
  }, [composition, inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  const downloadVideo = useCallback(() => {
    if (state.status === "done") {
      const url = URL.createObjectURL(state.videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = state.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [state]);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
      downloadVideo,
    };
  }, [renderMedia, state, undo, downloadVideo]);
};
