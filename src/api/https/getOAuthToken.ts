import axios from "axios";

import { getFunctionsBaseURL } from "./utils.js";
import { SDKOptions } from "../../types/options.js";
import { OAuthQuery, OAuthQueryResult } from "../../types/oauth.js";

export async function getOAuthToken(
  query: OAuthQuery,
  sdkOptions: SDKOptions
): Promise<OAuthQueryResult> {
  const baseUrl = getFunctionsBaseURL(sdkOptions);

  // Get refresh token
  const refreshResponse = await axios.default.post(
    `${baseUrl}/getOAuthRefreshToken`,
    query
  );

  const refreshToken = refreshResponse.data;

  return axios.default
    .post(`${baseUrl}/token`, {
      grant_type: "refresh_token",
      refresh_token: refreshToken.data,
      client_id: query.clientId,
      client_secret: query.clientSecret
    })
    .then((response) => JSON.parse(response.data)["access_token"]);
}
