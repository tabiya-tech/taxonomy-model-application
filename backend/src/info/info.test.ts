import infoService from "./info.service";
const info = new infoService();

describe("info service tests only", ()=>{
    it("version.json should exist",()=>{
        expect(info.serveVersion()).toBeDefined();
    })
})