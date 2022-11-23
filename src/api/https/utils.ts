import { prodFunctionsBaseUrl } from "./config";
import { SDKOptions } from "../../types/options";

export function getFunctionsBaseURL(sdkOptions: SDKOptions) {
  if (!sdkOptions.emulator) {
    return prodFunctionsBaseUrl;
  }

  const { emulatorHost, emulatorFunctionsPort } = sdkOptions;
  const emulatorFunctionsBaseUrl = `http://${emulatorHost}:${emulatorFunctionsPort}/neurosity-device/us-central1`;

  return emulatorFunctionsBaseUrl;
}
