import fs from "node:fs";
import path from "node:path";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { getConnectionManager } from "server/connection/connectionManager";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { IModelInfo } from "modelInfo/modelInfo.types";
import { createLocalizedSkillGroupData, LOCALIZED_IDS, normalizeResponseBody } from "./localizedSkillGroupData";
import {
  acceptLanguageHeaders,
  FALLBACK_LANGUAGE,
  LANGUAGE_NEGOTIATION_CASES,
  SECONDARY_LANGUAGE,
} from "./languageNegotiationCases";

/** The values of the localized skill groups of localizedSkillGroupData.ts, in each language of the model. */
export interface ILocalizedValues {
  skillGroup: string;
  altLabels: string[];
  description: string;
  parent: string;
  childSkillGroup: string;
  childSkill: string;
}

const VALUES_BY_LANGUAGE: Record<string, ILocalizedValues> = {
  [FALLBACK_LANGUAGE.shortCode]: {
    skillGroup: "Management",
    altLabels: ["Leading", "Running"],
    description: "Managing teams",
    parent: "Parent group",
    childSkillGroup: "Child group",
    childSkill: "Child skill",
  },
  [SECONDARY_LANGUAGE.shortCode]: {
    skillGroup: "Gestion",
    // the second altLabel and the description are not translated, they fall back per field
    altLabels: ["Diriger", "Running"],
    description: "Managing teams",
    parent: "Groupe parent",
    childSkillGroup: "Groupe enfant",
    childSkill: "Compétence enfant",
  },
};

/** Picks the translated values out of a skill group as the list and detail endpoints serve it. */
export function localizedValuesOf(skillGroup: SkillGroupAPISpecs.Types.GET.Response.Payload["data"][number]) {
  return {
    preferredLabel: skillGroup.preferredLabel,
    altLabels: skillGroup.altLabels,
    description: skillGroup.description,
    references: [...skillGroup.parents, ...skillGroup.children].map((reference) => reference.preferredLabel),
  };
}

/** The translated values localizedValuesOf() is expected to pick, given the values of the language. */
export function expectedLocalizedValues(values: ILocalizedValues) {
  return {
    preferredLabel: values.skillGroup,
    altLabels: values.altLabels,
    description: values.description,
    references: [values.parent, values.childSkillGroup, values.childSkill],
  };
}

export interface ILanguageNegotiationEndpoint {
  /** The handler of the endpoint. */
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
  /** The sub path of the skill group under test, e.g. "/children", "" for the skill group itself. */
  subPath: string;
  /** The name of the fixture recorded before the endpoint was language aware, e.g. "children". */
  fixture: string;
  /** Picks the translated values the endpoint serves out of its response body. */
  actualValues: (body: never) => unknown;
  /** The translated values the endpoint is expected to serve, given the values of the language. */
  expectedValues: (values: ILocalizedValues) => unknown;
  /** Whether the path addresses the list of the skill groups of the model, rather than a single skill group. */
  isList?: boolean;
}

/**
 * Tests that a skill group read endpoint, backed by a DB, serves its response in the language negotiated through
 * the Accept-Language header, and that a request without the header is served exactly what it was served before
 * the endpoint was language aware.
 *
 * Must be called inside a describe whose beforeAll initializes the DB connection.
 */
export function describeLanguageNegotiation(endpoint: ILanguageNegotiationEndpoint) {
  describe("language negotiation", () => {
    let givenModel: IModelInfo;

    async function cleanUp() {
      const dbConnection = getConnectionManager().getCurrentDBConnection()!;
      await Promise.all(
        [MongooseModelName.SkillGroup, MongooseModelName.Skill, MongooseModelName.SkillHierarchy, "ModelInfo"].map(
          (modelName) => dbConnection.models[modelName].deleteMany({})
        )
      );
    }

    beforeEach(async () => {
      await cleanUp();
      // GIVEN a model in the fallback and a secondary language with a skill group partially translated in it
      givenModel = await createLocalizedSkillGroupData(getConnectionManager().getCurrentDBConnection()!);
    });

    afterEach(cleanUp);

    function givenEvent(acceptLanguage: string | undefined): APIGatewayProxyEvent {
      const id = LOCALIZED_IDS.skillGroup;
      return {
        httpMethod: HTTP_VERBS.GET,
        headers: acceptLanguageHeaders(acceptLanguage),
        path: endpoint.isList
          ? `/models/${givenModel.id}/skillGroups`
          : `/models/${givenModel.id}/skillGroups/${id}${endpoint.subPath}`,
        pathParameters: { modelId: givenModel.id, id },
      } as unknown as APIGatewayProxyEvent;
    }

    test.each(LANGUAGE_NEGOTIATION_CASES)(
      "GET should serve the response in the negotiated language when the request carries %s",
      async (_description, givenAcceptLanguage, expectedLanguage) => {
        // WHEN the endpoint is called with the given Accept-Language header
        const actualResponse = await endpoint.handler(givenEvent(givenAcceptLanguage));

        // THEN expect the response to be served in the expected language
        expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
        expect(actualResponse.headers).toMatchObject({
          "Content-Language": expectedLanguage.shortCode,
          Vary: "Accept-Language",
        });
        // AND its translated values, nested references included, to be in that language, falling back per field
        expect(endpoint.actualValues(JSON.parse(actualResponse.body) as never)).toEqual(
          endpoint.expectedValues(VALUES_BY_LANGUAGE[expectedLanguage.shortCode])
        );
      }
    );

    test("GET should respond to a request without an Accept-Language header byte for byte as before", async () => {
      // GIVEN the response recorded before the endpoint was language aware
      // re-serialized compactly, as prettier formats the fixture, while keeping its key order and values
      const expectedBody = JSON.stringify(
        JSON.parse(
          fs.readFileSync(path.join(__dirname, "__fixtures__", `${endpoint.fixture}.noAcceptLanguage.json`), "utf8")
        )
      );

      // WHEN the endpoint is called without an Accept-Language header
      const actualResponse = await endpoint.handler(givenEvent(undefined));

      // THEN expect the very same body
      expect(normalizeResponseBody(actualResponse.body, givenModel)).toEqual(expectedBody);
    });
  });
}
