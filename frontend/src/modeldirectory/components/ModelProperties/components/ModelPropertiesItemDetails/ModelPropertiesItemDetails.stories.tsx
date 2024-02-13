import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ModelPropertiesItemDetails from "./ModelPropertiesItemDetails";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";

const meta: Meta = {
  title: "ModelDirectory/ModelProperties/ModelPropertiesItemDetails",
  component: ModelPropertiesItemDetails,
  tags: ["autodocs"],
  args: {
    title: "Title",
    value:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
};

type Story = StoryObj<typeof ModelPropertiesItemDetails>;

export const Shown: Story = {};

export const CopyToClipboard: Story = {
  args: {
    isCopyEnabled: true,
  },
};
export const ShownWithLongText: Story = {
  args: {
    value: getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
  },
};

export const ShownWithLongTextAndCopyToClipboard: Story = {
  args: {
    value: getRandomLorem(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    isCopyEnabled: true,
  },
};

export const Multiple: Story = {
  render: renderMultiple,
};

export const MultipleAndCopyToClipboard: Story = {
  render: renderMultiple,
  args: {
    isCopyEnabled: true,
  },
};

function renderMultiple(args: any) {
  const itemCount = 5;
  return (
    <React.Fragment>
      {Array.from({ length: itemCount }).map((_, index) => (
        <ModelPropertiesItemDetails
          key={`item-${index}`}
          {...args}
          title={`Title ${index}`}
          value={getRandomLorem(Math.floor(Math.random() * 100 + 10))}
        />
      ))}
    </React.Fragment>
  );
}

export default meta;
