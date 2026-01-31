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
          const resolvedProps = props as { durationInFrames?: number };
          const resolvedDuration =
            typeof resolvedProps.durationInFrames === "number"
              ? resolvedProps.durationInFrames
              : DURATION_IN_FRAMES;
          return {
            durationInFrames: resolvedDuration,
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
