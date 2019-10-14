export interface IEmailAndPassword {
  email: string;
  password: string;
}

export interface IOAuthCredentials {
  idToken: string;
  providerId: string;
}

export type Credentials = IEmailAndPassword | IOAuthCredentials;
