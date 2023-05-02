export const  modelRequestSchema = {

    type: "object",
    properties: {
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
                }
            },
            required: [
                "uuid"
            ]
        }
    },
    required: [
        "name",
        "description",
        "locale"
    ]
}