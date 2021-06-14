export type CustomToken = {
  customToken: string;
};

export type EmailAndPassword = {
  email: string;
  password: string;
};

export type OAuthCredentials = {
  idToken: string;
  providerId: string;
};

export type Credentials =
  | EmailAndPassword
  | OAuthCredentials
  | CustomToken;
