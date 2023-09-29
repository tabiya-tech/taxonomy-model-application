import type {Meta, StoryObj} from '@storybook/react';

import PrimaryButton from './PrimaryButton';

const meta: Meta<typeof PrimaryButton> = {
    title: 'Components/PrimaryButton',
    component: PrimaryButton,
    tags: ['autodocs'],
    argTypes: {},
};

export default meta;
type Story = StoryObj<typeof PrimaryButton>;

export const Shown: Story = {
    args: { },
};