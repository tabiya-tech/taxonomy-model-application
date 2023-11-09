import * as React from "react";
import { useMemo } from "react";
import { TableCellProps, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import { ModelInfoTypes } from "src/modelInfo/modelInfoTypes";
import TableLoadingRows from "src/modeldirectory/components/tableLoadingRows/TableLoadingRows";
import PublishedWithChangesIcon from "@mui/icons-material/PublishedWithChanges";
import ImportProcessStateIcon from "src/modeldirectory/components/importProcessStateIcon/ImportProcessStateIcon";
import { ExportStateCellContent } from "./ExportStateCellContent/ExportStateCellContent";
import Container from "@mui/material/Container";

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
  TABLE_HEADER_LABEL_IMPORT_STATE: "Import state",
  TABLE_HEADER_LABEL_EXPORT_STATE: "Export state and model download",
};

export const DATA_TEST_ID = {
  MODELS_TABLE_ID: `models-table-${uniqueId}`,
  MODELS_LOADER: `models-loader-${uniqueId}`,
  MODEL_TABLE_HEADER_ROW: `model-table-header-row-${uniqueId}`,
  MODEL_TABLE_DATA_ROW: `model-table-row-${uniqueId}`,
  MODEL_CELL: `model-cell-${uniqueId}`,
  MODEL_CELL_RELEASED_ICON: `model-cell-released-icon-${uniqueId}`,
  MODEL_CELL_IMPORT_STATE_ICON_CONTAINER: `model-cell-import-state-icon-container-${uniqueId}`,
  MODEL_CELL_EXPORT_STATE_CONTAINER: `model-cell-export-state-container-${uniqueId}`,
};

interface StyledCellProps extends TableCellProps {
  cellSx?: Record<string, any>; // Define the type for the sx prop of the cell component
  typoSx?: Record<string, any>; // Define the type for the sx prop of the typography component
}

const StyledHeaderCell = ({ cellSx, typoSx, ...props }: Readonly<StyledCellProps>) => {
  return (
    <TableCell
      sx={{
        padding: (theme) => theme.tabiyaSpacing.sm,
        backgroundColor: (theme) => theme.palette.containerBackground.main,
        ...cellSx,
      }}
      data-testid={DATA_TEST_ID.MODEL_CELL}
      {...props}
    >
      <Typography
        sx={{
          // ---  Truncate too long text and show ellipsis
          overflow: "hidden",
          textOverflow: "ellipsis",
          // ---
          ...typoSx,
        }}
        variant="body1"
        fontWeight={"bold"}
      >
        {props.children}
      </Typography>
    </TableCell>
  );
};
const StyledBodyCell = ({ cellSx, typoSx, ...props }: Readonly<StyledCellProps>) => {
  return (
    <TableCell
      sx={{
        // --- Break long text at any part of the word, and shown a hyphen (-) at the break
        wordWrap: "break-word",
        hyphens: "auto",
        padding: (theme) => theme.tabiyaSpacing.sm,
        ...cellSx,
      }}
      data-testid={DATA_TEST_ID.MODEL_CELL}
      {...props}
    >
      <Typography
        sx={{
          ...typoSx,
        }}
        variant="body1"
        fontWeight={"normal"}
      >
        {props.children}
      </Typography>
    </TableCell>
  );
};

