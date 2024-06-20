// Mute chatty console logs
import "_test_utilities/consoleMock";

import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { Readable } from "node:stream";
import occupationToSkillRelationToCSVTransform, * as occupationToSkillRelationToCSVTransformModule from "./occupationToSkillRelationToCSVTransform";
import * as parsersModule from "esco/common/csvObjectTypes";
import { IUnpopulatedOccupationToSkillRelation } from "./occupationToSkillRelationToCSVTransform";
import { IOccupationToSkillRelationRepository } from "esco/occupationToSkillRelation/occupationToSkillRelationRepository";
import { parse } from "csv-parse/sync";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";

const OccupationToSkillRelationRepositorySpy = jest.spyOn(getRepositoryRegistry(), "occupationToSkillRelation", "get");

const getMockOccupationToSkillRelations = (): IUnpopulatedOccupationToSkillRelation[] => {
  function getOccupationType(i: number) {
    switch (i % 2) {
      case 0:
        return ObjectTypes.ESCOOccupation;
      case 1:
        return ObjectTypes.LocalOccupation;
      default:
        throw new Error("Invalid number");
    }
  }

  function getSignallingValueLabel(i: number) {
    switch (i % 3) {
      case 0:
      case 1:
        return SignallingValueLabel.NONE;
      case 2:
        return SignallingValueLabel.HIGH;
      default:
        throw new Error("Invalid number");
    }
  }

  function getRelationType(i: number) {
    switch (i % 3) {
      case 0:
        return OccupationToSkillRelationType.ESSENTIAL;
      case 1:
        return OccupationToSkillRelationType.OPTIONAL;
      case 2:
        return OccupationToSkillRelationType.NONE;
      default:
        throw new Error("Invalid number");
    }
  }

  return Array.from({ length: 6 }, (_, i) => ({
    id: getMockStringId(i * 3),
    modelId: getMockStringId(1),
    requiringOccupationId: getMockStringId(i * 3 + 1),
    requiredSkillId: getMockStringId(i * 3 + 2),
    requiringOccupationType: getOccupationType(i),
    relationType: getRelationType(i),
    signallingValueLabel: getSignallingValueLabel(i),
    signallingValue: i / 10,
    createdAt: new Date(i), // use a fixed date to make the snapshot stable
    updatedAt: new Date(i), // use a fixed date to make the snapshot stable
  }));
};

function setupOccupationToSkillRelationRepositoryMock(findAllImpl: () => Readable) {
  const mockOccupationToSkillRelationRepository: IOccupationToSkillRelationRepository = {
    relationModel: undefined as never,
    occupationModel: undefined as never,
    skillModel: undefined as never,
    groupBySkillId: undefined as never,
    createMany: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockImplementationOnce(findAllImpl),
  };
  OccupationToSkillRelationRepositorySpy.mockReturnValue(mockOccupationToSkillRelationRepository);
}

const getTransformCall = (givenRelation: IUnpopulatedOccupationToSkillRelation) => () =>
  occupationToSkillRelationToCSVTransformModule.transformOccupationToSkillRelationSpecToCSVRow(givenRelation);

