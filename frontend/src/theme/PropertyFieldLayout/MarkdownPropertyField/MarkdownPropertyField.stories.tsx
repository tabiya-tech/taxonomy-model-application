import { Meta, StoryObj } from "@storybook/react";
import MarkdownPropertyField from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";

const meta: Meta<typeof MarkdownPropertyField> = {
  title: "components/MarkdownPropertyField",
  component: MarkdownPropertyField,
  tags: ["autodocs"],
  args: {},
};

export default meta;

type Story = StoryObj<typeof MarkdownPropertyField>;

export const Shown: Story = {
  args: {
    text: `
## Simple Heading
This is a simple text with a list:
- Item **1**
- Item **2**
- Item **3**
    `,
  },
};

export const ShownWithLink: Story = {
  args: {
    text: "## Text with Link\n Here is a link to [Example URL](https://example.com).",
  },
};

export const ShownWithUrnLink: Story = {
  args: {
    text: "## Text with Urn Link\n Here is a urn link to [Example URN](urn:esco:occupation:1234).",
  },
};
