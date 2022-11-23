import axios from "axios";

import { getFunctionsBaseURL } from "./utils";
import { SDKOptions } from "../../types/options";
import { OAuthConfig } from "../../types/oauth";

export function createOAuthURL(
  config: OAuthConfig,
  sdkOptions: SDKOptions
): Promise<string> {
  const {
    clientId,
    clientSecret,
    responseType,
    redirectUri,
    scope,
    state
  } = config;

  const baseUrl = getFunctionsBaseURL(sdkOptions);

  return axios
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
