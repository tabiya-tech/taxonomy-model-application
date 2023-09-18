import {Meta, StoryObj} from "@storybook/react";
import {action} from "@storybook/addon-actions";
import ModelDirectoryHeader from "./ModelDirectoryHeader";

const meta: Meta<typeof ModelDirectoryHeader> = {
  title: 'ModelDirectory/ModelDirectoryHeader',
  component: ModelDirectoryHeader,
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof ModelDirectoryHeader>;

export const Shown: Story = {
  args: {
    onModalImport: ()=> action('onModalImport'),
   },
};