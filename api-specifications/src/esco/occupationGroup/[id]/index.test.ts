describe("Test the OccupationGroup Detail module", () => {
  test("The OccupationGroup Detail module can be required via the index", async () => {
    expect(async () => await import("./")).not.toThrow();

    const occupationGroupDetailModule = await import("./");

    // THEN check if Schemas are defined
    expect(occupationGroupDetailModule.default.GET.Schemas.Response.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.PUT.Schemas.Request.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.PATCH.Schemas.Request.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.DELETE.Schemas.Request.Param.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.Parent.GET.Schemas.Response.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.Parent.POST.Schemas.Request.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.Parent.PUT.Schemas.Request.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.Parent.PATCH.Schemas.Request.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.Parent.DELETE.Schemas.Request.Param.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.Children.GET.Schemas.Response.Children.Payload).toBeDefined();
    expect(occupationGroupDetailModule.default.History.GET.Schemas.Response.Payload).toBeDefined();
  });
});
