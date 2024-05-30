import infoURL from "./info.constants";
import { InfoProps } from "./info.types";
import { fetchWithAuth } from "../apiService/APIService";

export default class InfoService {
  async loadInfoFromUrl(url: string): Promise<InfoProps> {
    try {
      return await fetchWithAuth(url).then(async (response) => {
        const data: InfoProps = await response.json();
        if (data === null) {
          throw new Error("No data");
        }
        //jsonschema verify
        return {
          date: data.date || "",
          version: data.version || "",
          buildNumber: data.buildNumber || "",
          sha: data.sha || "",
        };
      });
    } catch (error) {
      return { date: "", version: "", buildNumber: "", sha: "" };
    }
  }

  async loadInfo() {
    // Make API calls concurrently
    return await Promise.all([this.loadInfoFromUrl(infoURL.frontend), this.loadInfoFromUrl(infoURL.backend)]);
  }
}
