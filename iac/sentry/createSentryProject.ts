import * as sentry from "@pulumiverse/sentry";
import * as pulumi from "@pulumi/pulumi";

interface SentryConfig {
  project: string;
  organization: string;
  team: string;
  authToken: string;
}

function createSentryTeam(sentryConfig: SentryConfig) {
  return new sentry.SentryTeam(sentryConfig.team, {
    name: sentryConfig.team,
    organization: sentryConfig.organization,
    slug: sentryConfig.team,
  });
}

function getSentryKey(organization: string, projectSlug: string): pulumi.Output<string> {

  const sentryKeyResult = pulumi.output(sentry.getSentryKey({
    name: "Default",
    organization: organization,
    project: projectSlug,
  }));
  return sentryKeyResult.dsnPublic;
}

export function createSentryProject(organization: string, team: string, authToken: string, project: string, platform: string): pulumi.Output<string> {
  const sentryConfig: SentryConfig = {
    organization: organization,
    team: team,
    authToken: authToken,
    project: project,
  };

  const sentryTeam = createSentryTeam(sentryConfig);
  const sentryProject = new sentry.SentryProject(sentryConfig.project, {
    organization: sentryConfig.organization,
    team: sentryTeam.slug,
    platform: platform
  });

  return sentryProject.slug.apply((slug) => getSentryKey(sentryConfig.organization, slug));
}
