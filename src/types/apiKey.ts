// @TODO
export type ApiKeyScopes = {
  [key: string]: boolean;
};

export type ApiKeyRecord = {
  id: string;
  apiKey: string;
  description: string;
  userId: string;
  scopes: ApiKeyScopes;
  createdAt: Date;
  expiresOn: Date | null;
};

export type CreateApiKeyRequest = {
  description: string;
  scopes: ApiKeyScopes;
  expiresOn?: string | Date;
};

export type RemoveApiKeyResponse = {
  success: boolean;
  message: string;
};

export type CreateCustomTokenForApiKeyRequest = {
  apiKey: string;
};

export type CreateCustomTokenForApiKeyResponse = {
  customToken: string;
  userId: string;
  scopes: ApiKeyScopes;
  apiKeyId: string;
};