export const CELL_MAX_LENGTH = 256;
const ModelsTable = (props: Readonly<ModelsTableProps>) => {
  const sortModels = (models: ModelInfoTypes.ModelInfo[]): ModelInfoTypes.ModelInfo[] => {
    // sorts the incoming in descending order of createdAt
    return models.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  const sortedModels = useMemo((): ModelInfoTypes.ModelInfo[] => {
    // handle empty array
    if (!props.models?.length) return [];

    // make a copy of the array to avoid mutating the original array
    const toSortModels = [...props.models];
    return sortModels(toSortModels);
  }, [props.models]);

  const paperElevation = 2; // px
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
        marginTop: `${paperElevation}px`, // to compensate for the elevation of the paper
      }}
    >
      <TableContainer
        component={Paper}
        elevation={paperElevation}
        data-testid={DATA_TEST_ID.MODELS_TABLE_ID}
        sx={{
          width: `calc(100% - ${2 * paperElevation}px)`,
          height: `calc(100% - ${2 * paperElevation}px)`,
          borderRadius: (theme) => theme.tabiyaSpacing.sm,
        }}
      >
        <Table
          sx={{
            // ---- To be able to set the width of the columns, we need to set the table layout to fixed
            tableLayout: "fixed",
            width: "100%",
            minWidth: "500px",
            // ---
          }}
          stickyHeader
          tabIndex={0}
          aria-label="models table"
        >
          <TableHead>
            <TableRow data-testid={DATA_TEST_ID.MODEL_TABLE_HEADER_ROW}>
              <StyledHeaderCell width="50px" aria-label={TEXT.TABLE_HEADER_LABEL_IMPORT_STATE} />
              <StyledHeaderCell cellSx={{ width: "calc(35%)" }}>{TEXT.TABLE_HEADER_LABEL_NAME}</StyledHeaderCell>
              <StyledHeaderCell cellSx={{ width: "calc(10%)" }}>{TEXT.TABLE_HEADER_LABEL_LOCALE}</StyledHeaderCell>
              <StyledHeaderCell cellSx={{ width: "calc(10%)" }}>{TEXT.TABLE_HEADER_LABEL_VERSION}</StyledHeaderCell>
              <StyledHeaderCell cellSx={{ width: "calc(10%)" }}>{TEXT.TABLE_HEADER_LABEL_RELEASED}</StyledHeaderCell>
              <StyledHeaderCell cellSx={{ width: "calc(35%)" }}>{TEXT.TABLE_HEADER_LABEL_DESCRIPTION}</StyledHeaderCell>
              <StyledHeaderCell width={"120px"} aria-label={TEXT.TABLE_HEADER_LABEL_EXPORT_STATE} />
            </TableRow>
          </TableHead>
          <TableBody>
            {props.isLoading ? ( // Number of cols is 7 because we have 7 columns in the table
              <TableLoadingRows numberOfCols={7} numberOfRows={10} />
            ) : (
              sortedModels.map((model) => (
                <TableRow
                  tabIndex={0}
                  data-modelid={model.id}
                  key={model.id}
                  sx={{
                    verticalAlign: "top",
                  }}
                  data-testid={DATA_TEST_ID.MODEL_TABLE_DATA_ROW}
                >
                  <TableCell
                    align={"center"}
                    sx={{
                      padding: (theme) => theme.tabiyaSpacing.sm,
                    }}
                    data-testid={DATA_TEST_ID.MODEL_CELL}
                  >
                    <Container
                      style={{ display: "contents" }}
                      data-testid={DATA_TEST_ID.MODEL_CELL_IMPORT_STATE_ICON_CONTAINER}
                    >
                      <ImportProcessStateIcon importProcessState={model.importProcessState} />
                    </Container>
                  </TableCell>
                  <StyledBodyCell component="th" scope="row">
                    {model.name}
                  </StyledBodyCell>
                  <StyledBodyCell>
                    {model.locale.name} ({model.locale.shortCode})
                  </StyledBodyCell>
                  <StyledBodyCell>{model.version}</StyledBodyCell>
                  <StyledBodyCell align="center">
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
                  </StyledBodyCell>
                  <StyledBodyCell>
                    {model.description.length > CELL_MAX_LENGTH
                      ? model.description.substring(0, CELL_MAX_LENGTH) + "..."
                      : model.description}
                  </StyledBodyCell>
                  <TableCell
                    align={"center"}
                    sx={{ padding: (theme) => theme.tabiyaSpacing.sm }}
                    data-testid={DATA_TEST_ID.MODEL_CELL}
                  >
                    <Container
                      style={{ display: "contents" }}
                      data-testid={DATA_TEST_ID.MODEL_CELL_EXPORT_STATE_CONTAINER}
                    >
                      <ExportStateCellContent model={model} />
                    </Container>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
export default ModelsTable;
