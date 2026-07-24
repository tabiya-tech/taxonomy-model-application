// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import ExplorerPage from "./ExplorerPage";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import ExplorerService from "src/explorer/explorer.service";
import { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import { ExplorerItemDetail, ObjectType } from "src/explorer/explorer.types";
import { getArrayOfFakeModels } from "src/modeldirectory/_test_utilities/mockModelData";
import { routerPaths } from "src/app/routerPaths";
import { DATA_TEST_ID as EXPLORER_HEADER_DATA_TEST_ID } from "src/explorer/components/ExplorerHeader/ExplorerHeader";

const givenModels = getArrayOfFakeModels(1);
givenModels[0] = { ...givenModels[0], name: "Taxonomy for South Africa" };
const givenModelId = givenModels[0].id;

const givenRootGroup: ExplorerTreeItem = {
  id: "grp-1",
  code: "1",
  title: "Managers",
  objectType: ObjectType.ISCOGroup,
  hasChildren: true,
};

const givenChildOccupation: ExplorerTreeItem = {
  id: "occ-1120",
  code: "1120",
  title: "Business services managers",
  objectType: ObjectType.ESCOOccupation,
  hasChildren: false,
};

const givenDetail: ExplorerItemDetail = {
  id: "occ-1120",
  UUID: "occ-1120-uuid",
  definition: "Plan, direct and coordinate the delivery of business services.",
  altLabels: [],
  objectType: ObjectType.ESCOOccupation,
  code: "1120",
};

const renderExplorerPage = (initialTab: "occupations" | "skills" = "occupations") => {
  const initialPath =
    initialTab === "occupations" ? `/explorer/${givenModelId}/occupations` : `/explorer/${givenModelId}/skills`;
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
        <Route path={routerPaths.EXPLORER_OCCUPATIONS_DETAIL} element={<ExplorerPage initialTab="occupations" />} />
        <Route path={routerPaths.EXPLORER_SKILLS} element={<ExplorerPage initialTab="skills" />} />
        <Route path={routerPaths.EXPLORER_SKILLS_DETAIL} element={<ExplorerPage initialTab="skills" />} />
      </Routes>
    </MemoryRouter>
  );
};

const givenSkillResult: ExplorerTreeItem = {
  id: "skill-1",
  code: "",
  title: "manage business operations",
  objectType: ObjectType.Skill,
  hasChildren: false,
};

const givenOccupationResult: ExplorerTreeItem = {
  id: "occ-1",
  code: "1120",
  title: "business services manager",
  objectType: ObjectType.ESCOOccupation,
  hasChildren: false,
};

