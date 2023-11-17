import { Meta, StoryObj } from "@storybook/react";
import MenuBuilder, { MenuBuilderProps } from "./MenuBuilder";
import * as React from "react";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import { action } from "@storybook/addon-actions";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import { SendOutlined } from "@mui/icons-material";
import { getOneRandomModelMaxLength } from "src/modeldirectory/components/ModelsTable/_test_utilities/mockModelData";
import ImportProcessStateAPISpecs from "api-specifications/importProcessState";

const meta: Meta<typeof MenuBuilder> = {
  title: "ModelDirectory/MenuBuilder",
  component: MenuBuilder,
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
type Story = StoryObj<typeof MenuBuilder>;

export const Shown: Story = {
  render: (args) => <SetupComponent {...args} />,
  args: {
    open: true,
    items: [
      {
        text: "Item 1",
        icon: <CloudDownloadIcon />,
        onClick: action("Item 1 clicked"),
      },
      {
        text: "Item 2",
        icon: <SendOutlined />,
        onClick: action("Item 2 clicked"),
      },
    ],
  },
};

export const DisabledOptions: Story = {
  render: (args) => {
    const model = getOneRandomModelMaxLength();
    model.importProcessState.status = ImportProcessStateAPISpecs.Enums.Status.PENDING;
    return <SetupComponent {...args} model={model} />;
  },
  args: {
    open: true,
    items: [
      {
        text: "Item 1",
        icon: <CloudDownloadIcon />,
        onClick: action("Item 1 clicked"),
        disableOnNonSuccessfulImport: true,
      },
      {
        text: "Item 2",
        icon: <SendOutlined />,
        onClick: action("Item 2 clicked"),
        disableOnNonSuccessfulImport: true,
      },
    ],
  },
};

function SetupComponent(props: Readonly<MenuBuilderProps>) {
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
      <MenuBuilder
        anchorEl={anchorEl}
        open={anchorEl !== null && props.open}
        notifyOnClose={action("notifyOnClose")}
        items={props.items}
        model={props.model}
      />
    </>
  );
}
