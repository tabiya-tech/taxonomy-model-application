// mute the console
import "src/_test_utilities/consoleMock";

import ContentLayout, { DATA_TEST_ID } from "./ContentLayout";
import { render, screen, waitFor, fireEvent } from "src/_test_utilities/test-utils";

describe("ContentLayout", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render", async () => {
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

    // AND WHEN some time has passed
    // THEN the header component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenHeaderComponentTestId)).toBeVisible());
    // AND the main component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenMainComponentTestId)).toBeVisible());
    // AND the child component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenChildComponentTestId)).toBeVisible());
  });

  test("should show the entire content when the main component contains long text or content", async () => {
    // GIVEN header component with a given test id
    const givenHeaderComponentTestId = "header-test-id";
    const givenHeaderComponent = <div data-testid={givenHeaderComponentTestId}></div>;

    // AND a main component with a given test id and long text
    const lastSentence = "last test sentence"; // last sentence to be used to verify the full content is displayed
    const givenLongText = (
      <>
        {/*Use numbers so that the snapshot will be consistent*/}
        {Array.from(Array(100000).keys()).join(" ")}
        {lastSentence}
      </>
    );

    // WHEN the ContentLayout is rendered
    render(<ContentLayout headerComponent={givenHeaderComponent} mainComponent={givenLongText} />);

    // THEN expect the content layout to be in the document
    expect(screen.getByTestId(DATA_TEST_ID.CONTENT_LAYOUT)).toBeInTheDocument();

    // AND the header component to be in the document
    expect(screen.getByTestId(givenHeaderComponentTestId)).toBeInTheDocument();

    // AND the main component to be in the document
    const mainComponent = screen.getByTestId(DATA_TEST_ID.CONTENT_LAYOUT_MAIN);
    expect(mainComponent).toBeInTheDocument();

    // AND the content to scrollable
    expect(mainComponent).toHaveStyle("overflow-y: auto;");

    // AND the user can scroll to see the full content
    fireEvent.scroll(mainComponent, { deltaY: mainComponent.scrollHeight });

    // AND the last sentence should be in the view port
    expect(mainComponent).toBeVisible();

    // AND to match the snapshot
    expect(mainComponent).toMatchSnapshot();
  });
});
