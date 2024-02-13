import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import { Drawer, useMediaQuery } from "@mui/material";
import ContentLayout from "src/theme/ContentLayout/ContentLayout";
import ModelPropertiesHeader from "./components/ModelPropertiesHeader/ModelPropertiesHeader";
import ModelPropertiesContent from "./components/ModelPropertiesContent/ModelPropertiesContent";
import { Theme } from "@mui/material/styles";

export enum CloseEventName {
  DISMISS = "DISMISS",
}

export type CloseEvent = { name: CloseEventName };

export interface ModelPropertiesDrawerProps {
  isOpen: boolean; // for the drawer
  notifyOnClose: (event: CloseEvent) => void; // for the header close button (and the footer)
  model: ModelInfoTypes.ModelInfo | null;
}

const uniqueId = "a76cf289-b403-4782-a886-b56047a8fff9";

export const DATA_TEST_ID = {
  MODEL_PROPERTIES_DRAWER: `model-properties-drawer-${uniqueId}`,
};

/**
 * ModelPropertiesDrawer responsible for rendering the drawer that displays the properties of a model
 * and using a content layout to lay out the header(ModelPropertiesHeader), a content (ModelPropertiesContent)
 * and a footer(ModelPropertiesFooter)
 * @param props
 * @constructor
 */
function ModelPropertiesDrawer(props: Readonly<ModelPropertiesDrawerProps>) {
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const handleDismiss = () => {
    try {
      props.notifyOnClose({ name: CloseEventName.DISMISS });
    } catch (e) {
      console.error("Couldn't close drawer", e);
    }
  };
  return (
    <Drawer
      anchor="right"
      open={props.isOpen}
      onClose={handleDismiss}
      PaperProps={{
        sx: {
          width: isSmallScreen ? "100%" : "40%",
          padding: 0,
        },
      }}
      data-testid={DATA_TEST_ID.MODEL_PROPERTIES_DRAWER}
    >
      <div style={{ height: "100%", width: "100%" }}>
        <ContentLayout
          headerComponent={
            <ModelPropertiesHeader
              notifyOnClose={handleDismiss}
              name={props.model !== null ? `${props.model?.name} : ${props.model?.locale.name}` : "Missing model"}
            />
          }
          mainComponent={props.model !== null ? <ModelPropertiesContent model={props.model} /> : <></>}
        />
      </div>
    </Drawer>
  );
}

export default ModelPropertiesDrawer;
