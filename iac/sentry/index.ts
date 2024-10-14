import * as pulumi from "@pulumi/pulumi";
import { createSentryProject } from "./createSentryProject";

if(!process.env.SENTRY_AUTH_TOKEN) {
    throw new Error("SENTRY_AUTH_TOKEN is required to run this project...");
}

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
// preview a piece of the auth token for debugging purposes
const authTokenPreview = sentryAuthToken ? sentryAuthToken.slice(0, 5) + "*".repeat(sentryAuthToken.length - 5) : null;
pulumi.log.info(`Using auth_token:${authTokenPreview}`);

const config = new pulumi.Config("sentry-cfg");

const organization = config.require("organization");
const team = config.require("team");

/**
 * Setup Sentry Project for backend
 */
const backendProject = "taxonomy-backend";
// a list of supported platforms can be found here:
// https://github.com/jianyuan/terraform-provider-sentry/blob/main/internal/sentryplatforms/platforms.txt
const backendPlatform = "node-awslambda";
export const sentry_backend_dsn = createSentryProject(organization, team, sentryAuthToken, backendProject, backendPlatform);
