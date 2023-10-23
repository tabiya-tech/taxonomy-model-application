import type { Meta, StoryObj } from "@storybook/react";
import SnackbarProvider, { useSnackbar } from "src/theme/SnackbarProvider/SnackbarProvider";
import { FormLabel, MenuItem, Select, Stack } from "@mui/material";
import { USER_FRIENDLY_ERROR_MESSAGES } from "./error";
import React from "react";

const meta: Meta<typeof SnackbarProvider> = {
  title: "Error/Error",
  component: SnackbarProvider,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    docs: { disable: true },
    a11y: {
      // Disabling a11y due to https://github.com/iamhosseindhv/notistack/issues/579
      // See also frontend/src/theme/SnackbarProvider/SnackbarProvider.tsx
      disable: true,
    },
  },
};

export default meta;

type Story = StoryObj<typeof SnackbarProvider>;

const TestErrorDropdown = () => {
  const { enqueueSnackbar } = useSnackbar();

  const handleSelect = (event: React.MouseEvent<HTMLLIElement>) => {
    // @ts-ignore
    enqueueSnackbar(USER_FRIENDLY_ERROR_MESSAGES[event.currentTarget.textContent], { variant: "error" });
  };

  return (
    <Stack width={"fit-content"}>
      <FormLabel> Choose an error message to display in a notification:</FormLabel>
      <Select value={Object.values(USER_FRIENDLY_ERROR_MESSAGES)[0]} placeholder={"Select an error message"}>
        {Object.keys(USER_FRIENDLY_ERROR_MESSAGES).map((key: string) => (
          // @ts-ignore
          <MenuItem onClick={handleSelect} key={key} value={USER_FRIENDLY_ERROR_MESSAGES[key]}>
            {key}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
};

export const Shown: Story = {
  // exclude from a11y tests as this is for visual demonstration only
  parameters: { a11y: { disable: true } },
  render: () => <TestErrorDropdown />,
};
