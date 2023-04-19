export function setupFetchSpy(expectedStatus:number, expectedResponseBody: any | string, contentType: "" | "application/json;charset=UTF-8"): jest.SpyInstance {
  const responseBody = typeof expectedResponseBody === 'string' ? expectedResponseBody : JSON.stringify(expectedResponseBody);
  const expectedResponse = new Response(responseBody, {
    status: expectedStatus,
    headers: {"Content-Type": contentType}
  });
  return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
}

/*
export function setupFetchSpySuccessResponse(expectedResponseBody: any | string, contentType: "" | "application/json;charset=UTF-8"): jest.SpyInstance {
  const responseBody = typeof expectedResponseBody === 'string' ? expectedResponseBody : JSON.stringify(expectedResponseBody);
  const expectedResponse = new Response(responseBody, {
    status: 200,
    headers: {"Content-Type": contentType}
  });
  return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
}

export function setupFetchSpyErrorResponse(expectedResponseBody: any): jest.SpyInstance {
  const expectedResponse = new Response(JSON.stringify(expectedResponseBody), {
    status: 400,
    headers: {"Content-Type": "application/json"}
  });
  return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
}

*/
/*

  function setupFetchSpySuccessResponse(expectedResponseBody: any | string, contentType: "" | "application/json;charset=UTF-8"): jest.SpyInstance {
    const responseBody = typeof expectedResponseBody ==='string'? expectedResponseBody : JSON.stringify(expectedResponseBody);
    const expectedResponse = new Response(responseBody, {
      status: 201,
      headers: {"Content-Type": contentType}
    });
    return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
  }

  function setupFetchSpyErrorResponse(expectedResponseBody: any): jest.SpyInstance {
    const expectedResponse = new Response(JSON.stringify(expectedResponseBody), {
      status: 400,
      headers: {"Content-Type": "application/json"}
    });
    return jest.spyOn(window, 'fetch').mockResolvedValue(expectedResponse);
  }
 */