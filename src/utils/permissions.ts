import * as errors from "../utils/errors";
import { Action } from "../types/actions";

type OAuthClaims = {
  oauth?: true;
  authId?: string;
  scopes?: string;
};

type ApiKeyClaims = {
  apiKeyAuth?: true;
  apiKeyId?: string;
  scopes?: string;
};

type PermissionBasedClaims = OAuthClaims & ApiKeyClaims;

const scopeRequiredByAction = {
  "marker/add": "write:brainwave-markers",
  "brainwaves/record": "write:brainwaves",
  "haptics/queue": "write:haptics",
  "training/record": "write:kinesis",
  "training/stop": "write:kinesis",
  "training/stopAll": "write:kinesis",
  "wifi/reset": "write:wifi-settings"
};

const scopeRequiredByFunctionName = {
  //metrics
  accelerometer: "read:accelerometer",
  brainwaves: "read:brainwaves",
  calm: "read:calm",
  focus: "read:focus",
  kinesis: "read:kinesis",
  predictions: "read:kinesis",
  signalQuality: "read:signal-quality",
  // end of metrics
  // device info
  getInfo: "read:devices-info",
  getSelectedDevice: "read:devices-info",
  selectDevice: "read:devices-info",
  onDeviceChange: "read:devices-info",
  onUserDevicesChange: "read:devices-info",
  osVersion: "read:devices-info",
  // end device info
  settings: "read:devices-settings",
  changeSettings: "write:devices-settings",
  status: "read:devices-status",
  addDevice: "write:devices-add",
  removeDevice: "write:devices-remove",
  transferDevice: "write:devices-remove",
  createApiKey: "write:api-keys",
  removeApiKey: "write:api-keys",
  getAllApiKeys: "read:api-keys",
  createCustomToken: "write:api-keys"
};

export function validateScopeBasedPermissionForAction(
  userClaims: PermissionBasedClaims,
  action: Action
): [boolean, Error | null] {
  const { oauth, apiKeyAuth, scopes: scopesString } = userClaims ?? {};

  if (!oauth && !apiKeyAuth) {
    return [false, null];
  }

  const scopes = scopesString.split(",");

  const { command, action: actionName } = action;
  const requiredScope = scopeRequiredByAction[`${command}/${actionName}`];
  const hasRequireScopes = scopes.includes(requiredScope);

  if (hasRequireScopes) {
    return [false, null];
  }

  return [true, getScopeError(requiredScope)];
}

export function validateScopeBasedPermissionForFunctionName(
  userClaims: PermissionBasedClaims,
  functionName: string
): [boolean, Error | null] {
  const { oauth, apiKeyAuth, scopes: scopesString } = userClaims ?? {};

  if (!oauth && !apiKeyAuth) {
    return [false, null];
  }

  const scopes = scopesString.split(",");

  const requiredScope = scopeRequiredByFunctionName[functionName];
  const hasRequireScopes = scopes.includes(requiredScope);

  if (hasRequireScopes) {
    return [false, null];
  }

  return [true, getScopeError(requiredScope)];
}

function getScopeError(...requiredScopes: string[]): Error {
  return new Error(
    `${
      errors.prefix
    }You are trying to access data with an OAuth token or API key without access to the following scopes: ${requiredScopes.join(
      ", "
    )}.`
  );
}
