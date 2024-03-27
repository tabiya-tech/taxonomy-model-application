import { Meta, StoryObj } from "@storybook/react";
import AppHeader from "./AppHeader";
import { AuthContext } from "src/app/providers/AuthProvider";

const meta: Meta<typeof AppHeader> = {
  title: "Application/AppHeader",
  component: AppHeader,
  tags: ["autodocs"],
  argTypes: {},
};

type Story = StoryObj<typeof AppHeader>;

export const Shown: Story = {
  args: {},
};

export const Authenticated: Story = {
  render: () => (
    <AuthContext.Provider
      value={{
        user: { username: "JohnDoe", roles: [] },
        login: () => {},
        logout: () => {},
        hasRole: () => false,
      }}
    >
      <AppHeader />
    </AuthContext.Provider>
  ),
};

export const Unauthenticated: Story = {
  render: () => (
    <AuthContext.Provider
      value={{
        user: null,
        login: () => {},
        logout: () => {},
        hasRole: () => false,
      }}
    >
      <AppHeader />
    </AuthContext.Provider>
  ),
};

export default meta;
