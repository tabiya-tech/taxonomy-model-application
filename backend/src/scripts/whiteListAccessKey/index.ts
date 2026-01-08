#!/usr/bin/env ts-node

// Register the tsconfig paths to resolve module paths correctly
// This is necessary for this CLI, since we are not building the script into a single file
// and need to resolve paths based on the tsconfig settings.
import "tsconfig-paths/register";

import AuthAPISpecs from "api-specifications/auth";

import process from "node:process";
import { Command } from "commander";
import dedent from "dedent";
import { AccessKeyType } from "auth/accessKey/accessKey.types";
import { AccessKeyService } from "auth/accessKey/accessKeyService";
import { AccessKeyRepository } from "auth/accessKey/accessKeyRepository";
import { initializeSchemaAndModel } from "auth/accessKey/accessKeyModel";
import { getNewConnection } from "../../server/connection/newConnection";

type Options = {
  accessKeyId: string;
  accessKeyType: AccessKeyType;
  role: AuthAPISpecs.Enums.TabiyaRoles;
};

async function whiteListAccessKey({ accessKeyId, accessKeyType, role }: Options) {
  const connection = await getNewConnection(process.env.AUTH_DATABASE_URI ?? "");
  const Model = initializeSchemaAndModel(connection);
  const accessKeyRepository = new AccessKeyRepository(Model);
  const accessKeyService = new AccessKeyService(accessKeyRepository);
  await accessKeyService.create({
    keyType: accessKeyType,
    keyId: accessKeyId,
    role: role,
  });
  await connection.close();
}

export function main() {
  const program = new Command();

  program
    .name("./main.ts")
    .description(
      dedent`
      Script to white list an access key. 
      e.g: 
        api-key,
        m2m-client-id
      
      Required environment variables: 
      - AUTH_DATABASE_URI: str -> The mongo db database for auth.
      `
    )
    .version("1.0.0");

  program
    .requiredOption("-k, --access-key-id <accessKeyId>", "The access key id to be whitelisted")
    .requiredOption(
      "-t, --access-key-type <accessKeyType>",
      `The type of access key to be whitelisted. One of ${Object.values(AccessKeyType).join(", ")}`
    )
    .requiredOption(
      "-r, --role <role>",
      `The role to assign to the whitelisted access key. One of ${Object.values(AuthAPISpecs.Enums.TabiyaRoles).join(
        ", "
      )}`
    )
    .action((options) => {
      const accessKeyId = options.accessKeyId;
      const accessKeyType = options.accessKeyType;
      const role = options.role;

      if (!process.env.AUTH_DATABASE_URI) {
        console.error("AUTH_DATABASE_URI environment variable must be set");
        program.help();
        return;
      }

      if (!accessKeyId || typeof accessKeyId !== "string") {
        console.error("accessKeyId must be a non-empty string");
        program.help();
        return;
      }

      if (!Object.values(AccessKeyType).includes(accessKeyType)) {
        console.error(`accessKeyType must be one of ${Object.values(AccessKeyType).join(", ")}`);
        program.help();
        return;
      }

      if (!Object.values(AuthAPISpecs.Enums.TabiyaRoles).includes(role)) {
        console.error(`role must be one of ${Object.values(AuthAPISpecs.Enums.TabiyaRoles).join(", ")}`);
        program.help();
        return;
      }

      whiteListAccessKey({
        accessKeyId,
        accessKeyType,
        role,
      }).then(() => {
        console.log("Access key whitelisted successfully");
        process.exit(0);
      });
    });

  program.parse(process.argv);
}

main();
