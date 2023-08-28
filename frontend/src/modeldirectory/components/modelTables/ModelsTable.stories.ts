import type {Meta, StoryObj} from '@storybook/react';

import ModelsTable from "./ModelsTable";
import {ModelDirectoryTypes} from "src/modeldirectory/modelDirectory.types";
import {getRandomModels} from "./_test_utilities/mockModelData";

const simpleMockModelsData : ModelDirectoryTypes.ModelInfo[] = [
  {
    id: "9ebae4c8-598b-4abd-938b-6f85315a3bf0",
    UUID: "ed433551-592a-412a-8ac2-a66f175bc80d",
    previousUUID: "f0649024-ff2d-4c26-9ded-c4c29d54be32",
    originUUID: "56ba0195-04a3-4e88-9426-9f0427c99751",
    name: "Aptent",
    locale: {
      UUID: "4f32a2d4-a4a8-4627-9043-145a46e2d2e1",
      name: "Rwanda",
      shortCode: "RW"
    },
    description: "Facilisisalutatus condimentum indoctum sapientem class ocurreret quaestio mauris mucius vim reformidans finibus tempor quem fabellas option eos enim.  Sapientemridens non.  Prihabeo his interdum venenatis instructior velit.",
    released: false,
    releaseNotes: "constituam invidunt pellentesque",
    version: "1.0.1",
    // @ts-ignore
    createdAt: new Date(),
    // @ts-ignore
    updatedAt: new Date(),
    path: "",
    tabiyaPath: ""
  },
  {
    id: "29736690-d79a-4253-8e1c-6647f4f2ba79",
    UUID: "ed433551-592a-412a-8ac2-a66f175bc80d",
    previousUUID: "f0649024-ff2d-4c26-9ded-c4c29d54be32",
    originUUID: "56ba0195-04a3-4e88-9426-9f0427c99751",
    name: "Litora",
    locale: {
      UUID: "4f32a2d4-a4a8-4627-9043-145a46e2d2e1",
      name: "Congo",
      shortCode: "CD"
    },
    description: "Facilisisalutatus condimentum indoctum sapientem class ocurreret quaestio mauris mucius vim reformidans finibus tempor quem fabellas option eos enim.  Sapientemridens non.  Prihabeo his interdum venenatis instructior velit.",
    released: false,
    releaseNotes: "constituam invidunt pellentesque",
    version: "1.0.1",
    // @ts-ignore
    createdAt: new Date(),
    // @ts-ignore
    updatedAt: new Date(),
    path: "",
    tabiyaPath: ""
  },
]

const meta: Meta<typeof ModelsTable> = {
  title: 'ModelDirectory/ModelsTable',
  component: ModelsTable,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ModelsTable>;

export const Shown: Story = {
  args: {
    models: simpleMockModelsData
  },
};

export const ShownWithLongData: Story = {
  args: {
    models: getRandomModels(10)
  },
};

export const ShownInLoadingState: Story = {
  args: {
    models: [],
    isLoading: true
  },
};