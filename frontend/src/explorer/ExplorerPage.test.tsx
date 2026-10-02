// mute the console
import "src/_test_utilities/consoleMock";

import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor, within } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import ExplorerPage from "./ExplorerPage";
import ModelInfoService from "src/modelInfo/modelInfo.service";
import ExplorerService from "src/explorer/explorer.service";
import { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import { ExplorerItemDetail, ObjectType } from "src/explorer/explorer.types";
import { getArrayOfFakeModels } from "src/modeldirectory/_test_utilities/mockModelData";
import { routerPaths } from "src/app/routerPaths";
import { DATA_TEST_ID as EXPLORER_HEADER_DATA_TEST_ID } from "src/explorer/components/ExplorerHeader/ExplorerHeader";
import { DATA_TEST_ID as EXPLORER_DETAIL_PANEL_DATA_TEST_ID } from "src/explorer/components/ExplorerDetailPanel/ExplorerDetailPanel";
import { queryClient } from "src/app/providers/QueryProvider";
import { explorerTreeQueryKey } from "src/explorer/useExplorerQueries";

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
  let getItemHistorySpy: jest.SpyInstance;
  let searchSkillsSpy: jest.SpyInstance;
  let searchOccupationsSpy: jest.SpyInstance;

  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();

    getAllModelsSpy = jest.spyOn(ModelInfoService.prototype, "getAllModels").mockResolvedValue(givenModels);
    getRootItemsSpy = jest.spyOn(ExplorerService.prototype, "getRootItems").mockResolvedValue([givenRootGroup]);
    getChildrenSpy = jest.spyOn(ExplorerService.prototype, "getChildren").mockResolvedValue([givenChildOccupation]);
    getItemDetailSpy = jest.spyOn(ExplorerService.prototype, "getItemDetail").mockResolvedValue(givenDetail);
    getItemHistorySpy = jest.spyOn(ExplorerService.prototype, "getItemHistory").mockResolvedValue([]);
    searchSkillsSpy = jest.spyOn(ExplorerService.prototype, "searchSkills").mockResolvedValue([givenSkillResult]);
    searchOccupationsSpy = jest
      .spyOn(ExplorerService.prototype, "searchOccupations")
      .mockResolvedValue([givenOccupationResult]);
  });

  afterEach(() => {
    jest.resetAllMocks();
    // undo any per-test query-default overrides (e.g. disabling retry) so they don't leak
    queryClient.setQueryDefaults(explorerTreeQueryKey(givenModelId, "occupations", "", "en"), {});
  });

  test("should fetch and render the root tree items for the current model and tab", async () => {
    // GIVEN the models and root occupation groups services will resolve successfully
    // WHEN the explorer page is rendered on the occupations route
    renderExplorerPage("occupations");

    // THEN expect the root item fetched from the service to be rendered
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();

    // AND expect the correct model and tab to have been used to fetch the tree
    expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations", "en");
    // AND expect no errors or warnings to have been logged
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  test("should render an empty tree without crashing when fetching the root items fails", async () => {
    // GIVEN fetching the root items will fail, and retries are disabled for this query
    queryClient.setQueryDefaults(explorerTreeQueryKey(givenModelId, "occupations", "", "en"), { retry: false });
    getRootItemsSpy.mockRejectedValue(new Error("network error"));

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
    await waitFor(() => expect(getChildrenSpy).toHaveBeenCalledWith(givenModelId, givenRootGroup, "en"));
    // AND expect the fetched child to be rendered in the tree
    expect(await screen.findByText(`${givenChildOccupation.code} · ${givenChildOccupation.title}`)).toBeInTheDocument();
    // AND expect the click's own selection side effect (navigating to the group's detail) to have settled
    await waitFor(() => expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, givenRootGroup, "en"));
  });

  test("should lazily fetch and merge a grandchild's children when a nested node is expanded", async () => {
    // GIVEN a root group whose fetched child is itself an expandable group, and a distinct
    // grandchild returned when that nested group's children are requested
    const givenChildGroup: ExplorerTreeItem = {
      id: "grp-11",
      code: "11",
      title: "Chief executives",
      objectType: ObjectType.ISCOGroup,
      hasChildren: true,
    };
    const givenGrandchild: ExplorerTreeItem = {
      id: "occ-1112",
      code: "1112",
      title: "Senior government officials",
      objectType: ObjectType.ESCOOccupation,
      hasChildren: false,
    };
    getChildrenSpy.mockImplementation((_modelId: string, item: ExplorerTreeItem) =>
      Promise.resolve(item.id === givenRootGroup.id ? [givenChildGroup] : [givenGrandchild])
    );

    // WHEN the explorer page is rendered and the root group is expanded
    renderExplorerPage("occupations");
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();
    await userEvent.click(screen.getByText(`${givenRootGroup.code} · ${givenRootGroup.title}`));
    expect(await screen.findByText(`${givenChildGroup.code} · ${givenChildGroup.title}`)).toBeInTheDocument();

    // AND the nested child group is also expanded
    await userEvent.click(screen.getByText(`${givenChildGroup.code} · ${givenChildGroup.title}`));

    // THEN expect the grandchild's children to have been fetched and rendered too
    await waitFor(() => expect(getChildrenSpy).toHaveBeenCalledWith(givenModelId, givenChildGroup, "en"));
    expect(await screen.findByText(`${givenGrandchild.code} · ${givenGrandchild.title}`)).toBeInTheDocument();
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
    expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, givenChildOccupation, "en");
    // AND expect the fetched definition to be rendered
    expect(await screen.findByText(givenDetail.definition)).toBeInTheDocument();
    // AND expect the item's model history to NOT have been fetched automatically, only on demand
    // when the History tab is opened
    expect(getItemHistorySpy).not.toHaveBeenCalled();
  });

  test("should fetch an item's history only when the History tab is opened", async () => {
    // GIVEN the root items include an occupation as a directly embedded child, and its detail has been fetched
    getRootItemsSpy.mockResolvedValueOnce([{ ...givenRootGroup, children: [givenChildOccupation] }]);
    render(
      <MemoryRouter initialEntries={[`/explorer/${givenModelId}/occupations/${givenChildOccupation.id}`]}>
        <Routes>
          <Route path={routerPaths.EXPLORER_OCCUPATIONS_DETAIL} element={<ExplorerPage initialTab="occupations" />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(givenDetail.definition)).toBeInTheDocument();
    expect(getItemHistorySpy).not.toHaveBeenCalled();

    // WHEN the user opens the History tab
    await userEvent.click(screen.getByText("History"));

    // THEN expect the item's model history to have been fetched for the selected item
    await waitFor(() => expect(getItemHistorySpy).toHaveBeenCalledWith(givenModelId, givenChildOccupation, "en"));
  });

  test("should reuse cached detail when revisiting a previously viewed item", async () => {
    // GIVEN the root items include an occupation as a directly embedded child, and both items'
    // details have already been fetched (the group first, then the child)
    getRootItemsSpy.mockResolvedValueOnce([{ ...givenRootGroup, children: [givenChildOccupation] }]);
    renderExplorerPage("occupations");
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();
    await userEvent.click(screen.getByText(`${givenRootGroup.code} · ${givenRootGroup.title}`));
    await waitFor(() =>
      expect(getItemDetailSpy).toHaveBeenCalledWith(
        givenModelId,
        expect.objectContaining({ id: givenRootGroup.id }),
        "en"
      )
    );
    await userEvent.click(screen.getByText(`${givenChildOccupation.code} · ${givenChildOccupation.title}`));
    await waitFor(() => expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, givenChildOccupation, "en"));
    expect(getItemDetailSpy).toHaveBeenCalledTimes(2);

    // WHEN the user revisits the first item
    await userEvent.click(screen.getByText(`${givenRootGroup.code} · ${givenRootGroup.title}`));

    // THEN expect its detail panel to be shown again for that item, without an additional fetch
    expect(await screen.findByTestId(EXPLORER_DETAIL_PANEL_DATA_TEST_ID.EXPLORER_DETAIL_PANEL_TITLE)).toHaveTextContent(
      givenRootGroup.title
    );
    expect(getItemDetailSpy).toHaveBeenCalledTimes(2);
  });

  test("should refetch the root items when switching tabs", async () => {
    // GIVEN the explorer page has rendered the occupations tab and finished loading
    renderExplorerPage("occupations");
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();

    // WHEN the user switches to the skills tab
    await userEvent.click(screen.getByText("Skills"));

    // THEN expect the root items to be fetched again, for the skills tab
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills", "en"));
  });

  test("should search skills as the user types on the skills tab, and render the matching results", async () => {
    // GIVEN the explorer page has rendered its root items on the skill tab
    renderExplorerPage("skills");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills", "en"));

    // WHEN the user types into the search field
    const searchInput = screen.getByPlaceholderText("Search skills...");
    await userEvent.type(searchInput, "manage");

    // THEN expect the search to not have fired immediately (it is debounced)
    expect(searchSkillsSpy).not.toHaveBeenCalled();

    // AND expect it to eventually fire once, with the full typed value, and render the matching skill
    await waitFor(() => expect(searchSkillsSpy).toHaveBeenCalledWith(givenModelId, "manage", "en"));
    await waitFor(() => expect(screen.getAllByText(givenSkillResult.title).length).toBeGreaterThan(0));
    // AND expect the occupations search to not have been used
    expect(searchOccupationsSpy).not.toHaveBeenCalled();
  });

  test("should search occupations as the user types on the occupations tab, and render the matching results", async () => {
    // GIVEN the explorer page has rendered its root items on the occupations tab
    renderExplorerPage("occupations");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations", "en"));

    // WHEN the user types into the search field
    const searchInput = screen.getByPlaceholderText("Search occupations...");
    await userEvent.type(searchInput, "manager");

    // THEN expect the search to not have fired immediately (it is debounced)
    expect(searchOccupationsSpy).not.toHaveBeenCalled();

    // AND expect it to eventually fire once, with the full typed value, and render the matching occupation
    await waitFor(() => expect(searchOccupationsSpy).toHaveBeenCalledWith(givenModelId, "manager", "en"));
    await waitFor(() => expect(screen.getAllByText(givenOccupationResult.title).length).toBeGreaterThan(0));
    // AND expect the skills search to not have been used
    expect(searchSkillsSpy).not.toHaveBeenCalled();
  });

  test("should fall back to the root tree when the search field is cleared, reusing the cached root items", async () => {
    // GIVEN the explorer page has rendered search results on the skills tab
    renderExplorerPage("skills");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills", "en"));
    const searchInput = screen.getByPlaceholderText("Search skills...");
    await userEvent.type(searchInput, "manage");
    await waitFor(() => expect(searchSkillsSpy).toHaveBeenCalledWith(givenModelId, "manage", "en"));
    await waitFor(() => expect(screen.getAllByText(givenSkillResult.title).length).toBeGreaterThan(0));

    // WHEN the user clears the search field
    await userEvent.clear(searchInput);

    // THEN expect the root items to be shown again, reused from the cache rather than refetched
    expect(await screen.findByText(`${givenRootGroup.code} · ${givenRootGroup.title}`)).toBeInTheDocument();
    expect(getRootItemsSpy).toHaveBeenCalledTimes(1);
  });

  test("should clear the search field when switching tabs", async () => {
    // GIVEN the explorer page has rendered search results on the skills tab
    renderExplorerPage("skills");
    await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "skills", "en"));
    const searchInput = screen.getByPlaceholderText("Search skills...");
    await userEvent.type(searchInput, "manage");
    await waitFor(() => expect(searchSkillsSpy).toHaveBeenCalledWith(givenModelId, "manage", "en"));

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

  describe("language switching", () => {
    const givenMultiLanguageModel = { ...givenModels[0], availableLanguages: ["en", "fr"] };

    test("should not render the language switcher when the model has a single language", async () => {
      // GIVEN the only model available has a single available language (the default fixture)
      // WHEN the explorer page is rendered
      renderExplorerPage("occupations");
      await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalled());

      // THEN expect the language switcher to not be rendered
      expect(screen.queryByTestId(EXPLORER_HEADER_DATA_TEST_ID.LANGUAGE_SELECT)).not.toBeInTheDocument();
    });

    test("should list the model's available languages and refetch the tree and detail with the chosen language", async () => {
      // GIVEN the selected model has more than one available language
      getAllModelsSpy.mockResolvedValue([givenMultiLanguageModel]);
      renderExplorerPage("occupations");
      await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations", "en"));
      await waitFor(() =>
        expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, expect.objectContaining({ id: "grp-1" }), "en")
      );

      // WHEN the user opens the language switcher and picks French
      const combobox = within(screen.getByTestId(EXPLORER_HEADER_DATA_TEST_ID.LANGUAGE_SELECT)).getByRole("combobox");
      await userEvent.click(combobox);
      const listbox = await screen.findByRole("listbox");
      await userEvent.click(within(listbox).getByText("French"));

      // THEN expect the tree and the selected item's detail to be refetched in the chosen language
      await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations", "fr"));
      await waitFor(() =>
        expect(getItemDetailSpy).toHaveBeenCalledWith(givenModelId, expect.objectContaining({ id: "grp-1" }), "fr")
      );
    });

    test("should restore the language from the URL's language query parameter", async () => {
      // GIVEN the selected model has more than one available language
      getAllModelsSpy.mockResolvedValue([givenMultiLanguageModel]);

      // WHEN the explorer page is rendered with a language query parameter in the URL
      render(
        <MemoryRouter initialEntries={[`/explorer/${givenModelId}/occupations?lang=fr`]}>
          <Routes>
            <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
          </Routes>
        </MemoryRouter>
      );

      // THEN expect the tree to have been fetched in the URL's language
      await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations", "fr"));
      // AND expect the switcher to reflect that language
      expect(
        within(await screen.findByTestId(EXPLORER_HEADER_DATA_TEST_ID.LANGUAGE_SELECT)).getByText("French")
      ).toBeInTheDocument();
    });

    test("should fall back to the model's first available language when the URL names one it does not have", async () => {
      // GIVEN the selected model only has English and French
      getAllModelsSpy.mockResolvedValue([givenMultiLanguageModel]);

      // WHEN the explorer page is rendered with an unsupported language in the URL
      render(
        <MemoryRouter initialEntries={[`/explorer/${givenModelId}/occupations?lang=de`]}>
          <Routes>
            <Route path={routerPaths.EXPLORER_OCCUPATIONS} element={<ExplorerPage initialTab="occupations" />} />
          </Routes>
        </MemoryRouter>
      );

      // THEN expect the tree to have been fetched in the model's first available language instead
      await waitFor(() => expect(getRootItemsSpy).toHaveBeenCalledWith(givenModelId, "occupations", "en"));
    });
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
