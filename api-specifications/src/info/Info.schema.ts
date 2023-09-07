import { SchemaObject } from "ajv";

const InfoResponseSchemaGET: SchemaObject = {
    $id: "/components/schemas/InfoResponseSchemaGET",
    type: "object",
    additionalProperties: false,
    properties: {
        date: {
            type: "string",
            format: "date-time",
            description: "The date and time when the application was built.",
        },
        branch: {
            type: "string",
            description: "The name of the git branch the application was built from.",
        },
        buildNumber: {
            type: "string",
            description: "The build number of the application.",
        },
        sha: {
            type: "string",
            description: "The git SHA of the commit used to build the application.",
        },
        path: {
            type: "string",
            description: "The URL path of the endpoint.",
        },
        database: {
            type: "string",
            enum: ["connected", "not connected"],
            description: "The database connection status.",
        },
    },
    required: [
        "date",
        "branch",
        "buildNumber",
        "sha",
        "path",
        "database"
    ]
};

export default InfoResponseSchemaGET;