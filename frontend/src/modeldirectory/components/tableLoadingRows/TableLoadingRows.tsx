import { Skeleton, TableCell, TableRow } from "@mui/material";
import { getRandomString } from "src/_test_utilities/specialCharacters";

interface TableLoadingBodyProps {
  numberOfCols: number;
  numberOfRows: number;
}

const uniqueId = "d85242de-5f0d-4a38-b469-bde62e24f992";

export const DATA_TEST_ID = {
  SKELETON_ROW: `skeleton-row-${uniqueId}`,
  SKELETON_CELL: `skeleton-cell-${uniqueId}`,
};

export default function TableLoadingRows({ numberOfRows, numberOfCols }: Readonly<TableLoadingBodyProps>) {
  // Create an array of placeholders for rows
  const rowsPlaceholder = Array.from({ length: numberOfRows }, (_, i) => (
    <TableRow key={i} data-testid={DATA_TEST_ID.SKELETON_ROW}>
      {Array.from({ length: numberOfCols }, () => (
        <TableCell key={getRandomString(5)} data-testid={DATA_TEST_ID.SKELETON_CELL}>
          <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
        </TableCell>
      ))}
    </TableRow>
  ));

  return <>{rowsPlaceholder}</>;
}
