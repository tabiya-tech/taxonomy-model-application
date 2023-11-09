import { styled } from "@mui/material";
import * as React from "react";
import { Theme } from "@mui/material/styles";

export type PulsatingIconProps = {
  icon: React.ComponentType<any>;
} & React.ComponentProps<any>;

export const pulsatingStyle = (theme: Theme) => {
  const pulsate = {
    "0%": {
      transform: "scale(0.6)",
      opacity: 1,
    },
    "50%": {
      transform: "scale(1.00)",
      opacity: 0.8,
    },
    "100%": {
      transform: "scale(0.6)",
      opacity: 1,
    },
  };

  return {
    animation: `pulsate 1.5s infinite`,
    "@keyframes pulsate": pulsate,
  };
};

export function PulsatingIcon({ icon, ...props }: Readonly<PulsatingIconProps>) {
  const StyledIcon = React.memo(styled(icon)(pulsatingStyle));
  return <StyledIcon {...props} />;
}
