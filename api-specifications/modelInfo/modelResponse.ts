

export const  modelResponseSchema = {

    type: "object",
    properties: {
        id: {
            type: "string"
        },
        originUUID: {
            type: "string"
        },
        path: {
            type: "string"
        },
        tabiyaPath: {
            type: "string"
        },
        uuid: {
            type: "string"
        },
        name: {
            type: "string"
        },
        description: {
            type: "string"
        },
        locale: {
            type: "object",
            properties: {
                uuid: {
                    type: "string"
                },
                shortcode: {
                    type: "string"
                },
                name: {
                    type: "string"
                }
            },
            required: [
                "uuid",
                "shortcode",
                "name"
            ]
        }
    },
    required: [
        "id",
        "originUUID",
        "path",
        "tabiyaPath",
        "uuid",
        "name",
        "description",
        "locale"
    ]
}