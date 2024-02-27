// mute the console
import "src/_test_utilities/consoleMock";

// mock the PropertyFieldLayout component
jest.mock("src/theme/PropertyFieldLayout/PropertyFieldLayout", () => {
  return {
    __esModule: true,
    default: jest
      .fn()
      .mockImplementation((props: { title: string; "data-testid": string; children: React.ReactNode }) => {
        return (
          <div data-testid={props["data-testid"]}>
            <span>{props.title}</span>
            <span>{props.children}</span>
          </div>
        );
      }),
  };
});

import TextPropertyField, { DATA_TEST_ID } from "./TextPropertyField";
import { screen } from "@testing-library/react";
import { render } from "src/_test_utilities/test-utils";
import PropertyFieldLayout from "src/theme/PropertyFieldLayout/PropertyFieldLayout";
import { Typography } from "@mui/material";
import React from "react";

describe("TextPropertyField", () => {
  describe("render tests", () => {
    test("should render with provided label and text", () => {
      // GIVEN an item with a label and a child component
      const givenItem = {
        label: "foo",
        text: "bar",
      };
      // AND a valid fieldId
      const givenFieldId = "field-id";
      // AND a data-testid
      const givenDataTestId = "item-details";

      // WHEN the component is rendered
      render(<TextPropertyField {...givenItem} data-testid={givenDataTestId} fieldId={givenFieldId} />);

      // THEN expect no errors or warning to have occurred
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the component to be displayed
      const textPropertyComponent = screen.getByTestId(givenDataTestId);
      expect(textPropertyComponent).toBeInTheDocument();
      // AND the PropertyFieldComponent to have been given the expected props
      const expectedChildrenComponent = (
        <Typography
          variant="body1"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          data-testid={DATA_TEST_ID.TEXT_PROPERTY_FIELD_TEXT}
          aria-labelledby={givenFieldId}
          role={"text"}
        >
          {givenItem.text}
        </Typography>
      );
      expect(PropertyFieldLayout).toHaveBeenCalledWith(
        {
          title: givenItem.label,
          fieldId: givenFieldId,
          "data-testid": givenDataTestId,
          children: expect.objectContaining({
            type: expectedChildrenComponent.type,
            props: expectedChildrenComponent.props,
          }),
        },
        {}
      );

      // AND the component to match the snapshot
      expect(textPropertyComponent).toMatchSnapshot();
    });
  });
});
