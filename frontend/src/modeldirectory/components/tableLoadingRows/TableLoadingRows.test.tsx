// mute the console
import "src/_test_utilities/consoleMock";

import { Table } from "@mui/material";
import { render, screen } from "src/_test_utilities/test-utils";
import TableLoadingRows, { DATA_TEST_ID } from "./TableLoadingRows";
import TableBody from "@mui/material/TableBody";

describe("TableLoadingRows", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render correctly", () => {
    // GIVEN n numberOfCOls
    const givenNumberOfCols = 5;
    // AND n numberOfRows
    const givenNumberOfRows = 10;

    // WHEN the TableLoadingRows is rendered with the given numberOfCols and numberOfRows
    render(
      <Table>
        <TableBody>
          <TableLoadingRows numberOfCols={givenNumberOfCols} numberOfRows={givenNumberOfRows} />
        </TableBody>
      </Table>
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the given number of rows to be shown
    const skeletonRowElements = screen.getAllByTestId(DATA_TEST_ID.SKELETON_ROW);
    expect(skeletonRowElements).toHaveLength(givenNumberOfRows);
    // AND the given number of columns to be shown
    const skeletonCellElements = screen.getAllByTestId(DATA_TEST_ID.SKELETON_CELL);
    const availableNumberOfCols = skeletonCellElements.length / skeletonRowElements.length;
    expect(availableNumberOfCols).toBe(givenNumberOfCols);
    // AND to match the snapshot
    expect(skeletonRowElements).toMatchSnapshot();
  });
});
