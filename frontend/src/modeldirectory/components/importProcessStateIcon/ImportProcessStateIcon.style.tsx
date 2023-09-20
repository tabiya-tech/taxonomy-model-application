import { Theme } from '@mui/material/styles';

export const runningIconStyle = (theme: Theme) => {
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