export function setupFetchSpy(
  expectedStatus: number,
  expectedResponseBody: string | object | undefined,
  contentType: "" | "application/json;charset=UTF-8"
): jest.SpyInstance {
  const responseBody =
    typeof expectedResponseBody === "string" ? expectedResponseBody : JSON.stringify(expectedResponseBody);
  const expectedResponse = new Response(responseBody, {
    status: expectedStatus,
    headers: { "Content-Type": contentType },
  });
  return jest.spyOn(window, "fetch").mockResolvedValue(expectedResponse);
}
