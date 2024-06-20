import "_test_utilities/consoleMock";

import { processMeasures } from "./measures";
import ImportAPISpecs from "api-specifications/import";
import { getMockStringId } from "_test_utilities/mockMongoId";
import * as degreeCentralityModule from "import/async/measures/degreeCentrallity";

describe("Interesting Measures", () => {
  describe("processMeasures", () => {
    test("should call calculateSkillDegreeCentrality on call", async () => {
      const calculateSkillDegreeCentralityFn = jest
        .spyOn(degreeCentralityModule, "calculateSkillDegreeCentrality")
        .mockResolvedValue(undefined);

      // GIVEN: A random modelId
      const givenModelId = getMockStringId(1);

      // AND An event with the modelId
      const givenEvent: ImportAPISpecs.Types.POST.Request.Payload = {
        modelId: givenModelId,
        isOriginalESCOModel: false,
      } as ImportAPISpecs.Types.POST.Request.Payload;

      // WHEN: processMeasures is called
      await processMeasures(givenEvent);

      // THEN calculateSkillDegreeCentrality should be called with the same given event
      expect(calculateSkillDegreeCentralityFn).toHaveBeenCalledWith(givenEvent);
    });

    test("should throw an error if calculateSkillDegreeCentrality throws an error", async () => {
      // GIVEN: A random modelId
      const givenModelId = getMockStringId(1);

      // AND an error to be thrown
      const givenError = new Error(`Error in calculateSkillDegreeCentrality for modelId: ${givenModelId}`);

      // AND calculateSkillDegreeCentrality throws an error
      jest.spyOn(degreeCentralityModule, "calculateSkillDegreeCentrality").mockRejectedValue(givenError);

      const givenEvent: ImportAPISpecs.Types.POST.Request.Payload = {
        modelId: givenModelId,
        isOriginalESCOModel: false,
      } as ImportAPISpecs.Types.POST.Request.Payload;

      // WHEN: processMeasures is called
      const processMeasuresPromise = () => processMeasures(givenEvent);

      // THEN: processMeasures should throw the same given error
      await expect(processMeasuresPromise).rejects.toThrowError(givenError.message);

      // AND: the error should be logged for debugging
      expect(console.error).toHaveBeenCalledWith(givenError);
    });
  });
});
