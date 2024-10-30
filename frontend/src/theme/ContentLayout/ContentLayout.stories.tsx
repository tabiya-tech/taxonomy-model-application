import { Meta, StoryObj } from "@storybook/react";
import ContentLayout from "./ContentLayout";
import { VisualMock } from "src/_test_utilities/VisualMock";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";

const meta: Meta<typeof ContentLayout> = {
  title: "Components/ContentLayout",
  component: ContentLayout,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ContentLayout>;

export const Shown: Story = {
  args: {
    headerComponent: <VisualMock text={"Header Content"} />,
    mainComponent: <VisualMock text={"Main Content"} />,
  },
};

const lastSentence = " ------ last test sentence -------- "; // last sentence to be used to verify the full content is displayed
export const LongMainContent: Story = {
  args: {
    headerComponent: <VisualMock text={"Header Content"} />,
    mainComponent: <div>{getRandomLorem(100000) + " " + lastSentence}</div>,
  },
};
