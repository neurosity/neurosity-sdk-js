export type OAuthConfig = {
  clientId: string;
  clientSecret?: string;
  responseType: "token" | "code";
  redirectUri: string;
  scope: string[];
  state: string;
};

export type OAuthQuery = {
  clientId: string;
  clientSecret: string;
  userId: string;
};

export type OAuthQueryResult = {
  customToken: string;
  userId: string;
};

export type OAuthRemoveResponse = {
  ok: boolean;
};
