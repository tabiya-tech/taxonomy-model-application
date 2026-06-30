import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Routes, Route } from "react-router-dom";
import ExplorerPage from "./ExplorerPage";
import * as MockPayload from "src/modelInfo/_test_utilities/mockModelInfoPayload";
import { getApiUrl } from "src/envService";
import { routerPaths } from "src/app/routerPaths";

const MODELS_URL = getApiUrl() + "/models";

const fakeModels = MockPayload.GET.getPayloadWithArrayOfFakeModelInfo(3);
fakeModels[0] = { ...fakeModels[0], name: "Taxonomy for South Africa", version: "v1.0.1-rc.1" };
fakeModels[1] = { ...fakeModels[1], name: "Taxonomy for South Africa", version: "v1.0.0" };
fakeModels[2] = { ...fakeModels[2], name: "Tabiya esco-1.1.1", version: "v0.9.0" };

const meta: Meta<typeof ExplorerPage> = {
  title: "Explorer/ExplorerPage",
  component: ExplorerPage,
  tags: ["autodocs"],
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

type Story = StoryObj<typeof ExplorerPage>;

export const Occupations: Story = {
  parameters: {
    initialEntries: [`/explorer/${fakeModels[0].id}/occupations`],
  },
  render: () => (
    <Routes>
      <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
    </Routes>
  ),
};

export const Skills: Story = {
  parameters: {
    initialEntries: [`/explorer/${fakeModels[0].id}/skills`],
  },
  render: () => (
    <Routes>
      <Route path={routerPaths.EXPLORER_SKILLS} element={<ExplorerPage initialTab="skills" />} />
    </Routes>
  ),
};
