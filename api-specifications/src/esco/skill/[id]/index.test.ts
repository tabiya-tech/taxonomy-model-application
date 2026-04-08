describe("Test the Skill Instance module", () => {
  test("The Skill Instance module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();

    const module = await import("./");

    expect(module.default.GET.Schemas.Request.Param.Payload).toBeDefined();
    expect(module.default.Parents.GET.Schemas.Response.Payload).toBeDefined();
    expect(module.default.Children.GET.Schemas.Response.Payload).toBeDefined();
    expect(module.default.Occupations.GET.Schemas.Response.Payload).toBeDefined();
    expect(module.default.RelatedSkills.GET.Schemas.Response.Payload).toBeDefined();

    const Constants = module.default.Constants;
    expect(Constants.DESCRIPTION_MAX_LENGTH).toBeDefined();
    expect(Constants.DEFINITION_MAX_LENGTH).toBeDefined();
    expect(Constants.PREFERRED_LABEL_MAX_LENGTH).toBeDefined();
    expect(Constants.ALT_LABELS_MAX_ITEMS).toBeDefined();
    expect(Constants.MAX_LIMIT).toBeDefined();

    const Enums = module.default.Enums;
    expect(Enums).toBeDefined();
    expect(Enums.SkillType).toBeDefined();
    expect(Enums.ReuseLevel).toBeDefined();
  });
});
