export type EmailAndPassword = {
  email: string;
  password: string;
};

export type ApiKeyCredentials = {
  apiKey: string;
};

export type OAuthCredentials = {
  idToken: string;
  providerId: string;
};

export type Credentials =
  | EmailAndPassword
  | OAuthCredentials
  | ApiKeyCredentials;
