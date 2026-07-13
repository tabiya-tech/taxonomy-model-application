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
  contains: [
    { id: "grp-11", code: "11", title: "Chief executives, senior officials and legislators" },
    { id: "grp-12", code: "12", title: "Administrative and commercial managers" },
  ],
};

const givenLocalOccupationItem: ExplorerDetailItem = {
  id: "occ-I411",
  code: "I411",
  title: "caring for children including feeding, cleaning and physical care",
  objectType: ObjectType.LocalOccupation,
  definition: "Caring for and instructing children of one's own household.",
};

const givenEmptyGroupItem: ExplorerDetailItem = {
  id: "grp-4",
  code: "4",
  title: "Clerical support workers",
  objectType: ObjectType.ISCOGroup,
  definition: "Classification group.",
  contains: [],
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
    test("should render the code, title and definition of the selected item", () => {
      // GIVEN an occupation item with a definition
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
      // AND a non-group item shows no "Contains" section
      expect(screen.queryByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CONTAINS)).not.toBeInTheDocument();
    });

    test("should render a fallback message when there is no definition", () => {
      // GIVEN an item without a definition
      const givenItem: ExplorerDetailItem = { ...givenOccupationItem, definition: undefined };

      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenItem} />);

      // THEN expect the fallback text to be shown
      expect(screen.getByText("No definition available")).toBeInTheDocument();
    });

    test("should render the alternative labels under 'Also known as'", () => {
      // GIVEN an item with alternative labels
      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenOccupationItem} />);

      // THEN expect the 'Also known as' section with a chip per label
      const actualAltLabels = screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_ALT_LABELS);
      expect(actualAltLabels).toHaveTextContent("Also known as");
      givenOccupationItem.altLabels?.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    test("should not render the 'Also known as' section when there are no alternative labels", () => {
      // GIVEN an item without alternative labels
      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenSkillItem} />);

      // THEN expect no 'Also known as' section
      expect(screen.queryByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_ALT_LABELS)).not.toBeInTheDocument();
    });

    test("should not render the 'Also known as' section when the only alternative label repeats the title", () => {
      // GIVEN an item (e.g. a group) whose only alternative label is its own title
      const givenItem: ExplorerDetailItem = {
        ...givenOccupationItem,
        title: "Water and firewood collectors",
        altLabels: ["Water and firewood collectors"],
      };

      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenItem} />);

      // THEN expect no 'Also known as' section, since it would add no information
      expect(screen.queryByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_ALT_LABELS)).not.toBeInTheDocument();
    });

    test("should hide alternative labels that repeat the title but show the remaining ones", () => {
      // GIVEN an item with one alternative label repeating the title and one genuine alternative
      const givenItem: ExplorerDetailItem = {
        ...givenOccupationItem,
        altLabels: [givenOccupationItem.title, "genuine alternative"],
      };

      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenItem} />);

      // THEN expect only the genuine alternative label to be shown
      const actualAltLabels = screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_ALT_LABELS);
      expect(actualAltLabels).toHaveTextContent("genuine alternative");
      expect(actualAltLabels).not.toHaveTextContent(givenOccupationItem.title);
    });

    test("should list the children of a group under 'Contains'", () => {
      // GIVEN a group item with children
      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenGroupItem} />);

      // THEN expect the Contains section with the child count and each child (label + code)
      const contains = screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CONTAINS);
      expect(contains).toHaveTextContent(`Contains · ${givenGroupItem.contains?.length}`);
      givenGroupItem.contains?.forEach((child) => {
        expect(screen.getByText(child.title)).toBeInTheDocument();
        expect(screen.getByText(child.code)).toBeInTheDocument();
      });
    });

    test("should show 'Empty group.' for a group with no children", () => {
      // GIVEN a group item with no children
      // WHEN the component is rendered
      render(<ExplorerDetailPanel item={givenEmptyGroupItem} />);

      // THEN expect the empty-group message under Contains
      expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_CONTAINS)).toHaveTextContent("Contains · 0");
      expect(screen.getByText("Empty group.")).toBeInTheDocument();
    });
  });

  describe("Links tab", () => {
    test("should label the links tab 'Skills linked' and group an occupation's skills with counts", async () => {
      // GIVEN an occupation item with essential and optional skills
      render(<ExplorerDetailPanel item={givenOccupationItem} />);

      // WHEN the user opens the (occupation-specific) links tab
      await clickTab("Skills linked");

      // THEN expect the essential and optional sections with inline counts, and the skills listed
      expect(screen.getByText(/Essential skills · 1/)).toBeInTheDocument();
      expect(screen.getByText("manage business operations")).toBeInTheDocument();
      expect(screen.getByText(/Optional skills · 1/)).toBeInTheDocument();
      expect(screen.getByText("communicate effectively")).toBeInTheDocument();
    });

    test("should label the links tab 'Occupations linked' and show requiring occupations with their code", async () => {
      // GIVEN a skill item that is required by an occupation (with a code)
      const givenSkill: ExplorerDetailItem = {
        ...givenSkillItem,
        requiredByOccupations: [
          { id: "occ-2211", preferredLabel: "general practitioner", code: "2211.1", relationType: "essential" },
        ],
      };
      render(<ExplorerDetailPanel item={givenSkill} />);

      // WHEN the user opens the (skill-specific) links tab
      await clickTab("Occupations linked");

      // THEN expect the section with the count, the occupation label and its code
      expect(screen.getByText(/Occupations requiring this skill · 1/)).toBeInTheDocument();
      expect(screen.getByText("general practitioner")).toBeInTheDocument();
      expect(screen.getByText("2211.1")).toBeInTheDocument();
    });

    test("should render a fallback message when there are no links", async () => {
      // GIVEN a group item, which has no requiresSkills/requiredByOccupations
      render(<ExplorerDetailPanel item={givenGroupItem} />);

      // WHEN the user opens the (group) Links tab
      await clickTab("Links");

      // THEN expect a fallback message
      expect(screen.getByText("No links available for this item.")).toBeInTheDocument();
    });
  });

  describe("Type flag", () => {
    test.each([
      ["occupation (seen economy)", givenOccupationItem, "Seen Economy"],
      ["occupation (unseen economy)", givenLocalOccupationItem, "Unseen Economy"],
      ["skill", givenSkillItem, "Skill/competence"],
      ["group", givenGroupItem, "Group"],
    ])("should render the %s badge", (_desc, item, expectedLabel) => {
      // GIVEN an item of a given type
      // WHEN the panel is rendered
      render(<ExplorerDetailPanel item={item} />);

      // THEN expect the type flag badge to show the expected label
      expect(screen.getByTestId(DATA_TEST_ID.EXPLORER_DETAIL_PANEL_BADGE)).toHaveTextContent(expectedLabel);
    });
  });

  describe("Details tab", () => {
    test("should render the type and code for an occupation", async () => {
      // GIVEN an occupation item
      render(<ExplorerDetailPanel item={givenOccupationItem} />);

      // WHEN the user opens the Details tab
      await clickTab("Details");

      // THEN expect the type and code, and no Children row (occupations are not groups)
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("ESCO occupation")).toBeInTheDocument();
      expect(screen.getByText("Code")).toBeInTheDocument();
      expect(screen.queryByText("Children")).not.toBeInTheDocument();
    });

    test("should render the type, code and children count for a group", async () => {
      // GIVEN an occupation group item with children
      render(<ExplorerDetailPanel item={givenGroupItem} />);

      // WHEN the user opens the Details tab
      await clickTab("Details");

      // THEN expect the group type, code and children count
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Occupation group")).toBeInTheDocument();
      expect(screen.getByText("Children")).toBeInTheDocument();
      expect(screen.getByText(String(givenGroupItem.contains?.length))).toBeInTheDocument();
    });

    test("should render 'Skill' as the type for a skill", async () => {
      // GIVEN a skill item
      render(<ExplorerDetailPanel item={givenSkillItem} />);

      // WHEN the user opens the Details tab
      await clickTab("Details");

      // THEN expect the skill type
      expect(screen.getByText("Type")).toBeInTheDocument();
      expect(screen.getByText("Skill")).toBeInTheDocument();
    });
  });

  describe("History tab", () => {
    test("should show the not-yet-available placeholder (history is not implemented on the frontend)", async () => {
      // GIVEN any item
      render(<ExplorerDetailPanel item={givenGroupItem} />);

      // WHEN the user opens the History tab
      await clickTab("History");

      // THEN expect the placeholder message
      expect(screen.getByText("No history available.")).toBeInTheDocument();
    });
  });
});
