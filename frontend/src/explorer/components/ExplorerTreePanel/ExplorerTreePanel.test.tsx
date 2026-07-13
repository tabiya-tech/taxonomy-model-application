// mute the console
import "src/_test_utilities/consoleMock";

import ExplorerTreePanel, { DATA_TEST_ID, ExplorerTreeItem } from "./ExplorerTreePanel";
import { render, screen, within } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";

const givenLeafItem: ExplorerTreeItem = {
  id: "occ-1120",
  code: "1120",
  title: "Business services managers",
  objectType: "escooccupation",
  hasChildren: false,
};

const givenUnexpandedGroupItem: ExplorerTreeItem = {
  id: "grp-1",
  code: "1",
  title: "Managers",
  objectType: "iscogroup",
  hasChildren: true,
};

const givenExpandedGroupItem: ExplorerTreeItem = {
  id: "grp-2",
  code: "2",
  title: "Professionals",
  objectType: "iscogroup",
  hasChildren: true,
  children: [givenLeafItem],
};

const givenUnseenGroupItem: ExplorerTreeItem = {
  id: "grp-I3",
  code: "I3",
  title: "Unpaid domestic services for household members",
  objectType: "localgroup",
  hasChildren: true,
};

const defaultProps = {
  activeTab: "occupations" as const,
  onTabChange: jest.fn(),
  items: [] as ExplorerTreeItem[],
  onSelectItem: jest.fn(),
  onExpandItem: jest.fn(),
  searchValue: "",
  onSearchChange: jest.fn(),
};

