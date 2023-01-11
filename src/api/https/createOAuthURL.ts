import axios from "axios";

import { getFunctionsBaseURL } from "./utils.js";
import { SDKOptions } from "../../types/options.js";
import { OAuthConfig } from "../../types/oauth.js";

export function createOAuthURL(
  config: OAuthConfig,
  sdkOptions: SDKOptions
): Promise<string> {
  const { clientId, clientSecret, responseType, redirectUri, scope, state } =
    config;

  const baseUrl = getFunctionsBaseURL(sdkOptions);

  return axios.default
    .get(`${baseUrl}/authorize/entry`, {
      params: {
        client_id: clientId,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
        response_type: responseType,
        redirect_uri: redirectUri,
        scope: scope.join(","),
        state: state,
        redirect: "false"
      }
    })
    .then((response) => `${baseUrl}${response.data.url}`);
}
