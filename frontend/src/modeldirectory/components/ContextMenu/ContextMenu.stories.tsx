import { action } from "@storybook/addon-actions";
import { Meta, StoryObj } from "@storybook/react";
import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import * as React from "react";
import { useEffect } from "react";
import Box from "@mui/material/Box";

const meta: Meta<typeof ContextMenu> = {
  title: "ModelDirectory/ModelsTable/ContextMenu",
  component: ContextMenu,
  tags: ["autodocs"],
  argTypes: {
    open: {
      control: {
        type: "boolean",
      },
    },
    notifyOnClose: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Shown: Story = {
  render: (args) => <SetupComponent {...args} />,
  args: {
    open: true,
  },
};

export const DisabledOptions: Story = {
  render: (args) => <SetupComponent {...args} />,
  args: {
    open: true,
    isExportDisabled: true,
  },
};

function SetupComponent(props: Readonly<ContextMenuProps>) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  useEffect(() => {
    const anchor = document.getElementById("anchor-on-me");
    setAnchorEl(anchor);
  }, []);

  return (
    <>
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <div style={{ border: "1px dashed", height: "20px", width: "100px" }} id="anchor-on-me" />
      </Box>
      <ContextMenu
        anchorEl={anchorEl}
        open={anchorEl !== null && props.open}
        notifyOnClose={action("notifyOnClose")}
        notifyOnExport={action("notifyOnExport")}
        isExportDisabled={props.isExportDisabled}
      />
    </>
  );
}
