/**
 * @internal
 */
export interface EmailAndPassword {
  email: string;
  password: string;
}

/**
 * @internal
 */
export interface OAuthCredentials {
  idToken: string;
  providerId: string;
}

export type Credentials = EmailAndPassword | OAuthCredentials;
