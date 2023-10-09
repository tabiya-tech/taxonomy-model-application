import type { Meta, StoryObj } from "@storybook/react";
import ModelDirectory from "./ModelDirectory";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";

const meta: Meta<typeof ModelDirectory> = {
  title: "ModelDirectory/ModelDirectory",
  component: ModelDirectory,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ModelDirectory>;

export const Shown: Story = {
  args: {},
  parameters: {
    docs: { disable: false },
    mockData: [
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "GET",
        status: 200,
        response: MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(3),
      },
    ],
  },
};
export const ModelsFetchFailed: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "GET",
        status: 500,
        response: {
          errorCode: "Some error code",
          message: "Some error message",
          details: "Some error details",
        },
      },
    ],
  },
};

export const ModelsFetchIsSlow: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "GET",
        status: 200,
        response: MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(3),
        delay: 5000,
      },
    ],
  },
};
