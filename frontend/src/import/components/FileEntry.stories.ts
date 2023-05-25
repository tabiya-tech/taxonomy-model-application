import type {Meta, StoryObj} from '@storybook/react';
import {FileEntry} from './FileEntry';
import {ImportFileTypes} from "api-specifications/import";

const meta: Meta<typeof FileEntry> = {
  title: 'Import/FileEntry',
  component: FileEntry,
  tags: ['autodocs'],
  argTypes: {notifySelectedFileChange: {action: 'notifySelectedFileChange'}},
};

export default meta;
type Story = StoryObj<typeof FileEntry>;

export const ComponentRendered: Story = {
  args: {
    fileType: ImportFileTypes.ESCO_OCCUPATION
  },
};