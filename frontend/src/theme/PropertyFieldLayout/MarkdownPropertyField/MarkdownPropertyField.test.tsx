// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import MarkdownPropertyField from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";

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

// mock the ReactMarkdown component
jest.mock("react-markdown", () => {
  return jest.fn().mockImplementation((props) => {
    const { remarkPlugins, components, ...rest } = props;
    return (
      <>
        <span {...rest} />
      </>
    );
  });
});

describe("MarkdownPropertyField", () => {
  test("should render with provided markdown", () => {
    /// GIVEN a text with markdown
    const givenText = "# Header\n\nThis is a paragraph with **bold** and *italic* text.\n\n- item 1\n- item 2";
    // AND a label
    const givenLabel = "foo";
    // AND a valid fieldId
    const givenFieldId = "field-id";
    // AND given data-testid
    const givenDataTestId = "markdown-details";

    // WHEN the component is rendered
    render(
      <MarkdownPropertyField label={givenLabel} text={givenText} data-testid={givenDataTestId} fieldId={givenFieldId} />
    );

    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the component to be displayed
    const fieldPropertyComponent = screen.getByTestId(givenDataTestId);
    expect(fieldPropertyComponent).toBeInTheDocument();
    // AND the component to match the snapshot
    expect(fieldPropertyComponent).toMatchSnapshot();
  });
});
