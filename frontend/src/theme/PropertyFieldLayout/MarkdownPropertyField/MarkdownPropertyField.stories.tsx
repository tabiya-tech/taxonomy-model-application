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
# Overview of Markdown 

This example showcases basic Markdown elements like headings, lists, text styles, and links.

## Simple Heading
This is a simple text with a list:
- Item **1**
- Item **2**
- Item **3**

## Links
Here is a link to [Example URL](https://example.com).

And here is a link with a URN: [Example URN](urn:esco:occupation:1234).

## Text Styles
- **Bold text**
- *Italic text*
- ~~Strikethrough~~
    `,
  },
};

export const ShownCombinedMarkdown: Story = {
  args: {
    text: `
# Comprehensive Markdown Example

This is an example of many Markdown features combined together. It includes headings, lists, text styles, links, tables, and images.

## Headings
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Text Styles
- **Bold text**
- *Italic text*
- ~~Strikethrough~~

## Lists
### Unordered List
- Item 1
- Item 2
- Item 3

### Ordered List
1. First item
2. Second item
3. Third item

## Task List
- [x] Completed task
- [ ] Incomplete task

## Blockquote
> "This is a blockquote used for emphasizing content."

## Links
Here is a [link to an example](https://example.com).\n
Here is a urn link [Example URN](urn:esco:occupation:1234).

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
