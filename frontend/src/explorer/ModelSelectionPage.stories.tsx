import type { Meta, StoryObj } from "@storybook/react";
import ModelSelectionPage from "./ModelSelectionPage";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";
import { getApiUrl } from "src/envService";

const MODELS_URL = getApiUrl() + "/models";

const fakeModels = MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(3);
fakeModels[0] = { ...fakeModels[0], name: "Taxonomy for South Africa", version: "v1.0.0.0" };
fakeModels[1] = { ...fakeModels[1], name: "Taxonomy for South Africa", version: "v1.0.1.1" };
fakeModels[2] = { ...fakeModels[2], name: "Tabiya esco-1.1.1", version: "v0.9.0" };

const meta: Meta<typeof ModelSelectionPage> = {
  title: "Explorer/ModelSelectionPage",
  component: ModelSelectionPage,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    mockData: [
      {
        url: MODELS_URL,
        method: "GET",
        status: 200,
        response: fakeModels,
      },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof ModelSelectionPage>;

export const Shown: Story = {
  args: {},
};
