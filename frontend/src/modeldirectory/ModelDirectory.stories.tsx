import type { Meta, StoryObj } from "@storybook/react";
import ModelDirectory from "./ModelDirectory";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";

const meta: Meta<typeof ModelDirectory> = {
  title: "ModelDirectory/ModelDirectory",
  component: ModelDirectory,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    docs: { disable: false },
    mockData: [
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "GET",
        status: 200,
        response: MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(10),
      },
      {
        url: "https://dev.tabiya.tech/api/export",
        method: "POST",
        status: 202,
        response: {},
      },
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "POST",
        status: 201,
        response: MockPayload.POST.getPayloadWithOneRandomModelInfo(),
      },
      {
        url: "https://dev.tabiya.tech/api/import",
        method: "POST",
        status: 202,
        response: {},
      },
      {
        url: "https://dev.tabiya.tech/api/presigned",
        method: "POST",
        status: 204,
        response: {},
      },
      {
        url: "https://dev.tabiya.tech/api/presigned",
        method: "GET",
        status: 200,
        response: {
          url: "https://dev.tabiya.tech/api/presigned",
          fields: [
            {
              name: "key",
              value: "uploads/2021/10/14/1634226071-0.2400022152351686",
            },
          ],
          folder: "uploads/2021/10/14/",
        },
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ModelDirectory>;

export const Shown: Story = {
  args: {},
};
export const OneModel: Story = {
  args: {},
  parameters: {
    docs: { disable: false },
    mockData: [
      ...meta.parameters!.mockData,
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "GET",
        status: 200,
        response: MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(1),
      },
    ],
  },
};
export const ModelsFetchFailed: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      ...meta.parameters!.mockData,
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
      ...meta.parameters!.mockData,
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

export const ImportNewModelWillFail: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      ...meta.parameters!.mockData,
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "POST",
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

export const ImportNewModelWillDelay: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      ...meta.parameters!.mockData,
      {
        url: "https://dev.tabiya.tech/api/models",
        method: "POST",
        status: 201,
        response: MockPayload.POST.getPayloadWithOneRandomModelInfo(),
        delay: 5000,
      },
    ],
  },
};

export const ExportModelWillFail: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      ...meta.parameters!.mockData,
      {
        url: "https://dev.tabiya.tech/api/export",
        method: "POST",
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

export const ExportModelWillDelay: Story = {
  args: {},
  parameters: {
    docs: { disable: true },
    mockData: [
      ...meta.parameters!.mockData,
      {
        url: "https://dev.tabiya.tech/api/export",
        method: "POST",
        status: 202,
        response: {},
        delay: 5000,
      },
    ],
  },
};
