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
    it("should successfully set a Skill parent", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

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

      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.Skill
      );

      expect(result).toEqual(mockParent);
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.Skill,
          childId,
          childType: ObjectTypes.Skill,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    it("should successfully set a SkillGroup parent", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillGroupMockData(2) as ISkillGroup;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      mockSkillRepository.findById.mockResolvedValue(mockChild);
      mockSkillGroupRepository.findById.mockResolvedValue(mockParent);

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

      const result = await skillHierarchyService.setParent(
        modelId,
        childId,
        ObjectTypes.Skill,
        parentId,
        ObjectTypes.SkillGroup
      );

      expect(result).toEqual(mockParent);
      expect(mockSkillHierarchyRepository.createMany).toHaveBeenCalledWith(modelId, [
        {
          parentId,
          parentType: ObjectTypes.SkillGroup,
          childId,
          childType: ObjectTypes.Skill,
        } as INewSkillHierarchyPairSpec,
      ]);
    });

    it("should throw PARENT_NOT_FOUND if parent does not exist", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      mockSkillRepository.findById.mockResolvedValue(null);

      await expect(
        skillHierarchyService.setParent(modelId, childId, ObjectTypes.Skill, parentId, ObjectTypes.Skill)
      ).rejects.toThrow(new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND));
    });

    it("should throw SKILL_NOT_FOUND if child does not exist", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      await expect(
        skillHierarchyService.setParent(modelId, childId, ObjectTypes.Skill, parentId, ObjectTypes.Skill)
      ).rejects.toThrow(new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND));
    });

    it("should throw PARENT_NOT_FOUND if parent modelId does not match", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = getMockStringId(4); // different modelId

      mockSkillRepository.findById.mockResolvedValue(mockParent);

      await expect(
        skillHierarchyService.setParent(modelId, childId, ObjectTypes.Skill, parentId, ObjectTypes.Skill)
      ).rejects.toThrow(new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_NOT_FOUND));
    });

    it("should throw SKILL_NOT_FOUND if child modelId does not match", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = getMockStringId(4); // different modelId

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      await expect(
        skillHierarchyService.setParent(modelId, childId, ObjectTypes.Skill, parentId, ObjectTypes.Skill)
      ).rejects.toThrow(new SkillParentValidationError(ParentForSkillValidationErrorCode.SKILL_NOT_FOUND));
    });

    it("should throw PARENT_CHILD_CODE_INCONSISTENT if createMany returns empty", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      mockSkillHierarchyRepository.createMany.mockResolvedValue([]);

      await expect(
        skillHierarchyService.setParent(modelId, childId, ObjectTypes.Skill, parentId, ObjectTypes.Skill)
      ).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.PARENT_CHILD_CODE_INCONSISTENT)
      );
    });

    it("should throw DB_FAILED_TO_CREATE_SKILL_PARENT if repository throws unknown error", async () => {
      const modelId = getMockStringId(1);
      const childId = getMockStringId(2);
      const parentId = getMockStringId(3);

      const mockChild = getISkillMockData(1) as ISkill;
      mockChild.id = childId;
      mockChild.modelId = modelId;

      const mockParent = getISkillMockData(2) as ISkill;
      mockParent.id = parentId;
      mockParent.modelId = modelId;

      mockSkillRepository.findById.mockImplementation((id: string) => {
        if (id === childId) return Promise.resolve(mockChild);
        if (id === parentId) return Promise.resolve(mockParent);
        return Promise.resolve(null);
      });

      mockSkillHierarchyRepository.createMany.mockRejectedValue(new Error("DB Error"));

      await expect(
        skillHierarchyService.setParent(modelId, childId, ObjectTypes.Skill, parentId, ObjectTypes.Skill)
      ).rejects.toThrow(
        new SkillParentValidationError(ParentForSkillValidationErrorCode.DB_FAILED_TO_CREATE_SKILL_PARENT)
      );
    });
  });
});
