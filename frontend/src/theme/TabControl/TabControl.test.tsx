// mock the chatty console
import "src/_test_utilities/consoleMock";

import TabControl, { DATA_TEST_ID } from "./TabControl";
import { render, screen, within, act, waitFor } from "src/_test_utilities/test-utils";
import { TabControlConfig } from "./TabControl.types";

describe("TabControl component render tests", () => {
  test("renders correctly with no items", () => {
    // GIVEN an empty array of `items`
    // AND a `data-testid`
    const dataTestId = "test-id";
    // WHEN the TabControl component is rendered
    render(<TabControl items={[]} data-testid={dataTestId} aria-label={"Test tabs"} />);
    // THEN the component should be rendered
    const tabControlComponent = screen.getByTestId(dataTestId);
    expect(tabControlComponent).toBeInTheDocument();
    // THEN it is rendered with no labels
    const labelComponent = screen.queryByTestId(DATA_TEST_ID.TAB_CONTROL_LABEL);
    expect(labelComponent).not.toBeInTheDocument();
    // AND it is rendered with no panels
    const panelComponent = screen.queryByTestId(DATA_TEST_ID.TAB_CONTROL_PANEL);
    expect(panelComponent).not.toBeInTheDocument();
    // AND match the snapshot
    expect(tabControlComponent).toMatchSnapshot();
    // AND no errors should be logged to the console
    expect(console.error).not.toHaveBeenCalled();
  });

  test("renders tabs and content for a single provided item", async () => {
    // GIVEN a single `TabControlConfig` item with unique `id`, `label`, and `panel`
    const givenItem: TabControlConfig = {
      id: "unique-id",
      label: "Test Label",
      panel: <div>Test Panel</div>,
    };
    // AND a `data-testid`
    const givenTestId = "test-id";
    // WHEN the TabControl component is rendered
    render(<TabControl items={[givenItem]} data-testid={givenTestId} aria-label={"Test tabs"} />);
    // THEN it should display the component
    const tabControlComponent = screen.getByTestId(givenTestId);
    expect(tabControlComponent).toBeInTheDocument();
    // AND it should display one tab with the `label`
    const tabLabel = within(tabControlComponent).getByTestId(DATA_TEST_ID.TAB_CONTROL_LABEL);
    expect(tabLabel).toBeInTheDocument();
    // AND display the panel content
    const tabPanel = within(tabControlComponent).getByTestId(DATA_TEST_ID.TAB_CONTROL_PANEL);
    expect(tabPanel).toBeInTheDocument();
    // AND match the snapshot
    expect(tabControlComponent).toMatchSnapshot();

    // AND WHEN some time has passed
    // THEN the component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenTestId)).toBeVisible());
    // AND the label is rendered visible
    await waitFor(() => expect(screen.getByTestId(DATA_TEST_ID.TAB_CONTROL_LABEL)).toBeVisible());
    // AND the panel is rendered visible
    await waitFor(() => expect(screen.getByTestId(DATA_TEST_ID.TAB_CONTROL_PANEL)).toBeVisible());

    // AND no errors should be logged to the console
    expect(console.error).not.toHaveBeenCalled();
  });

  test("renders tabs and content for multiple provided items", async () => {
    // GIVEN an array of `TabControlConfig` items with unique `id`, `label`, and `panel` components
    const givenItems: TabControlConfig[] = [
      {
        id: "unique-id-1",
        label: "Test Label 1",
        panel: <div>Test Panel 1</div>,
      },
      {
        id: "unique-id-2",
        label: "Test Label 2",
        panel: <div>Test Panel 2</div>,
      },
    ];
    // AND a `data-testid`
    const givenTestId = "test-id";
    // WHEN the TabControl component is rendered
    render(<TabControl items={givenItems} data-testid={givenTestId} aria-label={"Test tabs"} />);
    // AND it should display the component
    const tabControlComponent = screen.getByTestId(givenTestId);
    expect(tabControlComponent).toBeInTheDocument();
    // THEN it should display tabs for each item based on the `label`
    expect(screen.getByText(givenItems[0].label)).toBeInTheDocument();
    expect(screen.getByText(givenItems[1].label)).toBeInTheDocument();
    // AND display the first item's panel content by default
    expect(screen.getByText("Test Panel 1")).toBeInTheDocument();
    // AND match the snapshot
    expect(tabControlComponent).toMatchSnapshot();

    // AND after some time has passed
    // THEN the component is rendered visible
    await waitFor(() => expect(screen.getByTestId(givenTestId)).toBeVisible());
    // AND the first label is rendered visible
    await waitFor(() => expect(screen.getByText(givenItems[0].label)).toBeVisible());
    // AND the second label is rendered visible
    await waitFor(() => expect(screen.getByText(givenItems[1].label)).toBeVisible());
    // AND the first panel is rendered visible
    await waitFor(() => expect(screen.getByText("Test Panel 1")).toBeVisible());

    // AND no errors should be logged to the console
    expect(console.error).not.toHaveBeenCalled();
  });
});

