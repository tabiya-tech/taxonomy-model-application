import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import PropertyFieldLayout from "./PropertyFieldLayout";
import { getRandomLorem } from "src/_test_utilities/specialCharacters";
import { VisualMock } from "src/_test_utilities/VisualMock";

const meta: Meta = {
  title: "components/PropertyFieldLayout",
  component: PropertyFieldLayout,
  tags: ["autodocs"],
  args: {
    title: "Title",
    children: <VisualMock variant={"body1"} text={getRandomLorem(100)} />,
  },
};

type Story = StoryObj<typeof PropertyFieldLayout>;

export const Shown: Story = {};

export const Multiple: Story = {
  render: renderMultiple,
};

function renderMultiple(args: any) {
  return (
    <React.Fragment>
      <PropertyFieldLayout {...args} title={`Title 1`}>
        <VisualMock variant={"body1"} text={getRandomLorem(500)} />
      </PropertyFieldLayout>
      <PropertyFieldLayout {...args} title={`Title 2`}>
        <VisualMock variant={"body1"} text={getRandomLorem(500)} />
      </PropertyFieldLayout>
      <PropertyFieldLayout {...args} title={`Title 3`}>
        <VisualMock variant={"body1"} text={getRandomLorem(500)} />
      </PropertyFieldLayout>
      <PropertyFieldLayout {...args} title={`Title 4`}>
        <VisualMock variant={"body1"} text={getRandomLorem(500)} />
      </PropertyFieldLayout>
      <PropertyFieldLayout {...args} title={`Title 5`}>
        <VisualMock variant={"body1"} text={getRandomLorem(500)} />
      </PropertyFieldLayout>
    </React.Fragment>
  );
}

export default meta;
