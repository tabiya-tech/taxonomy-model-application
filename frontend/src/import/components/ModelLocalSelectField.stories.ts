import type {Meta, StoryObj} from '@storybook/react';
import ModelLocalSelectField from "./ModelLocalSelectField";

const meta: Meta<typeof ModelLocalSelectField> = {
  title: "Import/ModelLocaleSelectionField",
  component: ModelLocalSelectField,
  tags: ['autodocs'],
  argTypes: {notifyModelLocaleChanged: {action: 'notifyModelLocaleChanged'}},
}

export default meta;
type Story = StoryObj<typeof ModelLocalSelectField>;


export const ComponentRendered: Story = {
  args: {
    locales: [
      {
        UUID: '1',
        shortCode: "ZA",
        name: "South Africa"
      }, {
        UUID: '2',
        shortCode: "KA",
        name: "Kenya"
      }
    ]
  }
}