describe("occupationToSkillRelationToCSVTransform", () => {
  test("should correctly transform occupationToSkillRelation data to CSV", async () => {
    // GIVEN findAll returns a stream of occupationToSkillRelations
    const givenRelations = getMockOccupationToSkillRelations();
    setupOccupationToSkillRelationRepositoryMock(() => Readable.from(givenRelations));

    // WHEN the transformation is applied
    const transformedStream = occupationToSkillRelationToCSVTransform("foo");

    // THEN expect the output to be a valid CSV
    const chunks = [];
    for await (const chunk of transformedStream) {
      chunks.push(chunk);
    }
    const actualCSVOutput = chunks.join("");
    const parsedObjects = parse(actualCSVOutput, { columns: true });
    // AND contain the given occupationToSkillRelation data
    expect(parsedObjects).toMatchSnapshot();
    expect(actualCSVOutput).toMatchSnapshot();
    // AND the stream should end
    expect(transformedStream.closed).toBe(true);
  });

  describe("handle errors during stream processing", () => {
    describe("test transformOccupationToSkillRelationSpecToCSVRow()", () => {
      test("should transform a OccupationToSkillRelation to a CSV row", () => {
        // GIVEN a valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[0];
        // WHEN the OccupationToSkillRelation is transformed
        const actualRow =
          occupationToSkillRelationToCSVTransformModule.transformOccupationToSkillRelationSpecToCSVRow(givenRelation);
        // THEN the CSV row should be correct
        expect(actualRow).toMatchSnapshot();
      });

      test("should throw an error when the requiringOccupationType is unknown", async () => {
        // GIVEN an otherwise valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[0];
        // WITH an unknown requiringOccupationType
        givenRelation.requiringOccupationType = "foo" as ObjectTypes.LocalOccupation | ObjectTypes.ESCOOccupation;
        // WHEN the OccupationToSkillRelation is transformed
        const transformCall = getTransformCall(givenRelation);
        // THEN the transformation should throw an error
        expect(transformCall).toThrowError(
          `Failed to transform OccupationToSkillRelation to CSV row: Invalid requiringOccupationType: ${givenRelation.requiringOccupationType}`
        );
      });

      test("should throw an error when the relationType is unknown", async () => {
        // GIVEN an otherwise valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[0];
        // WITH an unknown relationType
        givenRelation.relationType = "foo" as OccupationToSkillRelationType;
        // WHEN the OccupationToSkillRelation is transformed
        const transformCall = getTransformCall(givenRelation);
        // THEN the transformation should throw an error
        expect(transformCall).toThrowError(
          `Failed to transform OccupationToSkillRelation to CSV row: Invalid relationType: ${givenRelation.relationType}`
        );
      });

      test("should throw an error when the signalling value label is unknown", async () => {
        // GIVEN an otherwise valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[0];
        // WITH an unknown signalling value label
        givenRelation.signallingValueLabel = "foo" as SignallingValueLabel;
        // WHEN the OccupationToSkillRelation is transformed
        const transformCall = getTransformCall(givenRelation);
        // THEN the transformation should throw an error
        expect(transformCall).toThrowError(
          `Failed to transform OccupationToSkillRelation to CSV row: Invalid signallingValueLabel: ${givenRelation.signallingValueLabel}`
        );
      });

      test("should throw an error if both relationType and signallingValueLabel are set", async () => {
        // GIVEN an otherwise valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[0];

        // WITH both relationType and signallingValueLabel set
        givenRelation.relationType = OccupationToSkillRelationType.ESSENTIAL;
        givenRelation.signallingValueLabel = SignallingValueLabel.MEDIUM;

        // WHEN the OccupationToSkillRelation is transformed
        const transformCall = getTransformCall(givenRelation);

        // THEN the transformation should throw an error
        expect(transformCall).toThrowError(
          `Failed to transform OccupationToSkillRelation to CSV row: We can't have both : ${givenRelation.relationType} or signallingValueLabel: ${givenRelation.signallingValueLabel}`
        );
      });

      test("should throw an error if none of relationType and signallingValue label are set", async () => {
        // GIVEN an otherwise valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[0];

        // WITH both relationType and signallingValueLabel set
        givenRelation.relationType = OccupationToSkillRelationType.NONE;
        givenRelation.signallingValueLabel = SignallingValueLabel.NONE;

        // WHEN the OccupationToSkillRelation is transformed
        const transformCall = getTransformCall(givenRelation);

        // THEN the transformation should throw an error
        expect(transformCall).toThrowError(
          `Failed to transform OccupationToSkillRelation to CSV row: Invalid relationType: ${givenRelation.relationType} or signallingValueLabel: ${givenRelation.signallingValueLabel}`
        );
      });

      test("should use the correct signalling value", async () => {
        const transformSignallingValue = jest.spyOn(parsersModule, "getCSVSignalingValueFromSignallingValue");

        // GIVEN an otherwise valid OccupationToSkillRelation
        const givenRelation = getMockOccupationToSkillRelations()[2];

        // WITH an unknown signalling value label
        givenRelation.signallingValue = 0.2;

        // WHEN the OccupationToSkillRelation is transformed
        const transformCall = getTransformCall(givenRelation);
        // AND transform called
        transformCall();

        // THEN the transformation should use the correct signalling value
        expect(transformSignallingValue).toHaveBeenCalledWith(givenRelation.signallingValue);
      });
    });

    test("should log an error and end the stream when the source repository fails", async () => {
      // GIVEN that the source occupationToSkillRelation stream will emit an error
      const givenError = new Error("Test Error");
      setupOccupationToSkillRelationRepositoryMock(
        () =>
          new Readable({
            read() {
              this.emit("error", givenError);
            },
          })
      );

      // WHEN the transformation stream is consumed
      const transformedStream = occupationToSkillRelationToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError(givenError);
      // AND the error should be logged
      const expectedErrorMessage = "Transforming occupationToSkillRelation to CSV failed";
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause(expectedErrorMessage, givenError.message)
      );
      // AND the stream should end
      expect(transformedStream.closed).toBe(true);
    });

    test("should log an error and end the stream when the CSV stringifier fails", async () => {
      // GIVEN findAll returns a stream of occupationToSkillRelations
      setupOccupationToSkillRelationRepositoryMock(() => Readable.from(getMockOccupationToSkillRelations()));

      // AND  the transformOccupationToSkillRelationSpecToCSVRow will throw an error
      const givenError = new Error("Mocked Transformation Error");
      const transformFunctionSpy = jest
        .spyOn(occupationToSkillRelationToCSVTransformModule, "transformOccupationToSkillRelationSpecToCSVRow")
        .mockImplementationOnce(() => {
          throw givenError;
        });

      // WHEN the transformation stream is consumed
      const transformedStream = occupationToSkillRelationToCSVTransform("foo");

      // THEN expect the given error to be thrown
      await expect(async () => {
        //  iterate to consume the stream
        for await (const _ of transformedStream) {
          // do nothing
        }
      }).rejects.toThrowError("Failed to transform occupationToSkillRelation to CSV row");
      // AND the error to be logged
      const expectedLoggedItem = JSON.stringify(transformFunctionSpy.mock.calls[0][0], null, 2);
      const expectErrorMessage = `Failed to transform occupationToSkillRelation to CSV row: ${expectedLoggedItem}`;
      const expectedError = new Error(expectErrorMessage, { cause: givenError });

      expect(console.error).toHaveBeenCalledWith(expect.toMatchErrorWithCause(expectErrorMessage, givenError.message));
      expect(console.error).toHaveBeenCalledWith(
        expect.toMatchErrorWithCause("Transforming occupationToSkillRelation to CSV failed", expectedError.message)
      );
      // AND the stream to end
      expect(transformedStream.closed).toBe(true);
    });
  });
});
