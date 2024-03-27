import { Meta, StoryObj } from "@storybook/react";
import { AuthContext, authContextDefaultValue } from "src/auth/AuthProvider";
import ModelDirectoryHeader, { ModelDirectoryHeaderProps } from "./ModelDirectoryHeader";

const meta: Meta<typeof ModelDirectoryHeader> = {
  title: "ModelDirectory/ModelDirectoryHeader",
  component: ModelDirectoryHeader,
  tags: ["autodocs"],
  argTypes: { onModelImport: { action: "onModelImport" } },
};

export default meta;

type Story = StoryObj<typeof ModelDirectoryHeader>;

const getUserWithModelManagerRole = (hasModelManagerRole: boolean) => ({
  ...authContextDefaultValue,
  hasRole: (role: string) => hasModelManagerRole,
});

export const Shown: Story = {
  args: {},
};

export const ShownWithModelManagerRole: Story = (args: ModelDirectoryHeaderProps) => (
  <AuthContext.Provider value={getUserWithModelManagerRole(true)}>
    <ModelDirectoryHeader {...args} />
  </AuthContext.Provider>
);
ShownWithModelManagerRole.args = {};

export const ShownWithNonModelManagerRole: Story = (args: ModelDirectoryHeaderProps) => (
  <AuthContext.Provider value={getUserWithModelManagerRole(false)}>
    <ModelDirectoryHeader {...args} />
  </AuthContext.Provider>
);
ShownWithNonModelManagerRole.args = {};
