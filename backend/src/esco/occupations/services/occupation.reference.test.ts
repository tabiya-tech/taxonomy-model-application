import { getOccupationReferenceWithRelationType } from "./occupation.reference";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SignallingValueLabel } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { randomUUID } from "node:crypto";
import { ObjectTypes } from "esco/common/objectTypes";
import { IOccupationReference } from "../_shared/occupationReference.types";

describe("Occupation Reference Coverage", () => {
  test("getOccupationReferenceWithRelationType should use default values for optional parameters", () => {
    const givenOccupation: IOccupationReference = {
      id: getMockStringId(1),
      UUID: randomUUID(),
      code: "1234",
      preferredLabel: "Occupation",
      occupationGroupCode: "123",
      occupationType: ObjectTypes.ESCOOccupation,
      isLocalized: false,
    };
    const result = getOccupationReferenceWithRelationType(givenOccupation, OccupationToSkillRelationType.ESSENTIAL);

    expect(result.signallingValue).toBeNull();
    expect(result.signallingValueLabel).toBe(SignallingValueLabel.NONE);
  });
});
