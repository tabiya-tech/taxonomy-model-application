import { Meta, StoryObj } from "@storybook/react";
import {Box, Typography} from "@mui/material";

const meta: Meta = {
  title: "Application/Style",
  component: Box,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj;
export const TypographyStyles: Story = {
  args: {
    children: (
      <>
        <Typography variant={"h1"}>{"<h1> This is a test"}</Typography>
        <Typography variant={"h2"}>{"<h2> This is a test"}</Typography>
        <Typography variant={"h3"}>{"<h3> This is a test"}</Typography>
        <Typography variant={"h4"}>{"<h4> This is a test"}</Typography>
        <Typography variant={"h5"}>{"<h5> This is a test"}</Typography>
        <Typography variant={"h6"}>{"<h6> This is a test"}</Typography>
        <Typography variant={"subtitle1"}>
          {"<subtitle1> This is a test"}
        </Typography>
        <Typography variant={"subtitle2"}>
          {"<subtitle2> This is a test"}
        </Typography>
        <Typography variant={"body1"}>{"<body1> This is a test"}</Typography>
        <Typography variant={"body2"}>{"<body2> This is a test"}</Typography>
        <Typography variant={"body1"}>
          <Typography variant={"button"}>{"<button> This is a test"}</Typography>
        </Typography>
        <Typography sx={{lineHeight:"0"}}>
          <Typography variant={"caption"}>
            {"<caption> This is a test"}
          </Typography>
        </Typography>

        <Typography sx={{lineHeight:"0"}}>
          <Typography variant={"overline"}>
            {"<overline> This is a test"}
          </Typography>
        </Typography>
      </>
    ),
  },
};
