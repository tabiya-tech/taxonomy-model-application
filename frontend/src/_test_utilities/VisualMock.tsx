import { Typography } from "@mui/material";

// the text is a prop
interface VisualMockProps {
  variant?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "subtitle1"
    | "subtitle2"
    | "body1"
    | "body2"
    | "caption"
    | "button"
    | "overline";
  text: string;
}

export const VisualMock = (props: VisualMockProps) => {
  const borderWidth = 1;
  return (
    <div
      style={{
        borderColor: "gray",
        borderWidth: `${borderWidth}px`,
        borderStyle: "dashed",
        flex: 1,
        flexDirection: "column",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // Currently the boxing-size is set to border-box via the CSSBaseline,
        // however if it is set to content-box then we need to account for borderWidth
        // otherwise the component will overflow
        // e.g. height: //`calc(100% - ${2 * borderWidth}px)`,
        height: "100%",
        position: "relative",
      }}
    >
      <Typography textAlign={"center"} variant={props.variant ?? "h1"} sx={{ wordBreak: "break-word" }}>
        {props.text}
      </Typography>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        width="100%"
        height="100%"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="gray" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="gray" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
};
