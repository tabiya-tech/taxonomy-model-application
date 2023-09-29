import * as React from "react";
import { useMemo } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import TableLoadingRows from "src/modeldirectory/components/tableLoadingRows/TableLoadingRows";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import ImportProcessStateIcon from "src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon";

interface ModelsTableProps {
  models: ModelInfoTypes.ModelInfo[];
  isLoading?: boolean;
}

const uniqueId = "ae03cd11-e992-4313-9a9e-49f497cc92d0";

export const TEXT = {
  TABLE_HEADER_LABEL_NAME: "Name",
  TABLE_HEADER_LABEL_LOCALE: "Locale",
  TABLE_HEADER_LABEL_VERSION: "Version",
  TABLE_HEADER_LABEL_RELEASED: "Released",
  TABLE_HEADER_LABEL_DESCRIPTION: "Description",
  TABLE_HEADER_LABEL_STATUS: "",
};

export const DATA_TEST_ID = {
  MODELS_TABLE_ID: `models-table-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`,
  MODEL_TABLE_HEADER_ROW: `model-table-header-row-${uniqueId}`,
  MODEL_TABLE_DATA_ROW: `model-table-row-${uniqueId}`,
  MODEL_CELL: `model-cell-${uniqueId}`,
  MODEL_CELL_RELEASED_ICON: `model-cell-released-icon-${uniqueId}`,
  MODEL_CELL_STATUS_ICON_CONTAINER: `model-cell-status-icon-container-${uniqueId}`,
};

export const CELL_MAX_LENGTH = 256;
const ModelsTable = (props: ModelsTableProps) => {
  const sortModels = (
    models: ModelInfoTypes.ModelInfo[]
  ): ModelInfoTypes.ModelInfo[] => {
    if (!models?.length) return [];
    // sorts the incoming in descending order of createdAt
    return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const sortedModels = useMemo((): ModelInfoTypes.ModelInfo[] => {
    return sortModels(props.models);
  }, [props.models]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" ,  width: "100%", height: "100%"}}>
      <Paper elevation={2} style={{ width: "98%", height: "100%" }}>
        <TableContainer
          data-testid={DATA_TEST_ID.MODELS_TABLE_ID}
          sx={{ borderRadius: "4px 4px 0 0" }}
        >
          <Table tabIndex={0} aria-label="models table">
            <TableHead>
              <TableRow data-testid={DATA_TEST_ID.MODEL_TABLE_HEADER_ROW}>
                <TableCell
                  variant="body"
                  sx={{ fontWeight: "bold" }}
                  data-testid={DATA_TEST_ID.MODEL_CELL}
                >
                  {TEXT.TABLE_HEADER_LABEL_STATUS}
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold" }}
                  data-testid={DATA_TEST_ID.MODEL_CELL}
                >
                  {TEXT.TABLE_HEADER_LABEL_NAME}
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold" }}
                  data-testid={DATA_TEST_ID.MODEL_CELL}
                >
                  {TEXT.TABLE_HEADER_LABEL_LOCALE}
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold" }}
                  data-testid={DATA_TEST_ID.MODEL_CELL}
                >
                  {TEXT.TABLE_HEADER_LABEL_VERSION}
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold" }}
                  data-testid={DATA_TEST_ID.MODEL_CELL}
                >
                  {TEXT.TABLE_HEADER_LABEL_RELEASED}
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold" }}
                  data-testid={DATA_TEST_ID.MODEL_CELL}
                >
                  {TEXT.TABLE_HEADER_LABEL_DESCRIPTION}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {props.isLoading ? ( // Number of cols is 6 because we have 6 columns in the table
                <TableLoadingRows numberOfCols={6} numberOfRows={10} />
              ) : (
                sortedModels.map((model) => (
                  <TableRow
                    tabIndex={0}
                    data-modelid={model.id}
                    key={model.id}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }} // remove the last border
                    data-testid={DATA_TEST_ID.MODEL_TABLE_DATA_ROW}
                  >
                    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
                      <Container
                        data-testid={
                          DATA_TEST_ID.MODEL_CELL_STATUS_ICON_CONTAINER
                        }
                      >
                        <ImportProcessStateIcon
                          importProcessState={model.importProcessState}
                        />
                      </Container>
                    </TableCell>
                    <TableCell
                      component="th"
                      scope="row"
                      data-testid={DATA_TEST_ID.MODEL_CELL}
                    >
                      {model.name}
                    </TableCell>
                    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
                      {model.locale.name} ({model.locale.shortCode})
                    </TableCell>
                    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
                      {model.version}
                    </TableCell>
                    <TableCell
                      align="center"
                      data-testid={DATA_TEST_ID.MODEL_CELL}
                    >
                      {
                        model.released ? (
                          <PublishedWithChangesIcon
                            data-testid={DATA_TEST_ID.MODEL_CELL_RELEASED_ICON}
                            color="disabled"
                            titleAccess="Released"
                          />
                        ) : (
                          ""
                        ) /*<IconButton> <PublishIcon color="primary"/> </IconButton>*/
                      }
                    </TableCell>
                    <TableCell data-testid={DATA_TEST_ID.MODEL_CELL}>
                      {model.description.length > CELL_MAX_LENGTH
                        ? model.description.substring(0, CELL_MAX_LENGTH) +
                          "..."
                        : model.description}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
export default ModelsTable;