describe("ExplorerPage", () => {
  let getAllModelsSpy: jest.SpyInstance;
  let getRootItemsSpy: jest.SpyInstance;
  let getChildrenSpy: jest.SpyInstance;
  let getItemDetailSpy: jest.SpyInstance;
  let searchSpy: jest.SpyInstance;

  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();

    getAllModelsSpy = jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
    getRootItemsSpy = jest.spyOn(ExplorerService.prototype, "getRootItems").mockResolvedValue([givenRootGroup]);
    getChildrenSpy = jest.spyOn(ExplorerService.prototype, "getChildren").mockResolvedValue([givenChildOccupation]);
    getItemDetailSpy = jest.spyOn(ExplorerService.prototype, "getItemDetail").mockResolvedValue(givenDetail);
    searchSpy = jest
      .spyOn(ExplorerService.prototype, "search")
      .mockImplementation((_modelId, tab) =>
        Promise.resolve(tab === "occupations" ? [givenOccupationResult] : [givenSkillResult])
      );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should fetch and render the root tree items for the current model and tab", async () => {
    // GIVEN the models and root occupation groups services will resolve successfully
    // WHEN the explorer page is rendered on the occupations route
    renderExplorerPage("occupations");

    // THEN expect the root item fetched from the service to be rendered
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();

    // AND expect the correct model and tab to have been used to fetch the tree
    expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations");
    // AND expect no errors or warnings to have been logged
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should render an empty tree without crashing when fetching the root items fails", async () => {
    // GIVEN fetching the root items will fail
    getRootItemsSpy.mockRejectedValueOnce(new Error("network error"));

    // WHEN the explorer page is rendered
    renderExplorerPage("occupations");

    // THEN expect the empty-state message to be shown, rather than the page crashing
    expect(await screen.findByText("No occupations found")).toBeInTheDocument();
  });

  test("should lazily fetch and merge a group's children when it is expanded", async () => {
    // GIVEN the explorer page has rendered its root items
    renderExplorerPage("occupations");
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();

    // WHEN the user expands the root group
    await userEvent.click(screen.getByText(`${givenRootGroup.code} · ${givenRootGroup.title}`));

    // THEN expect the service to have been asked for that group's children
    await waitFor(() => expect(getChildrenSpy).toHaveBeenCalledWith(givenModelId, givenRootGroup));
    // AND expect the fetched child to be rendered in the tree
    expect(await screen.findByText(`${givenChildOccupation.code} · ${givenChildOccupation.title}`)).toBeInTheDocument();
    // AND expect the click's own selection side effect (navigating to the group's detail) to have settled
    await waitFor(() => expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, givenRootGroup));
  });

  test("should fetch and render an item's detail when it is selected", async () => {
    // GIVEN the root items include an occupation as a directly embedded child
    getRootItemsSpy.mockResolvedValueOnce([{ ...givenRootGroup, children: [givenChildOccupation] }]);

    // WHEN the explorer page is rendered directly on that occupation's detail route
    render(
      <MemoryRouter initialEntries={[`/explorer/${givenModelId}/occupations/${givenChildOccupation.id}`]}>
        <Routes>
          <Route path={routerPaths.EXPLORER_OCCUPATIONS_DETAIL} element={<ExplorerPage initialTab="occupations" />} />
        </Routes>
      </MemoryRouter>
    );

    // THEN expect the occupation to become the selected item and its detail to be fetched
    await waitFor(() => expect(getItemDetailSpy).toHaveBeenCalled());

    // THEN expect getItemDetail to have been called with the selected tree item (carrying its objectType)
    expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, givenChildOccupation);
    // AND expect the fetched definition to be rendered
    expect(await screen.findByText(givenDetail.definition)).toBeInTheDocument();
  });

  test("should refetch the root items when switching tabs", async () => {
    // GIVEN the explorer page has rendered the occupations tab
    renderExplorerPage("occupations");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations"));

    // WHEN the user switches to the skills tab
    await userEvent.click(screen.getByText("Skills"));

    // THEN expect the root items to be fetched again, for the skills tab
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills"));
  });

  test("should search skills as the user types on the skills tab, and render the matching results", async () => {
    // GIVEN the explorer page has rendered its root items on the skill tab
    renderExplorerPage("skills");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills"));

    // WHEN the user types into the search field
    const searchInput = screen.getByPlaceholderText("Search skills...");
    await userEvent.type(searchInput, "manage");

    // THEN expect the search to not have fired immediately (it is debounced)
    expect(searchSpy).not.toHaveBeenCalled();

    // AND expect it to eventually fire once, with the full typed value, and render the matching skill
    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith(givenModelId, "skills", "manage"));
    await waitFor(() => expect(screen.getAllByText(givenSkillResult.title).length).toBeGreaterThan(0));
  });

  test("should search occupations as the user types on the occupations tab, and render the matching results", async () => {
    // GIVEN the explorer page has rendered its root items on the occupations tab
    renderExplorerPage("occupations");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations"));

    // WHEN the user types into the search field
    const searchInput = screen.getByPlaceholderText("Search occupations...");
    await userEvent.type(searchInput, "manager");

    // THEN expect the search to not have fired immediately (it is debounced)
    expect(searchSpy).not.toHaveBeenCalled();

    // AND expect it to eventually fire once, with the full typed value, and render the matching occupation
    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith(givenModelId, "occupations", "manager"));
    await waitFor(() => expect(screen.getAllByText(givenOccupationResult.title).length).toBeGreaterThan(0));
  });

  test("should fall back to the root tree when the search field is cleared", async () => {
    // GIVEN the explorer page has rendered search results on the skills tab
    renderExplorerPage("skills");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills"));
    const searchInput = screen.getByPlaceholderText("Search skills...");
    await userEvent.type(searchInput, "manage");
    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith(givenModelId, "skills", "manage"));
    await waitFor(() => expect(screen.getAllByText(givenSkillResult.title).length).toBeGreaterThan(0));

    // WHEN the user clears the search field
    await userEvent.clear(searchInput);

    // THEN expect the root items to be fetched again
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledTimes(2));
  });

  test("should clear the search field when switching tabs", async () => {
    // GIVEN the explorer page has rendered search results on the skills tab
    renderExplorerPage("skills");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills"));
    const searchInput = screen.getByPlaceholderText("Search skills...");
    await userEvent.type(searchInput, "manage");
    await waitFor(() => expect(searchSpy).toHaveBeenCalledWith(givenModelId, "skills", "manage"));

    // WHEN the user switches to the occupations tab
    await userEvent.click(screen.getByText("Occupations"));

    // THEN expect the search field to have been cleared
    await waitFor(() => expect(screen.getByPlaceholderText("Search occupations...")).toHaveValue(""));
  });

  test("should render the models fetched from the model info service in the header", async () => {
    // GIVEN the model info service resolves with some models
    // WHEN the explorer page is rendered
    renderExplorerPage("occupations");

    // THEN expect the selected model's name to be shown in the header
    expect(await screen.findByText(givenModels[0].name)).toBeInTheDocument();
    expect(getAllModelsSpy).toHaveBeenCalled();
  });

  test.each([
    ["All taxonomies", EXPLORER_HEADER_DATA_TEST_ID.BACK_LINK, routerPaths.MODEL_DIRECTORY, "directory-page"],
    ["API docs", EXPLORER_HEADER_DATA_TEST_ID.API_BUTTON, routerPaths.API_DOCS, "api-docs-page"],
  ])("should navigate away when the header's %s control is used", async (_desc, testId, targetPath, targetTestId) => {
    // GIVEN the explorer page is rendered alongside the target route
    render(
      <MemoryRouter initialEntries={[`/explorer/${givenModelId}/occupations`]}>
        <Routes>
          <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
          <Route path={targetPath} element={<div data-testid={targetTestId} />} />
        </Routes>
      </MemoryRouter>
    );
    // AND the header has rendered
    await screen.findByText(givenModels[0].name);

    // WHEN the user activates the header control
    await userEvent.click(screen.getByTestId(testId));

    // THEN expect to have navigated to the target route
    expect(await screen.findByTestId(targetTestId)).toBeInTheDocument();
  });
});
