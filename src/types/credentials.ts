export interface IEmailAndPassword {
  email: string;
  password: string;
}

export interface IAccessToken {
  accessToken: string;
}

export type Credentials = IEmailAndPassword | IAccessToken;
