import { Meta, StoryObj } from "@storybook/react";
import MarkdownPropertyField from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";

const meta: Meta<typeof MarkdownPropertyField> = {
  title: "components/MarkdownPropertyField",
  component: MarkdownPropertyField,
  tags: ["autodocs"],
  args: {},
  parameters: {
    a11y: { disable: true },
  },
};

export default meta;

type Story = StoryObj<typeof MarkdownPropertyField>;

const headingsMarkdown = `
# Heading Level 1
## Heading Level 2
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6
`;

const textStylesMarkdown = `
- **Bold text**
- __Another bold text__
- *Italic text*
- __Another italic text__
- ~~Strikethrough~~
`;

const listsMarkdown = `
### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item
`;

const linksMarkdown = `
Here is a [link to an example](https://example.com).\n
Here is a urn link [Example URN](urn:esco:occupation:1234).
`;

const taskListsMarkdown = `
- [x] Completed task 1
- [x] Completed task 2
- [x] Completed task 3
- [ ] Incomplete task 1
- [ ] Incomplete task 2
- [ ] Incomplete task 3
`;

export const Shown: Story = {
  args: {
    label: "Overview of Markdown ",
    text: `
This example showcases basic Markdown elements like headings, lists, text styles, and links.

## Simple Heading
This is a simple text with a list:
- Item **1**
- Item **2**
- Item **3**

## Text Styles
- **Bold text**
- *Italic text*
- ~~Strikethrough~~

## Links
Here is a link to [Example URL](https://example.com).\n
And here is a link with a URN: [Example URN](urn:esco:occupation:1234).
    `,
  },
};

export const ShownWithLinks: Story = {
  args: {
    label: "Links",
    text: linksMarkdown,
  },
};

export const ShownWithHeadings: Story = {
  args: {
    label: "Headings",
    text: headingsMarkdown,
  },
};

export const ShownWithTextStyles: Story = {
  args: {
    label: "Text Styles",
    text: textStylesMarkdown,
  },
};

export const ShownWithLists: Story = {
  args: {
    label: "Lists",
    text: listsMarkdown,
  },
};

export const ShownWithTaskLists: Story = {
  args: {
    label: "Task Lists",
    text: taskListsMarkdown,
  },
};

export const ShownCombinedMarkdown: Story = {
  args: {
    label: "Comprehensive Markdown Example",
    text: `
This is an example of many Markdown features combined together. It includes headings, lists, text styles, links, tables, and images.
## Headings
${headingsMarkdown}

## Text Styles
${textStylesMarkdown}

## Lists
${listsMarkdown}

### Task Lists
${taskListsMarkdown}

## Links
${linksMarkdown}

## Blockquote
> "This is a blockquote used for emphasizing content."

## Email
You can contact us at [fake@example.com](mailto:fake@example.com).

## Images
![Tabiya logoI](https://tabiya.tech/images/logo.svg)

## Table
| Column 1 | Column 2 |
| -------- | -------- |
| Row 1    | Data 1   |
| Row 2    | Data 2   |
| Row 3    | Data 3  |
    `,
  },
};
