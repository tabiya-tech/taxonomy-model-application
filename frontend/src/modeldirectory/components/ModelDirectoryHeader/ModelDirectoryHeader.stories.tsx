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

const renderModelDirectoryHeader = (args: ModelDirectoryHeaderProps, hasModelManagerRole: boolean) => (
  <AuthContext.Provider value={getUserWithModelManagerRole(hasModelManagerRole)}>
    <ModelDirectoryHeader {...args} />
  </AuthContext.Provider>
);

export const Shown: Story = {
  args: {},
};

export const ShownWithLoadingState: Story = (args: ModelDirectoryHeaderProps) => {
  return renderModelDirectoryHeader(args, true);
};
ShownWithLoadingState.args = { isImportModelLoading: true };

export const ShownWithModelManagerRole: Story = (args: ModelDirectoryHeaderProps) => {
  return renderModelDirectoryHeader(args, true);
};
ShownWithModelManagerRole.args = {};

export const ShownWithNonModelManagerRole: Story = (args: ModelDirectoryHeaderProps) => {
  return renderModelDirectoryHeader(args, false);
};
ShownWithNonModelManagerRole.args = {};
