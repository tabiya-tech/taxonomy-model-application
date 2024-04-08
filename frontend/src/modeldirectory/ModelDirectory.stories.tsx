import type { Meta, StoryObj } from "@storybook/react";
import ModelDirectory from "./ModelDirectory";
import ExportProcessStateAPISpecs from "api-specifications/exportProcessState";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";
import { getApiUrl } from "src/envService";

// Make sure that the model is in a state that allows its actions to be performed. i.e export, download, etc.
const modelWithSuccessfulStates = MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(1)[0];
modelWithSuccessfulStates.exportProcessState = [
  {
    ...modelWithSuccessfulStates.exportProcessState[0],
    status: ExportProcessStateAPISpecs.Enums.Status.COMPLETED,
    result: {
      errored: false,
      exportErrors: false,
      exportWarnings: false,
    },
  },
];

modelWithSuccessfulStates.importProcessState = {
  ...modelWithSuccessfulStates.importProcessState,
  status: ImportProcessStateAPISpecs.Enums.Status.COMPLETED,
  result: {
    errored: false,
    parsingErrors: false,
    parsingWarnings: false,
  },
};

const MODELS_URL = getApiUrl() + "/models";
const EXPORT_URL = getApiUrl() + "/export";

const meta: Meta<typeof ModelDirectory> = {
  title: "ModelDirectory/ModelDirectory",
  component: ModelDirectory,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    docs: { disable: false },
    mockData: [
      {
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(10),
      },
      {
        url: EXPORT_URL,
        method: "POST",
        status: 202,
        response: {},
      },
      {
        url: MODELS_URL,
        method: "POST",
        status: 201,
        response: MockPayload.POST.getPayloadWithOneRandomModelInfo(),
      },
      {
        url: getApiUrl() + "/import",
        method: "POST",
        status: 202,
        response: {},
      },
      {
        url: getApiUrl() + "/presigned",
        method: "POST",
        status: 204,
        response: {},
      },
      {
        url: getApiUrl() + "/presigned",
        method: "GET",
        status: 200,
        response: {
          url: getApiUrl() + "/presigned",
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
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: [modelWithSuccessfulStates],
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
        url: MODELS_URL,
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
        url: MODELS_URL,
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
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: [modelWithSuccessfulStates],
      },
      {
        url: MODELS_URL,
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
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: [modelWithSuccessfulStates],
      },
      {
        url: MODELS_URL,
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
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: [modelWithSuccessfulStates],
      },
      {
        url: EXPORT_URL,
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
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: [modelWithSuccessfulStates],
      },
      {
        url: EXPORT_URL,
        method: "POST",
        status: 202,
        response: {},
        delay: 5000,
      },
    ],
  },
};
