// render test the Sloth

import React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import { Sloth, DATA_TEST_ID, SlothProps } from "./Sloth";

describe("Sloth", () => {
  it("should render the sloth with the default props", () => {
    // GIVEN some children
    const children = <div data-testid="children" />;
    // WHEN the component is rendered
    render(<Sloth>{children}</Sloth>);

    // THEN the children should be rendered
    expect(screen.getByTestId("children")).toBeInTheDocument();

    // AND the sloth should be rendered
    const actualSloth = screen.getByTestId(DATA_TEST_ID.SLOTH);
    expect(actualSloth).toBeInTheDocument();

    /// AND the sloth should habe the correct styles
    expect(actualSloth).toMatchSnapshot();
  });

  it("should render the sloth with given props", () => {
    // GIVEN some children
    const children = <div data-testid="children" />;
    // AND some props
    const givenSlothProps: SlothProps = {
      width: "100px",
      strokeColor: "green",
      bodyColor: "red",
      faceColor: "blue",
    };
    // WHEN the sloth is rendered with the given props
    render(<Sloth {...givenSlothProps}>{children}</Sloth>);

    // THEN the children should be rendered
    expect(screen.getByTestId("children")).toBeInTheDocument();

    // AND the sloth should be rendered
    const actualSloth = screen.getByTestId(DATA_TEST_ID.SLOTH);
    expect(actualSloth).toBeInTheDocument();

    // AND the sloth should habe the correct styles
    expect(actualSloth).toMatchSnapshot();
  });
});
