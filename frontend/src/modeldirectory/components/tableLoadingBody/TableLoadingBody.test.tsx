import {render, screen} from "@testing-library/react";
import TableLoadingBody, {DATA_TEST_ID} from "./TableLoadingBody";

describe("TableLoadingBody", () => {
  test("should render correctly", () => {
    // GIVEN n numberOfCOls
    const givenNumberOfCols = 5;
    
    // WHEN the TableLoadingBody is rendered with the givenNumberOfCols
    render(<TableLoadingBody numberOfCols={givenNumberOfCols} />)
    
    // THEN expect some skeleton rows to be shown
    const skeletonRowElements = screen.getAllByTestId(DATA_TEST_ID.SKELETON_ROW);
    expect(skeletonRowElements.length).toBeGreaterThanOrEqual(1);
    // AND skeletons to be split into correct number of columns
    const skeletonCellElements = screen.getAllByTestId(DATA_TEST_ID.SKELETON_CELL);
    const availableNumberOfCols = skeletonCellElements.length / skeletonRowElements.length
    expect(availableNumberOfCols).toBe(givenNumberOfCols);
  })
})