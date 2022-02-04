import axios from "axios";

import { getFunctionsBaseURL } from "./utils";
import { NotionOptions } from "../../types/options";
import { OAuthQuery, OAuthQueryResult } from "../../types/oauth";

export function getOAuthToken(
  query: OAuthQuery,
  sdkOptions: NotionOptions
): Promise<OAuthQueryResult> {
  const baseUrl = getFunctionsBaseURL(sdkOptions);

  return axios
    .post(`${baseUrl}/getOAuthToken`, query)
    .then((response) => response.data);
}
