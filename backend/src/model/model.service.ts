import Model from './model'

export default class ModelService{
    create(model: Model){
        return {
            model: {
                id: "507f1f77bcf86cd799439011", 
                originUUID: "",
                path: "/models/507f1f77bcf86cd799439011", 
                tabiyaPath: "/models/d927cbc4-ac80-4e42-9a3f-f5c90cbd9c04", 
                uuid: "d927cbc4-ac80-4e42-9a3f-f5c90cbd9c04",
                name: "foo",
                locale: {
                    uuid: "1e158047-b5b0-47af-831e-9547787e3900",
                    shortcode:"ZA",
                    name:"South Africa"
                }
            }
        }
    }
}