describe("TabControl component interaction tests", () => {
  test("switches content when a tab is clicked", async () => {
    // GIVEN an array of `TabControlConfig` items with unique `id`, `label`, and `panel` components
    const givenItems: TabControlConfig[] = [
      {
        id: "unique-id-1",
        label: "Test Label 1",
        panel: <div>Test Panel 1</div>,
      },
      {
        id: "unique-id-2",
        label: "Test Label 2",
        panel: <div>Test Panel 2</div>,
      },
      {
        id: "unique-id-3",
        label: "Test Label 3",
        panel: <div>Test Panel 3</div>,
      },
    ];
    // AND a `data-testid`
    const givenTestId = "test-id";
    // AND the TabControl component is rendered
    render(<TabControl items={givenItems} data-testid={givenTestId} aria-label={"Test tabs"} />);

    // WHEN the second tab label is clicked
    act(() => {
      screen.getByText(givenItems[1].label).click();
    });
    // THEN the second item's panel content should be displayed
    expect(screen.getByText("Test Panel 2")).toBeInTheDocument();
    // AND the first item's panel content should not be displayed
    expect(screen.queryByText("Test Panel 1")).not.toBeInTheDocument();
    // AND the third item's panel content should not be displayed
    expect(screen.queryByText("Test Panel 3")).not.toBeInTheDocument();

    // AND after some time has passed
    // THEN the second panel is rendered visible
    await waitFor(() => expect(screen.getByText("Test Panel 2")).toBeVisible());

    // AND WHEN the third tab label is clicked
    act(() => {
      screen.getByText(givenItems[2].label).click();
    });
    // THEN the third item's panel content should be displayed
    expect(screen.getByText("Test Panel 3")).toBeInTheDocument();
    // AND the first item's panel content should not be displayed
    expect(screen.queryByText("Test Panel 1")).not.toBeInTheDocument();
    // AND the second item's panel content should not be displayed
    expect(screen.queryByText("Test Panel 2")).not.toBeInTheDocument();

    // AND after some time has passed
    // THEN the third panel is rendered visible
    await waitFor(() => expect(screen.getByText("Test Panel 3")).toBeVisible());

    // AND WHEN the first tab label is clicked again
    act(() => {
      screen.getByText(givenItems[0].label).click();
    });
    // THEN the first item's panel content should be displayed
    expect(screen.getByText("Test Panel 1")).toBeInTheDocument();
    // AND the second item's panel content should not be displayed
    expect(screen.queryByText("Test Panel 2")).not.toBeInTheDocument();
    // AND the third item's panel content should not be displayed
    expect(screen.queryByText("Test Panel 3")).not.toBeInTheDocument();

    // AND after some time has passed
    // THEN the first panel is rendered visible
    await waitFor(() => expect(screen.getByText("Test Panel 1")).toBeVisible());

    // AND no errors should be logged to the console
    expect(console.error).not.toHaveBeenCalled();
  });
});
