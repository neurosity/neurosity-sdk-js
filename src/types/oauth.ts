export type OAuthConfig = {
  clientId: string;
  clientSecret?: string;
  responseType: "token" | "code";
  redirectUri: string;
  scope: string[];
  state: string;
};
