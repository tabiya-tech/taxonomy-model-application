import ApproveModal from "./ApproveModal";
import { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ApproveModal> = {
  title: "Components/ApproveModal",
  component: ApproveModal,
  tags: ["autodocs"],
  argTypes: {
    onApprove: { action: "onApprove" },
    onCancel: { action: "onCancel" },
  },
};

export default meta;

type Story = StoryObj<typeof ApproveModal>;

export const Shown: Story = {
  args: {
    title: "Sample Title",
    content: (
      <>
        This is a sample body text for the ApproveModal component.
        <br />
        <br />
        Please confirm your action.
      </>
    ),
    isOpen: true,
    cancelButtonText: "Cancel",
    approveButtonText: "Confirm",
  },
};
