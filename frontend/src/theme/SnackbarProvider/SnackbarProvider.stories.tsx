import type { Meta, StoryObj } from "@storybook/react";
import SnackbarProvider, { useSnackbar, VariantType } from "./SnackbarProvider";
import { Button } from "@mui/material";
import { v4 as uuidv4 } from "uuid";
import { faker } from "@faker-js/faker";
import { useEffect } from "react";

const meta: Meta<typeof SnackbarProvider> = {
  title: "Components/SnackBar",
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

type Color = "success" | "error" | "warning" | "info";

interface ButtonConfig {
  color: Color;
  message: string;
  variant: VariantType;
}

const TestButton = () => {
  const { enqueueSnackbar } = useSnackbar();

  const buttons: ButtonConfig[] = [
    { color: "success", message: "Success message", variant: "success" },
    { color: "error", message: "Failed message", variant: "error" },
    { color: "warning", message: "Warning message", variant: "warning" },
    { color: "info", message: "Info message", variant: "info" },
  ];

  const handleSnackbar = (message: string, variant: VariantType) => {
    enqueueSnackbar(message, { variant });
  };

  return (
    <>
      {buttons.map((button: ButtonConfig) => (
        <Button
          key={uuidv4()}
          color={button.color}
          onClick={() => handleSnackbar(button.message, button.variant)}
          style={{ textTransform: "uppercase" }}
        >
          {button.variant}
        </Button>
      ))}
    </>
  );
};
export const Shown: Story = {
  // exclude from a11y tests as this is for visual demonstration only
  parameters: {
    docs: { disable: false },
    a11y: { disable: true },
  },
  render: () => <TestButton />,
};

export const ShownInfo: Story = {
  render: () => {
    return <ShowNotifications notifications={getRandomNotificationProps(5, "info")} />;
  },
};

export const ShownWarning: Story = {
  render: () => {
    return <ShowNotifications notifications={getRandomNotificationProps(5, "warning")} />;
  },
};

export const ShownError: Story = {
  render: () => {
    return <ShowNotifications notifications={getRandomNotificationProps(5, "error")} />;
  },
};

export const ShownSuccess: Story = {
  render: () => {
    return <ShowNotifications notifications={getRandomNotificationProps(5, "success")} />;
  },
};

export const ShownMixed: Story = {
  render: () => {
    const notifications = [
      ...getRandomNotificationProps(3, "info"),
      ...getRandomNotificationProps(3, "warning"),
      ...getRandomNotificationProps(3, "error"),
      ...getRandomNotificationProps(3, "success"),
    ];
    return <ShowNotifications notifications={notifications} />;
  },
};

function getRandomNotificationProps(count: number, variant: VariantType): { message: string; variant: VariantType }[] {
  return Array(count)
    .fill(undefined)
    .map(() => ({ message: faker.lorem.words(10), variant: variant }));
}

function ShowNotifications(props: Readonly<{ notifications: { message: string; variant: VariantType }[] }>) {
  const { enqueueSnackbar } = useSnackbar();
  useEffect(() => {
    props.notifications.forEach((notification) => {
      enqueueSnackbar(notification.message, {
        variant: notification.variant,
        transitionDuration: { enter: 0, exit: 0 },
      }); // disable the transition to speed up the test
    });
  });
  return <></>;
}
