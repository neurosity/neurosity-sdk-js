export type OAuthConfig = {
  clientId: string;
  clientSecret?: string;
  responseType: string;
  redirectUri: string;
  scope: string[];
  state: string;
};
