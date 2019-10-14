export interface IEmailAndPassword {
  email: string;
  password: string;
}

export interface IOAuthCredentials {
  accessToken: string;
  providerId: string;
}

export type Credentials = IEmailAndPassword | IOAuthCredentials;
