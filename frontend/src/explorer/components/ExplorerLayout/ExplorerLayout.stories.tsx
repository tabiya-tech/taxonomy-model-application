import { Meta, StoryObj } from "@storybook/react";
import ExplorerLayout from "./ExplorerLayout";
import { VisualMock } from "src/_test_utilities/VisualMock";

const meta: Meta<typeof ExplorerLayout> = {
  title: "Explorer/Components/ExplorerLayout",
  component: ExplorerLayout,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ExplorerLayout>;

export const Shown: Story = {
  args: {
    headerComponent: <VisualMock text="Header: Taxonomy Title · Version Selector · Edit Button" variant="h6" />,
    leftPanelComponent: <VisualMock text="Left Panel: Occupations/Skills Tabs · Search · Tree List" variant="h6" />,
    rightPanelComponent: (
      <VisualMock text="Right Panel: Item Title · Definition/Links/Details/History Tabs · Content" variant="h6" />
    ),
  },
};
