// mute the console
import "src/_test_utilities/consoleMock";

import PropertyFieldLayout, { DATA_TEST_ID } from "./PropertyFieldLayout";
import { screen, within } from "@testing-library/react";
import { render } from "src/_test_utilities/test-utils";

describe("PropertyFieldLayout", () => {
  describe("render tests", () => {
    test("should render with provided title", () => {
      // GIVEN an item with a title and a child component
      const givenTitle = "foo";
      const givenChildText = "bar";
      const givenChildren = <div>{givenChildText}</div>;
      // AND a data-testid
      const givenDataTestId = "item-details";
      // AND a unique fieldId
      const givenFieldId = "field-id";
      // WHEN the component is rendered
      render(
        <PropertyFieldLayout title={givenTitle} data-testid={givenDataTestId} fieldId={givenFieldId}>
          {givenChildren}
        </PropertyFieldLayout>
      );

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const propertyFieldLayoutComponent = screen.getByTestId(givenDataTestId);
      expect(propertyFieldLayoutComponent).toBeInTheDocument();
      // AND the given item's title to be displayed
      const titleElement = within(propertyFieldLayoutComponent).getByTestId(DATA_TEST_ID.ITEM_TITLE);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(givenTitle);
      // AND the given item's children to be displayed
      const childrenElement = within(propertyFieldLayoutComponent).getByText(givenChildText);
      expect(childrenElement).toBeInTheDocument();

      // AND the component to match the snapshot
      expect(propertyFieldLayoutComponent).toMatchSnapshot();
    });
  });
});