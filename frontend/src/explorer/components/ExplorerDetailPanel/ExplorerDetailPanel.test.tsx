// mute the console
import "src/_test_utilities/consoleMock";

import ExplorerDetailPanel, { DATA_TEST_ID, ExplorerDetailItem } from "./ExplorerDetailPanel";
import { render, screen } from "src/_test_utilities/test-utils";
import userEvent from "@testing-library/user-event";
import { ObjectType } from "src/explorer/explorer.types";

const givenOccupationItem: ExplorerDetailItem = {
  id: "occ-1120",
  code: "1120",
  title: "Business services managers",
  objectType: ObjectType.ESCOOccupation,
  definition: "Plan, direct and coordinate the delivery of business services.",
  altLabels: ["business services manager", "commercial services manager"],
  UUID: "occ-1120-uuid",
  occupationGroupCode: "112",
  regulatedProfessionNote: "",
  requiresSkills: [
    { id: "skill-1", preferredLabel: "manage business operations", relationType: "essential" },
    { id: "skill-2", preferredLabel: "communicate effectively", relationType: "optional" },
  ],
};

const givenSkillItem: ExplorerDetailItem = {
  id: "skill-1",
  code: "",
  title: "manage business operations",
  objectType: ObjectType.Skill,
  definition: "Oversee and coordinate the day-to-day operations of a business.",
  altLabels: [],
  UUID: "skill-1-uuid",
  skillType: "skill/competence",
  reuseLevel: "cross-sector",
  requiredByOccupations: [{ id: "occ-1120", preferredLabel: "Business services managers", relationType: "essential" }],
};

const givenGroupItem: ExplorerDetailItem = {
  id: "grp-1",
  code: "1",
  title: "Managers",
  objectType: ObjectType.ISCOGroup,
  definition: "Managers plan, direct and coordinate.",
  altLabels: [],
  UUID: "grp-1-uuid",
};

const clickTab = async (name: string) => {
  await userEvent.click(screen.getByRole("tab", { name }));
};

describe("ExplorerDetailPanel", () => {
  beforeEach(() => {
    (console.error as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
  });

  test("should render a loading skeleton", () => {
    // GIVEN isLoading is true
    // WHEN the component is rendered
    render(<ExplorerDetailPanel item={null} isLoading />);

    // THEN expect no errors or warnings
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the skeleton is shown
    expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_SKELETON)).toBeInTheDocument();
  });

  test("should render an empty state when no item is selected", () => {
    // GIVEN no item is selected
    // WHEN the component is rendered
    render(<ExplorerDetailPanel item={null} />);

    // THEN expect no errors or warnings
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    // AND the empty state message is shown
    expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_EMPTY)).toBeInTheDocument();
  });

  describe("Definition tab", () => {
    test("should render the code, title, definition and alternative labels of the selected item", () => {
      // GIVEN an occupation item with a definition and alternative labels
      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenOccupationItem} />);

      // THEN expect no errors or warnings
      expect(console.error).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      // AND the code and title are shown
      expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CODE)).toHaveTextContent(givenOccupationItem.code);
      expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_TITLE)).toHaveTextContent(givenOccupationItem.title);
      // AND the definition is shown
      expect(screen.getByText(givenOccupationItem.definition as string)).toBeInTheDocument();
      // AND each alternative label is shown as a chip
      givenOccupationItem.altLabels?.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    test("should render a fallback message when there is no definition", () => {
      // GIVEN an item without a definition
      const givenItem: ExplorerDetailItem = { ...givenOccupationItem, definition: undefined };

      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenItem} />);

      // THEN expect the fallback text to be shown
      expect(screen.getByText("No definition available")).toBeInTheDocument();
    });
  });

  describe("Links tab", () => {
    test("should group an occupation's required skills into essential and optional sections", async () => {
      // GIVEN an occupation item with essential and optional skills
      render(<ExplorerDetailPanel item={givenOccupationItem} />);

      // WHEN the user opens the Links tab
      await clickTab("Links");

      // THEN expect the essential and optional skills to be listed
      expect(screen.getByText("ESSENTIAL SKILLS")).toBeInTheDocument();
      expect(screen.getByText("manage business operations")).toBeInTheDocument();
      expect(screen.getByText("OPTIONAL SKILLS")).toBeInTheDocument();
      expect(screen.getByText("communicate effectively")).toBeInTheDocument();
    });

    test("should list occupations that require a skill", async () => {
      // GIVEN a skill item that is required by an occupation
      render(<ExplorerDetailPanel item={givenSkillItem} />);

      // WHEN the user opens the Links tab
      await clickTab("Links");

      // THEN expect the requiring occupation to be listed
      expect(screen.getByText("REQUIRED BY OCCUPATIONS")).toBeInTheDocument();
      expect(screen.getByText("Business services managers")).toBeInTheDocument();
    });

    test("should render a fallback message when there are no links", async () => {
      // GIVEN a group item, which has no requiresSkills/requiredByOccupations
      render(<ExplorerDetailPanel item={givenGroupItem} />);

      // WHEN the user opens the Links tab
      await clickTab("Links");

      // THEN expect a fallback message
      expect(screen.getByText("No links available for this item.")).toBeInTheDocument();
    });
  });

  describe("Details tab", () => {
    test("should render occupation-specific fields", async () => {
      // GIVEN an occupation item
      render(<ExplorerDetailPanel item={givenOccupationItem} />);

      // WHEN the user opens the Details tab
      await clickTab("Details");

      // THEN expect the occupation-specific fields to be shown
      expect(screen.getByText("Occupation type")).toBeInTheDocument();
      expect(screen.getByText("ESCO occupation")).toBeInTheDocument();
      expect(screen.getByText("ISCO group")).toBeInTheDocument();
      expect(screen.getByText("112")).toBeInTheDocument();
      expect(screen.getByText("ESCO code")).toBeInTheDocument();
      expect(screen.getByText("Regulated profession")).toBeInTheDocument();
      expect(screen.getByText("No")).toBeInTheDocument();
      expect(screen.getByText("Alternative labels")).toBeInTheDocument();
      expect(screen.getByText(String(givenOccupationItem.altLabels?.length))).toBeInTheDocument();
      expect(screen.getByText("UUID")).toBeInTheDocument();
      expect(screen.getByText(givenOccupationItem.UUID as string)).toBeInTheDocument();
    });

    test("should render group-specific fields", async () => {
      // GIVEN an occupation group item
      render(<ExplorerDetailPanel item={givenGroupItem} />);

      // WHEN the user opens the Details tab
      await clickTab("Details");

      // THEN expect the group-specific fields to be shown
      expect(screen.getByText("Group type")).toBeInTheDocument();
      expect(screen.getByText("ISCO group")).toBeInTheDocument();
      expect(screen.getByText("Code")).toBeInTheDocument();
      // AND the code is shown both in the header and in the Details row
      expect(screen.getAllByText(givenGroupItem.code)).toHaveLength(2);
    });

    test("should render skill-specific fields", async () => {
      // GIVEN a skill item
      render(<ExplorerDetailPanel item={givenSkillItem} />);

      // WHEN the user opens the Details tab
      await clickTab("Details");

      // THEN expect the skill-specific fields to be shown, humanized
      expect(screen.getByText("Skill type")).toBeInTheDocument();
      expect(screen.getByText("Skill competence")).toBeInTheDocument();
      expect(screen.getByText("Reuse level")).toBeInTheDocument();
      expect(screen.getByText("Cross sector")).toBeInTheDocument();
    });
  });
});