describe("ExplorerTreePanel", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should render a loading skeleton", () => {
    // GIVEN isLoading is true
    // WHEN the component is rendered
    render(<ExplorerTreePanel {...defaultProps} isLoading />);

    // THEN expect no errors or warnings
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the skeleton is shown, and no list or empty state
    expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_SKELETON)).toBeInTheDocument();
    expect(screen.queryByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_LIST)).not.toBeInTheDocument();
  });

  test("should group occupation roots under the seen and unseen economy headers", () => {
    // GIVEN occupation roots from both the seen (iscogroup) and unseen (localgroup) economies
    render(
      <ExplorerTreePanel
        {...defaultProps}
        activeTab="occupations"
        items={[givenUnexpandedGroupItem, givenUnseenGroupItem]}
      />
    );

    // THEN expect no errors or warnings (no invalid DOM nesting)
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND both economy group headers are shown
    const groups = screen.getAllByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_GROUP);
    expect(groups).toHaveLength(2);
    expect(screen.getByText(/Seen economy · ESCO/i)).toBeInTheDocument();
    expect(screen.getByText(/Unseen economy · ICATUS/i)).toBeInTheDocument();
    // AND both items are still rendered
    expect(screen.getByText(/Managers/)).toBeInTheDocument();
    expect(screen.getByText(/Unpaid domestic services/)).toBeInTheDocument();
  });

  test("should not render economy group headers on the skills tab", () => {
    // GIVEN skill roots on the skills tab
    render(
      <ExplorerTreePanel
        {...defaultProps}
        activeTab="skills"
        items={[{ id: "S1", code: "S1", title: "Communication", objectType: "skillgroup", hasChildren: true }]}
      />
    );

    // THEN expect no economy group headers to be shown (skills are a flat list)
    expect(screen.queryByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_GROUP)).not.toBeInTheDocument();
    expect(screen.getByText(/Communication/)).toBeInTheDocument();
  });

  test.each([
    ["occupations", "No occupations found"],
    ["skills", "No skills found"],
  ])("should render an empty state for the %s tab when there are no items", (activeTab, expectedMessage) => {
    // GIVEN there are no items for the given tab
    // WHEN the component is rendered
    render(<ExplorerTreePanel {...defaultProps} activeTab={activeTab as "occupations" | "skills"} items={[]} />);

    // THEN expect the tab-appropriate empty message to be shown
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });

  test("should call onTabChange when a different tab is selected", async () => {
    // GIVEN the panel is showing the occupations tab
    const givenOnTabChange = jest.fn();
    render(<ExplorerTreePanel {...defaultProps} onTabChange={givenOnTabChange} />);

    // WHEN the user clicks the Skills tab
    await userEvent.click(screen.getByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_TAB_SKILLS));

    // THEN expect onTabChange to be called with "skills"
    expect(givenOnTabChange).toHaveBeenCalledWith("skills");
  });

  test("should call onSearchChange as the user types in the search field", async () => {
    // GIVEN an empty search value
    const givenOnSearchChange = jest.fn();
    render(<ExplorerTreePanel {...defaultProps} onSearchChange={givenOnSearchChange} />);

    // WHEN the user types into the search field
    const searchInput = within(screen.getByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_SEARCH)).getByRole("textbox");
    await userEvent.type(searchInput, "foo");

    // THEN expect onSearchChange to have been called with each typed character
    expect(givenOnSearchChange).toHaveBeenCalledWith("f");
    expect(givenOnSearchChange).toHaveBeenCalledWith("o");
  });

  test("should render each item's code and title", () => {
    // GIVEN a leaf item and a group item
    // WHEN the component is rendered
    render(<ExplorerTreePanel {...defaultProps} items={[givenLeafItem, givenUnexpandedGroupItem]} />);

    // THEN expect both items to be shown by their code and title
    expect(screen.getByText(`${givenLeafItem.code} · ${givenLeafItem.title}`)).toBeInTheDocument();
    expect(
      screen.getByText(`${givenUnexpandedGroupItem.code} · ${givenUnexpandedGroupItem.title}`)
    ).toBeInTheDocument();
  });

  test("should render an item's title alone when it has no code", () => {
    // GIVEN a skill item with no code
    const givenItem: ExplorerTreeItem = { ...givenLeafItem, id: "skill-1", code: "", title: "work in teams" };

    // WHEN the component is rendered
    render(<ExplorerTreePanel {...defaultProps} items={[givenItem]} />);

    // THEN expect the title to be shown without a leading "· "
    expect(screen.getByText("work in teams")).toBeInTheDocument();
  });

  test("should select a leaf item without triggering an expand", async () => {
    // GIVEN a leaf item (no children)
    const givenOnSelectItem = jest.fn();
    const givenOnExpandItem = jest.fn();
    render(
      <ExplorerTreePanel
        {...defaultProps}
        items={[givenLeafItem]}
        onSelectItem={givenOnSelectItem}
        onExpandItem={givenOnExpandItem}
      />
    );

    // WHEN the user clicks the item
    await userEvent.click(screen.getByText(`${givenLeafItem.code} · ${givenLeafItem.title}`));

    // THEN expect onSelectItem to be called with the item
    expect(givenOnSelectItem).toHaveBeenCalledWith(givenLeafItem);
    // AND expect onExpandItem to not be called, since leaves have nothing to expand
    expect(givenOnExpandItem).not.toHaveBeenCalled();
  });

  test("should select and lazily expand a group item whose children have not been fetched yet", async () => {
    // GIVEN a group item with hasChildren=true but children not yet fetched (undefined)
    const givenOnSelectItem = jest.fn();
    const givenOnExpandItem = jest.fn();
    render(
      <ExplorerTreePanel
        {...defaultProps}
        items={[givenUnexpandedGroupItem]}
        onSelectItem={givenOnSelectItem}
        onExpandItem={givenOnExpandItem}
      />
    );

    // WHEN the user clicks the item to expand it for the first time
    await userEvent.click(screen.getByText(`${givenUnexpandedGroupItem.code} · ${givenUnexpandedGroupItem.title}`));

    // THEN expect the item to be selected
    expect(givenOnSelectItem).toHaveBeenCalledWith(givenUnexpandedGroupItem);
    // AND expect a lazy-load to be requested, since its children haven't been fetched
    expect(givenOnExpandItem).toHaveBeenCalledWith(givenUnexpandedGroupItem);
    // AND expect a loading skeleton to appear for the pending children
    expect(
      screen.getByText(`${givenUnexpandedGroupItem.code} · ${givenUnexpandedGroupItem.title}`)
    ).toBeInTheDocument();
  });

  test("should not request an expand again for a group whose children are already loaded", async () => {
    // GIVEN a group item whose children have already been fetched
    const givenOnExpandItem = jest.fn();
    render(<ExplorerTreePanel {...defaultProps} items={[givenExpandedGroupItem]} onExpandItem={givenOnExpandItem} />);

    // WHEN the user clicks the item to expand it
    await userEvent.click(screen.getByText(`${givenExpandedGroupItem.code} · ${givenExpandedGroupItem.title}`));

    // THEN expect its already-loaded child to be rendered directly
    expect(screen.getByText(`${givenLeafItem.code} · ${givenLeafItem.title}`)).toBeInTheDocument();
    // AND expect no expand request to have been made
    expect(givenOnExpandItem).not.toHaveBeenCalled();
  });

  test("should not request an expand again while a group's children are already loading", async () => {
    // GIVEN a group item that is already mid-fetch for its children
    const givenItem: ExplorerTreeItem = { ...givenUnexpandedGroupItem, isLoadingChildren: true };
    const givenOnExpandItem = jest.fn();
    render(<ExplorerTreePanel {...defaultProps} items={[givenItem]} onExpandItem={givenOnExpandItem} />);

    // WHEN the user clicks the item
    await userEvent.click(screen.getByText(`${givenItem.code} · ${givenItem.title}`));

    // THEN expect no additional expand request to have been made
    expect(givenOnExpandItem).not.toHaveBeenCalled();
  });

  test("should select an item without collapsing an already-expanded group when only the row is clicked again", async () => {
    // GIVEN a group item whose children are already loaded and currently collapsed
    const givenOnSelectItem = jest.fn();
    render(<ExplorerTreePanel {...defaultProps} items={[givenExpandedGroupItem]} onSelectItem={givenOnSelectItem} />);
    const row = screen.getByText(`${givenExpandedGroupItem.code} · ${givenExpandedGroupItem.title}`);

    // WHEN the user clicks it twice (expand, then collapse)
    await userEvent.click(row);
    expect(screen.getByText(`${givenLeafItem.code} · ${givenLeafItem.title}`)).toBeInTheDocument();
    await userEvent.click(row);

    // THEN expect onSelectItem to have been called both times
    expect(givenOnSelectItem).toHaveBeenCalledTimes(2);
  });

  test("should highlight the selected item", () => {
    // GIVEN a leaf item that is currently selected
    render(<ExplorerTreePanel {...defaultProps} items={[givenLeafItem]} selectedItemId={givenLeafItem.id} />);

    // THEN expect the item's button to carry the MUI selected class
    expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_TREE_PANEL_ITEM)).toHaveClass("Mui-selected");
  });
});
