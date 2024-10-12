// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { render, screen } from "src/_test_utilities/test-utils";
import MarkdownPropertyField, {
  handleLink,
  handleTransform,
} from "src/theme/PropertyFieldLayout/MarkdownPropertyField/MarkdownPropertyField";

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
    const { remarkPlugins, urlTransform, components, ...rest } = props;
    return <span {...rest} />;
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

  test("should call handleTransform for each link", () => {
    // GIVEN a urn link
    const givenUrl = "urn:esco:occupation:1234";

    // WHEN the component is rendered
    render(<MarkdownPropertyField text={givenUrl} />);

    // THEN expect the handleTransform function to be called
    const result = handleTransform(givenUrl);
    expect(result).toEqual(givenUrl);
  });

  describe("handleLink", () => {
    test("should transform urn:esco links correctly", () => {
      // GIVEN a urn link
      const props = {
        href: "urn:esco:occupation:1234",
        children: "ESCO link",
      };

      // WHEN the handleLink function is called
      render(handleLink(props));

      // THEN expect the link to be rendered correctly
      const linkElement = screen.getByRole("link", { name: /ESCO link/i });
      expect(linkElement).toBeInTheDocument();
      // AND the link to have the correct attributes
      expect(linkElement).toHaveAttribute("href", "https://data.europa.eu/esco/occupation/1234");
      expect(linkElement).toHaveAttribute("target", "_blank");
      // AND the link to have the correct text content
      expect(linkElement).toHaveTextContent("ESCO link");
    });

    test("should render regular links without transformation", () => {
      // GIVEN a normal link
      const props = {
        href: "https://example.com",
        children: "Example link",
      };

      // WHEN the handleLink function is called
      render(handleLink(props));

      // THEN expect the link to be rendered correctly
      const linkElement = screen.getByRole("link", { name: /Example link/i });
      expect(linkElement).toBeInTheDocument();
      // AND the link to have the correct attributes
      expect(linkElement).toHaveAttribute("href", "https://example.com");
      expect(linkElement).toHaveAttribute("target", "_blank");
      // AND the link to have the correct text content
      expect(linkElement).toHaveTextContent("Example link");
    });

    test("should render unknown urn links without transformation", () => {
      // GIVEN an unknown urn link
      const props = {
        href: "urn:unknown:resource:1234",
        children: "Unknown URN link",
      };

      // WHEN the handleLink function is called
      render(handleLink(props));

      // THEN expect the link to be rendered correctly
      const linkElement = screen.getByRole("link", { name: /Unknown URN link/i });
      expect(linkElement).toBeInTheDocument();
      // AND the link to have the correct attributes
      expect(linkElement).toHaveAttribute("href", "urn:unknown:resource:1234");
      expect(linkElement).toHaveAttribute("target", "_blank");
      // AND the link to have the correct text content
      expect(linkElement).toHaveTextContent("Unknown URN link");
    });
  });
});
