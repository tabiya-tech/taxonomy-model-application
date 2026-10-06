// mute the console output
import "src/_test_utilities/consoleMock";

import ExplorerService, { PAGE_LIMIT } from "./explorer.service";
import { ObjectType } from "src/explorer/explorer.types";
import { ExplorerTreeItem } from "src/explorer/components/ExplorerTreePanel/ExplorerTreePanel";
import * as MockPayload from "./_test_utilities/mockExplorerPayload";
import { StatusCodes } from "http-status-codes";
import { ServiceError } from "src/error/error";
import { ErrorCodes } from "src/error/errorCodes";
import { setupAPIServiceSpy } from "src/_test_utilities/fetchSpy";
import LanguageAPISpecs from "api-specifications/language";

const getMockExplorerTreeItem = (overrides: Partial<ExplorerTreeItem> = {}): ExplorerTreeItem => ({
  id: "grp-1",
  code: "1",
  title: "Managers",
  objectType: ObjectType.ISCOGroup,
  hasChildren: true,
  ...overrides,
});

describe("ExplorerService", () => {
  let givenApiServerUrl: string;
  let givenModelId: string;
  let givenLanguage: LanguageAPISpecs.Types.LanguageShortCode;

  beforeEach(() => {
    givenApiServerUrl = "/path/to/api";
    givenModelId = "model-1";
    // A language other than the fall back one, so that a request that ignores the given language fails the assertions.
    givenLanguage = "fr";
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should construct the service successfully", () => {
    // GIVEN an api server url
    // WHEN the service is constructed
    const service = new ExplorerService(givenApiServerUrl);

    // THEN expect the service to be constructed successfully
    expect(service).toBeDefined();
    expect(service.apiServerUrl).toEqual(givenApiServerUrl);
  });

  describe("getRootItems", () => {
    test("should fetch root occupation groups with the root=true filter and map groupType to objectType", async () => {
      // GIVEN the occupationGroups endpoint returns two root groups: one ISCOGroup, one LocalGroup,
      // one of them with an embedded child occupation
      const givenGroups = [
        MockPayload.getMockOccupationGroupNode({
          id: "grp-0",
          code: "0",
          preferredLabel: "Armed forces occupations",
          groupType: ObjectType.ISCOGroup,
          children: [MockPayload.getMockChildRef({ id: "occ-1", code: "01", objectType: ObjectType.ESCOOccupation })],
        }),
        MockPayload.getMockOccupationGroupNode({
          id: "grp-1",
          code: "1",
          preferredLabel: "Managers",
          groupType: ObjectType.LocalGroup,
        }),
      ];
      const apiServiceSpy = setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse(givenGroups),
        "application/json;charset=UTF-8"
      );

      // WHEN getRootItems is called for the occupations tab
      const service = new ExplorerService(givenApiServerUrl);
      const actualItems = await service.getRootItems(givenModelId, "occupations", givenLanguage);

      // THEN expect it to call the occupationGroups endpoint with root=true
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/occupationGroups?root=true&limit=${PAGE_LIMIT}`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );

      // AND expect each root item's objectType to be derived from its own groupType field
      expect(actualItems).toEqual([
        {
          id: "grp-0",
          code: "0",
          title: "Armed forces occupations",
          objectType: ObjectType.ISCOGroup,
          hasChildren: true,
          children: [
            {
              id: "occ-1",
              code: "01",
              title: "Business services managers",
              objectType: ObjectType.ESCOOccupation,
              hasChildren: false,
              children: undefined,
            },
          ],
        },
        {
          id: "grp-1",
          code: "1",
          title: "Managers",
          objectType: ObjectType.LocalGroup,
          hasChildren: true,
          children: [],
        },
      ]);
    });

    test("should fall back to ISCOGroup when an occupation group is missing its groupType", async () => {
      // GIVEN a root occupation group with no groupType field
      const givenGroup = MockPayload.getMockOccupationGroupNode({ groupType: undefined });
      setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse([givenGroup]),
        "application/json;charset=UTF-8"
      );

      // WHEN getRootItems is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualItems = await service.getRootItems(givenModelId, "occupations", givenLanguage);

      // THEN expect the item's objectType to default to ISCOGroup
      expect(actualItems[0].objectType).toEqual(ObjectType.ISCOGroup);
    });

    test("should fetch root skill groups and mark them all as SkillGroup, since skill groups don't self-report a type", async () => {
      // GIVEN the skillGroups endpoint returns a root group (no type field at all on itself)
      const givenGroup = MockPayload.getMockSkillGroupNode();
      const apiServiceSpy = setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse([givenGroup]),
        "application/json;charset=UTF-8"
      );

      // WHEN getRootItems is called for the skills tab
      const service = new ExplorerService(givenApiServerUrl);
      const actualItems = await service.getRootItems(givenModelId, "skills", givenLanguage);

      // THEN expect it to call the skillGroups endpoint with root=true
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/skillGroups?root=true&limit=${PAGE_LIMIT}`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the item to be typed as a SkillGroup
      expect(actualItems[0].objectType).toEqual(ObjectType.SkillGroup);
    });

    test("on fail to fetch, should reject with the error thrown by fetchWithAuth", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockRejectedValueOnce(givenFetchError);

      // WHEN calling getRootItems
      const service = new ExplorerService(givenApiServerUrl);

      // THEN expect it to reject with the same error
      await expect(service.getRootItems(givenModelId, "occupations", givenLanguage)).rejects.toMatchObject(
        givenFetchError
      );
    });

    test("on 200 with a malformed json response, should reject with INVALID_RESPONSE_BODY", async () => {
      // GIVEN the endpoint responds with a malformed json body
      setupAPIServiceSpy(StatusCodes.OK, "{", "application/json;charset=UTF-8");

      // WHEN calling getRootItems
      const service = new ExplorerService(givenApiServerUrl);

      // THEN expect it to reject with a ServiceError with INVALID_RESPONSE_BODY
      const expectedUrl = `${givenApiServerUrl}/models/${givenModelId}/occupationGroups?root=true&limit=${PAGE_LIMIT}`;
      const expectedError = {
        ...new ServiceError(
          "ExplorerService",
          "getRootItems",
          "GET",
          expectedUrl,
          StatusCodes.OK,
          ErrorCodes.INVALID_RESPONSE_BODY,
          "",
          ""
        ),
        message: expect.any(String),
        details: expect.anything(),
      };
      await expect(service.getRootItems(givenModelId, "occupations", givenLanguage)).rejects.toMatchObject(
        expectedError
      );
    });
  });

  describe("getChildren", () => {
    test.each([
      [ObjectType.ISCOGroup, "occupationGroups"],
      [ObjectType.LocalGroup, "occupationGroups"],
      [ObjectType.SkillGroup, "skillGroups"],
      [ObjectType.ESCOOccupation, "occupations"],
      [ObjectType.LocalOccupation, "occupations"],
      [ObjectType.Skill, "skills"],
    ])("should fetch children of a %s item from the %s collection", async (givenObjectType, expectedCollection) => {
      // GIVEN a tree item of the given objectType
      const givenItem = getMockExplorerTreeItem({ id: "item-1", objectType: givenObjectType });
      // AND the children endpoint returns one child ref
      const givenChild = MockPayload.getMockChildRef({ id: "child-1" });
      const apiServiceSpy = setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse([givenChild]),
        "application/json;charset=UTF-8"
      );

      // WHEN getChildren is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualChildren = await service.getChildren(givenModelId, givenItem, givenLanguage);

      // THEN expect it to call the correct collection's children endpoint
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/${expectedCollection}/item-1/children?limit=${PAGE_LIMIT}`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the child ref to be mapped using its own objectType
      expect(actualChildren).toEqual([
        {
          id: "child-1",
          code: "1120",
          title: "Business services managers",
          objectType: ObjectType.ESCOOccupation,
          hasChildren: false,
          children: undefined,
        },
      ]);
    });

    test("should fetch every page of children, each in the given language, and join them", async () => {
      // GIVEN the children endpoint returns a first page with a cursor to a second, last page
      const givenFirstChild = MockPayload.getMockChildRef({ id: "child-1" });
      const givenSecondChild = MockPayload.getMockChildRef({ id: "child-2" });
      const givenCursor = "cursor-1";
      const toResponse = (body: object) =>
        new Response(JSON.stringify(body), {
          status: StatusCodes.OK,
          headers: { "Content-Type": "application/json;charset=UTF-8" },
        });
      const apiServiceSpy = jest
        .spyOn(require("src/apiService/APIService"), "fetchWithAuth")
        .mockResolvedValueOnce(
          toResponse(MockPayload.getMockPaginatedResponse([givenFirstChild], PAGE_LIMIT, givenCursor))
        )
        .mockResolvedValueOnce(toResponse(MockPayload.getMockPaginatedResponse([givenSecondChild], PAGE_LIMIT, null)));
      const givenItem = getMockExplorerTreeItem({ id: "item-1", objectType: ObjectType.ISCOGroup });

      // WHEN getChildren is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualChildren = await service.getChildren(givenModelId, givenItem, givenLanguage);

      // THEN expect both pages to have been requested, the second one with the cursor of the first
      const expectedUrl = `${givenApiServerUrl}/models/${givenModelId}/occupationGroups/item-1/children?limit=${PAGE_LIMIT}`;
      expect(apiServiceSpy).toHaveBeenCalledTimes(2);
      expect(apiServiceSpy).toHaveBeenNthCalledWith(
        1,
        expectedUrl,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the second page to carry the given language as well
      expect(apiServiceSpy).toHaveBeenNthCalledWith(
        2,
        `${expectedUrl}&cursor=${givenCursor}`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the children of both pages to be returned, in order
      expect(actualChildren.map((child) => child.id)).toEqual(["child-1", "child-2"]);
    });

    test("should mark a child as having children when it is itself a group, even if its children array is empty", async () => {
      // GIVEN the children endpoint returns a subgroup with no embedded children of its own
      const givenChild = MockPayload.getMockChildRef({
        id: "grp-11",
        objectType: ObjectType.ISCOGroup,
      });
      setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse([givenChild]),
        "application/json;charset=UTF-8"
      );

      // WHEN getChildren is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualChildren = await service.getChildren(givenModelId, getMockExplorerTreeItem(), givenLanguage);

      // THEN expect the subgroup to still be marked as expandable
      expect(actualChildren[0].hasChildren).toBe(true);
    });
  });

  describe("searchSkills", () => {
    test("should call the skills endpoint with the query and default searchFields, and map results to leaf tree items", async () => {
      // GIVEN the skills endpoint returns a matching skill
      const givenSkill = MockPayload.getMockSkillNode({ id: "skill-1", preferredLabel: "manage business operations" });
      const apiServiceSpy = setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse([givenSkill]),
        "application/json;charset=UTF-8"
      );

      // WHEN searchSkills is called with a search value
      const service = new ExplorerService(givenApiServerUrl);
      const actualItems = await service.searchSkills(givenModelId, "manage business", givenLanguage);

      // THEN expect it to call the skills endpoint with the query and searchFields params
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/skills?query=manage%20business` +
          `&searchFields=preferredLabel%2CaltLabels%2Cdescription&limit=${PAGE_LIMIT}`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the matched skill to be mapped to a leaf tree item typed as a Skill
      expect(actualItems).toEqual([
        {
          id: "skill-1",
          code: "",
          title: "manage business operations",
          objectType: ObjectType.Skill,
          hasChildren: false,
        },
      ]);
    });

    test("on fail to fetch, should reject with the error thrown by fetchWithAuth", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockRejectedValueOnce(givenFetchError);

      // WHEN calling searchSkills
      const service = new ExplorerService(givenApiServerUrl);

      // THEN expect it to reject with the same error
      await expect(service.searchSkills(givenModelId, "foo", givenLanguage)).rejects.toMatchObject(givenFetchError);
    });
  });

  describe("searchOccupations", () => {
    test("should call the occupations endpoint with the query and default searchFields, and map results to leaf tree items", async () => {
      // GIVEN the occupations endpoint returns a matching ESCO and a matching local occupation
      const givenEscoOccupation = MockPayload.getMockOccupationNode({
        id: "occ-1",
        preferredLabel: "business services manager",
        occupationType: ObjectType.ESCOOccupation,
      });
      const givenLocalOccupation = MockPayload.getMockOccupationNode({
        id: "occ-2",
        code: "",
        preferredLabel: "community business manager",
        occupationType: ObjectType.LocalOccupation,
      });
      const apiServiceSpy = setupAPIServiceSpy(
        StatusCodes.OK,
        MockPayload.getMockPaginatedResponse([givenEscoOccupation, givenLocalOccupation]),
        "application/json;charset=UTF-8"
      );

      // WHEN searchOccupations is called with a search value
      const service = new ExplorerService(givenApiServerUrl);
      const actualItems = await service.searchOccupations(givenModelId, "business manager", givenLanguage);

      // THEN expect it to call the occupations endpoint with the query and searchFields params
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/occupations?query=business%20manager` +
          `&searchFields=preferredLabel%2CaltLabels%2Cdescription&limit=${PAGE_LIMIT}`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect each matched occupation to be mapped to a leaf tree item typed by its occupation type
      expect(actualItems).toEqual([
        {
          id: "occ-1",
          code: "1120",
          title: "business services manager",
          objectType: ObjectType.ESCOOccupation,
          hasChildren: false,
        },
        {
          id: "occ-2",
          code: "",
          title: "community business manager",
          objectType: ObjectType.LocalOccupation,
          hasChildren: false,
        },
      ]);
    });

    test("on fail to fetch, should reject with the error thrown by fetchWithAuth", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockRejectedValueOnce(givenFetchError);

      // WHEN calling searchOccupations
      const service = new ExplorerService(givenApiServerUrl);

      // THEN expect it to reject with the same error
      await expect(service.searchOccupations(givenModelId, "foo", givenLanguage)).rejects.toMatchObject(
        givenFetchError
      );
    });
  });

  describe("getItemDetail", () => {
    test("should fetch an occupation's detail from the occupations collection and use the tree item's objectType", async () => {
      // GIVEN a tree item for an occupation
      const givenItem = getMockExplorerTreeItem({
        id: "occ-1120",
        objectType: ObjectType.ESCOOccupation,
      });
      // AND the occupation detail endpoint returns a full record, without an "objectType" field of its own
      const givenDetail = MockPayload.getMockOccupationDetail({ id: "occ-1120" });
      const apiServiceSpy = setupAPIServiceSpy(StatusCodes.OK, givenDetail, "application/json;charset=UTF-8");

      // WHEN getItemDetail is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualDetail = await service.getItemDetail(givenModelId, givenItem, givenLanguage);

      // THEN expect it to call the occupation detail endpoint
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/occupations/occ-1120`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the objectType to come from the tree item, not the (absent) response field
      expect(actualDetail.objectType).toEqual(ObjectType.ESCOOccupation);
      // AND expect the rest of the fields to be passed through
      expect(actualDetail).toMatchObject({
        id: "occ-1120",
        UUID: "occ-1120-uuid",
        definition: givenDetail.definition,
        code: "1120",
        occupationType: ObjectType.ESCOOccupation,
        occupationGroupCode: "112",
        requiresSkills: givenDetail.requiresSkills,
      });
    });

    test("should fetch a skill group's detail from the skillGroups collection and use the tree item's objectType", async () => {
      // GIVEN a tree item for a skill group
      const givenItem = getMockExplorerTreeItem({ id: "grp-s1", objectType: ObjectType.SkillGroup });
      // AND the skillGroups detail endpoint returns a record with no self-describing type field
      const givenDetail = MockPayload.getMockSkillGroupNode({ id: "grp-s1" });
      setupAPIServiceSpy(StatusCodes.OK, givenDetail, "application/json;charset=UTF-8");

      // WHEN getItemDetail is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualDetail = await service.getItemDetail(givenModelId, givenItem, givenLanguage);

      // THEN expect the objectType to come from the tree item
      expect(actualDetail.objectType).toEqual(ObjectType.SkillGroup);
      expect(actualDetail.code).toEqual("S1");
    });

    test("should fall back to the description field when a definition is not present", async () => {
      // GIVEN an occupation group's detail response, which has no "definition" field, only "description"
      const givenItem = getMockExplorerTreeItem();
      const givenDetail = MockPayload.getMockOccupationGroupNode({ description: "A group description." });
      setupAPIServiceSpy(StatusCodes.OK, givenDetail, "application/json;charset=UTF-8");

      // WHEN getItemDetail is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualDetail = await service.getItemDetail(givenModelId, givenItem, givenLanguage);

      // THEN expect the definition to fall back to the description
      expect(actualDetail.definition).toEqual("A group description.");
    });

    test("on fail to fetch, should reject with the error thrown by fetchWithAuth", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockRejectedValueOnce(givenFetchError);

      // WHEN calling getItemDetail
      const service = new ExplorerService(givenApiServerUrl);

      // THEN expect it to reject with the same error
      await expect(service.getItemDetail(givenModelId, getMockExplorerTreeItem(), givenLanguage)).rejects.toMatchObject(
        givenFetchError
      );
    });
  });

  describe("getItemHistory", () => {
    const givenModelReference = {
      id: "model-2",
      UUID: "model-2-uuid",
      name: "ESCO",
      version: "v1.0.1.1",
      localeShortCode: "en",
    };

    test("should fetch the history from the item's collection and return the model and preferred label of each entry", async () => {
      // GIVEN a skill tree item
      const givenItem = getMockExplorerTreeItem({ id: "skill-1", objectType: ObjectType.Skill });
      // AND the history endpoint returns items with the entity reference flat plus a nested model
      const givenHistoryPayload = [
        { id: "skill-1", UUID: "skill-1-uuid", preferredLabel: "a skill", model: givenModelReference },
        {
          id: "skill-1",
          UUID: "skill-1-uuid-old",
          preferredLabel: "an older label for the skill",
          model: { ...givenModelReference, id: null, name: null, version: null },
        },
      ];
      const apiServiceSpy = setupAPIServiceSpy(StatusCodes.OK, givenHistoryPayload, "application/json;charset=UTF-8");

      // WHEN getItemHistory is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualHistory = await service.getItemHistory(givenModelId, givenItem, givenLanguage);

      // THEN expect it to call the skills history endpoint
      expect(apiServiceSpy).toHaveBeenCalledWith(
        `${givenApiServerUrl}/models/${givenModelId}/skills/skill-1/history`,
        expect.objectContaining({ method: "GET", headers: { "Accept-Language": givenLanguage } })
      );
      // AND expect the id, model and preferred label of each entry to be returned, in order
      expect(actualHistory).toEqual([
        { id: "skill-1", model: givenModelReference, preferredLabel: "a skill" },
        { id: "skill-1", model: givenHistoryPayload[1].model, preferredLabel: "an older label for the skill" },
      ]);
    });

    test("should return an empty array when the item has no history", async () => {
      // GIVEN the history endpoint returns an empty array
      setupAPIServiceSpy(StatusCodes.OK, [], "application/json;charset=UTF-8");

      // WHEN getItemHistory is called
      const service = new ExplorerService(givenApiServerUrl);
      const actualHistory = await service.getItemHistory(givenModelId, getMockExplorerTreeItem(), givenLanguage);

      // THEN expect an empty array
      expect(actualHistory).toEqual([]);
    });

    test("on fail to fetch, should reject with the error thrown by fetchWithAuth", async () => {
      // GIVEN fetch rejects with some unknown error
      const givenFetchError = new Error();
      jest.spyOn(require("src/apiService/APIService"), "fetchWithAuth").mockRejectedValueOnce(givenFetchError);

      // WHEN calling getItemHistory THEN expect it to reject with the same error
      const service = new ExplorerService(givenApiServerUrl);
      await expect(
        service.getItemHistory(givenModelId, getMockExplorerTreeItem(), givenLanguage)
      ).rejects.toMatchObject(givenFetchError);
    });
  });
});
