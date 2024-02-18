// mute the console
import "src/_test_utilities/consoleMock";

import ContentLayout, { DATA_TEST_ID } from "./ContentLayout";
import { render, screen, waitFor } from "src/_test_utilities/test-utils";

describe("ContentLayout", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  it("should render", async () => {
    // GIVEN a header component with a given test id
    const givenHeaderComponentTestId = "header-test-id";
    const givenHeaderComponent = <div data-testid={givenHeaderComponentTestId}></div>;
    // AND a main component with a given test id
    const givenMainComponentTestId = "main-test-id";
    const givenMainComponent = <div data-testid={givenMainComponentTestId}></div>;

    // AND a child component with a given test id
    const givenChildComponentTestId = "child-test-id";
    const givenChildComponent = <div data-testid={givenChildComponentTestId}></div>;

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
    // AND the ContentLayout component should match the snapshot
    expect(screen.getByTestId(DATA_TEST_ID.CONTENT_LAYOUT)).toMatchSnapshot();

    // THEN the header component is rendered initially hidden
    expect(screen.getByTestId(givenHeaderComponentTestId)).toBeInTheDocument();
    expect(screen.getByTestId(givenHeaderComponentTestId)).not.toBeVisible();
    // AND the main component is rendered initially hidden
    expect(screen.getByTestId(givenMainComponentTestId)).toBeInTheDocument();
    expect(screen.getByTestId(givenMainComponentTestId)).not.toBeVisible();
    // AND the child component is rendered initially hidden
    expect(screen.getByTestId(givenChildComponentTestId)).toBeInTheDocument();
    expect(screen.getByTestId(givenMainComponentTestId)).not.toBeVisible();

    // AND WHEN some time has passed
    // THEN the header component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenHeaderComponentTestId)).toBeVisible());
    // AND the main component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenMainComponentTestId)).toBeVisible());
    // AND the child component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenChildComponentTestId)).toBeVisible());
  });
});
