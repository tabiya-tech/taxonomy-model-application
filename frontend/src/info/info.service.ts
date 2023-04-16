import infoURL from "./info.constants";
import {InfoProps} from "./info.types";

export default class InfoService {
     async loadInfoFromUrl(url: string): Promise<InfoProps> {
        try {
            return await fetch(url).then(async response => {
                const data: InfoProps = await response.json();
                if (data === null) {
                    throw new Error('No data');
                }
                //jsonschema verify
                return {
                    date: data.date || "",
                    branch: data.branch || "",
                    buildNumber: data.buildNumber || "",
                    sha: data.sha || ""
                };
            });
        } catch (error) {
            return {date: "", branch: "", buildNumber: "", sha: ""};
        }
    }

    async loadInfo() {
        // Make API calls concurrently
        return await Promise.all([
            this.loadInfoFromUrl(infoURL.frontend),
            this.loadInfoFromUrl(infoURL.backend)
        ]);
    }
}