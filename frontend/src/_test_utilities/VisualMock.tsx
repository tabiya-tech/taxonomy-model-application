import { Typography } from "@mui/material";

// the text is a prop
interface VisualMockProps {
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
        // We need to account for the borders if the boxing-size is not set to border-box,
        // otherwise the component will overflow
        height: "100%", //`calc(100% - ${2 * borderWidth}px)`,
        position: "relative",
      }}
    >
      <Typography textAlign={"center"} variant={"h1"}>
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
