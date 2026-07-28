import { Meta, StoryObj } from "@storybook/react";
import Footer from "./Footer";

Object.defineProperty(window, "tabiyaConfig", {
  value: {
    PARTNER_LOGOS: btoa(
      JSON.stringify([
        { src: "/wb-logo.png", alt: "World Bank Group", height: 60 },
        { src: "/logo.svg", alt: "Tabiya" },
      ])
    ),
  },
  writable: true,
});

const meta: Meta<typeof Footer> = {
  title: "Application/Footer",
  component: Footer,
  tags: ["autodocs"],
};

type Story = StoryObj<typeof Footer>;

export const Shown: Story = {
  args: {},
};

export default meta;
