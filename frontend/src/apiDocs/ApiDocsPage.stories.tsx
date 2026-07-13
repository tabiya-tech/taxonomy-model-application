import type { Meta, StoryObj } from "@storybook/react";
import ApiDocsPage from "./ApiDocsPage";

const meta: Meta<typeof ApiDocsPage> = {
  title: "Application/ApiDocsPage",
  component: ApiDocsPage,
  tags: ["autodocs"],
  // The page fills its parent (via ContentLayout), so render it full-bleed with a bounded height.
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", display: "flex" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ApiDocsPage>;

export const Shown: Story = {
  args: {},
};
