import {handler as infoHandler} from "./index";
import {HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES} from "httpUtils";
import version from './version.json';

describe("test for info handler", () => {

  it("GET should respond with the 200 and the version, ", async () => {
    //GIVEN a GET event
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET
    }

    //WHEN the info handler is invoked with event param
    //@ts-ignore
    const actualResponse = await infoHandler(givenEvent, null, null);

    // THEN expect response to be OK and the version
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND expect the body to be a json representation the version
    expect(actualResponse.body).toEqual(JSON.stringify(version));
  })

  it.each([
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.OPTIONS,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.POST
  ])("%s should respond with 404 error",
    async (param) => {
      //GIVEN an event with a non GET method
      const event = {httpMethod: param};

      //WHEN the info handler is invoked
      //@ts-ignore
      const actualResponse = await infoHandler(event, null, null);

      //THEN expect status to be 400
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
    });
})