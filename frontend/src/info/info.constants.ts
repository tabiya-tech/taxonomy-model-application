import { getApiUrl } from "src/envService";

const infoURL = {
  frontend: "data/version.json",
  backend: getApiUrl() + "/info",
};

export default infoURL;
