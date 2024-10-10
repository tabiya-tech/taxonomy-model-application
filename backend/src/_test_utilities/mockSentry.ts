/* eslint-disable @typescript-eslint/no-empty-function */
export {};

import { Handler } from "aws-lambda";
import * as Sentry from "@sentry/aws-serverless";

jest.spyOn(Sentry, "wrapHandler").mockImplementation((handler: Handler) => handler);
jest.spyOn(Sentry, "captureConsoleIntegration").mockImplementation(jest.fn());
jest.spyOn(Sentry, "init").mockImplementation(jest.fn());
