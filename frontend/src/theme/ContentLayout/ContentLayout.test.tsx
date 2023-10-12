// mute the console
import "src/_test_utilities/consoleMock";

import ContentLayout, { DATA_TEST_ID } from "./ContentLayout";
import { render, screen } from "src/_test_utilities/test-utils";

describe("ContentLayout", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should render", () => {
    // GIVEN a header component
    const givenHeaderComponent = <div data-testid={"header-test-id"}></div>;
    // AND a main component
    const givenMainComponent = <div data-testid={"main-test-id"}></div>;

    // AND a child component
    const givenChildComponent = <div data-testid={"child-test-id"}></div>;

    // WHEN the ContentLayout is rendered with the given header,  main and child components
    render(
      <ContentLayout headerComponent={givenHeaderComponent} mainComponent={givenMainComponent}>
        {givenChildComponent}
      </ContentLayout>
    );
    // THEN the ContentLayout is rendered
    // THEN expect no errors or warning to have occurred
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    // AND the ContentLayout component should be in the document
    expect(screen.getByTestId(DATA_TEST_ID.CONTENT_LAYOUT)).toBeInTheDocument();
    // THEN the header component is rendered
    expect(screen.getByTestId("header-test-id")).toBeInTheDocument();
    // AND the main component is rendered
    expect(screen.getByTestId("main-test-id")).toBeInTheDocument();
    // AND the child component is rendered
    expect(screen.getByTestId("child-test-id")).toBeInTheDocument();
  });
});
