import axios from "axios";

import { getFunctionsBaseURL } from "./utils";
import { NotionOptions } from "../../types/options";
import { OAuthConfig } from "../../types/oauth";

export async function createOAuthURL(
  config: OAuthConfig,
  sdkOptions: NotionOptions
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

  const response = await axios.get(`${baseUrl}/authorize/entry`, {
    params: {
      client_id: clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      response_type: responseType,
      redirect_uri: redirectUri,
      scope: scope.join(","),
      state: state,
      redirect: "false"
    }
  });

  return `${baseUrl}${response.data.url}`;
}
