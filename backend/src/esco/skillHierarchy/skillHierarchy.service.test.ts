import { SkillHierarchyService } from "./skillHierarchy.service";
import { ParentForSkillValidationErrorCode, SkillParentValidationError } from "./skillHierarchy.service.types";
import { ObjectTypes } from "esco/common/objectTypes";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ISkill } from "esco/skill/_shared/skill.types";
import { ISkillGroup } from "esco/skillGroup/_shared/skillGroup.types";
import { getISkillMockData } from "esco/skill/_shared/testDataHelper";
import { getISkillGroupMockData } from "esco/skillGroup/_shared/testDataHelper";
import { INewSkillHierarchyPairSpec, ISkillHierarchyPair } from "./skillHierarchy.types";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { ISkillRepository } from "esco/skill/repository/skill.repository";
import { ISkillGroupRepository } from "esco/skillGroup/repository/SkillGroup.repository";
import { ISkillHierarchyRepository } from "./skillHierarchyRepository";

type MockSkillRepository = jest.Mocked<Pick<ISkillRepository, "findById">>;
type MockSkillGroupRepository = jest.Mocked<Pick<ISkillGroupRepository, "findById">>;
type MockSkillHierarchyRepository = jest.Mocked<Pick<ISkillHierarchyRepository, "createMany">>;

describe("SkillHierarchyService", () => {
  let skillHierarchyService: SkillHierarchyService;
  let mockSkillRepository: MockSkillRepository;
  let mockSkillGroupRepository: MockSkillGroupRepository;
  let mockSkillHierarchyRepository: MockSkillHierarchyRepository;

  beforeEach(() => {
    mockSkillRepository = {
      findById: jest.fn(),
    };
    mockSkillGroupRepository = {
      findById: jest.fn(),
    };
    mockSkillHierarchyRepository = {
      createMany: jest.fn(),
    };

    skillHierarchyService = new SkillHierarchyService(
      mockSkillRepository as unknown as ISkillRepository,
      mockSkillGroupRepository as unknown as ISkillGroupRepository,
      mockSkillHierarchyRepository as unknown as ISkillHierarchyRepository
    );
  });

  describe("setParent", () => {
    test("should successfully set a Skill parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid skill exists to be the child
      const childId = getMockStringId(2);
      // AND a valid skill exists to be the parent
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database can retrieve both child and parent successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database will successfully create the relationship
      mockSkillHierarchyRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(10),
          modelId,
          childId: mockChild.id,
          parentId: mockParent.id,
          childType: ObjectTypes.Skill,
          parentType: ObjectTypes.Skill,
          childDocModel: MongooseModelName.Skill,
          parentDocModel: MongooseModelName.Skill,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillHierarchyPair,
      ]);

      // WHEN an attempt is made to set the parent skill for the child skill
      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect the newly populated parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to save the relationship
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.Skill,
          childId,
          childType: ObjectTypes.Skill,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    test("should successfully set a SkillGroup parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid skill exists to be the child
      const childId = getMockStringId(2);
      // AND a valid skill group exists to be the parent
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillGroupMockData(2) as ISkillGroup;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database can retrieve both successfully
      mockSkillRepository.findById.mockResolvedValue(mockChild);
      mockSkillGroupRepository.findById.mockResolvedValue(mockParent);

      // AND the hierarchy database will successfully create the relationship
      mockSkillHierarchyRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(11),
          modelId,
          childId: mockChild.id,
          parentId: mockParent.id,
          childType: ObjectTypes.Skill,
          parentType: ObjectTypes.SkillGroup,
          childDocModel: MongooseModelName.Skill,
          parentDocModel: MongooseModelName.SkillGroup,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillHierarchyPair,
      ]);

      // WHEN an attempt is made to set the parent skill group for the child skill
      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.SkillGroup
      );

      // THEN expect the newly populated parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to save the relationship
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.SkillGroup,
          childId,
          childType: ObjectTypes.Skill,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    test("should successfully set a SkillGroup child for a SkillGroup parent", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid skill group exists to be the child
      const childId = getMockStringId(2);
      // AND a valid skill group exists to be the parent
      const parentId = getMockStringId(3);

      const mockChild = getISkillGroupMockData(1) as ISkillGroup;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillGroupMockData(2) as ISkillGroup;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database can retrieve both successfully
      mockSkillGroupRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database will successfully create the relationship
      mockSkillHierarchyRepository.createMany.mockResolvedValue([
        {
          id: getMockStringId(12),
          modelId,
          childId: mockChild.id,
          parentId: mockParent.id,
          childType: ObjectTypes.SkillGroup,
          parentType: ObjectTypes.SkillGroup,
          childDocModel: MongooseModelName.SkillGroup,
          parentDocModel: MongooseModelName.SkillGroup,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as ISkillHierarchyPair,
      ]);

      // WHEN an attempt is made to set the parent skill group for the child skill group
      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.SkillGroup,
        parentId,
        ObjectTypes.SkillGroup
      );

      // THEN expect the newly populated parent to be returned
      expect(result).toEqual(mockParent);
      // AND expect the hierarchy repository to be called to save the relationship
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.SkillGroup,
          childId,
          childType: ObjectTypes.SkillGroup,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    test("should throw PARENT_NOT_FOUND if parent does not exist", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND an ID for a child skill
      const childId = getMockStringId(2);
      // AND an ID for a parent
      const parentId = getMockStringId(3);

      // AND the database cannot find the parent
      mockSkillRepository.findById.mockResolvedValue(null);

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the parent was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if child does not exist", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND an ID for a child skill
      const childId = getMockStringId(2);
      // AND a valid parent exists
      const parentId = getMockStringId(3);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database successfully retrieves the parent but not the child
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the child skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw PARENT_NOT_FOUND if parent modelId does not match", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND an ID for a child skill
      const childId = getMockStringId(2);
      // AND a parent exists but belongs to a different model
      const parentId = getMockStringId(3);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = getMockStringId(4); // different modelId

      // AND the database returns this parent
      mockSkillRepository.findById.mockResolvedValue(mockParent);

      // WHEN an attempt is made to link them under the initial model
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the parent was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND)
      );
    });

    test("should throw SKILL_NOT_FOUND if child modelId does not match", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a child skill exists but belongs to a different model
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = getMockStringId(4); // different modelId

      // AND a valid parent exists in the correct model
      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database retrieves both successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // WHEN an attempt is made to link them under the initial model
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the child skill was not found
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND)
      );
    });

    test("should throw PARENT_CHILD_CODE_INCONSISTENT if createMany returns empty", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid child skill exists
      const childId = getMockStringId(2);
      // AND a valid parent exists
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database retrieves both successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database creation unexpectedly returns an empty result
      mockSkillHierarchyRepository.createMany.mockResolvedValue([]);

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating an inconsistency between the parent and child (failed to link)
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );
    });

    it("should throw DB_FAILED_TO_CREATE_SKILL_PARENT if repository throws unknown error", async () => {
      // GIVEN that a taxonomy model exists
      const modelId = getMockStringId(1);
      // AND a valid child skill exists
      const childId = getMockStringId(2);
      // AND a valid parent exists
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      // AND the database retrieves both successfully
      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      // AND the hierarchy database throws an unexpected error during creation
      mockSkillHierarchyRepository.createMany.mockRejectedValue(new Error("DB Error"));

      // WHEN an attempt is made to link them
      const actualResultPromise = skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      // THEN expect a validation error indicating the database failed to create the parent relationship
      await expect(actualResultPromise).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_CREATE_SKILL_PARENT)
      );
    });
  });
});
