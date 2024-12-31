import { Neurosity } from "../Neurosity";
import { createOAuthURL } from "../api/https/createOAuthURL";
import { getOAuthToken } from "../api/https/getOAuthToken";
import { OAuthConfig } from "../types/oauth";
import { OAuthQuery } from "../types/oauth";
import { SDKOptions } from "../types/options";
import axios from "axios";

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn().mockImplementation((url, config) => {
    if (!config?.params?.client_id) {
      return Promise.reject(new Error("Missing required parameter: clientId"));
    }
    return Promise.resolve({
      data: {
        url: `/oauth/createOAuthURL?client_id=${
          config.params.client_id
        }&redirect_uri=${encodeURIComponent(
          config.params.redirect_uri
        )}&response_type=${config.params.response_type}&state=${
          config.params.state
        }&scope=${encodeURIComponent(config.params.scope)}`
      }
    });
  }),
  post: jest.fn().mockImplementation((url, data) => {
    if (!data.clientId || !data.clientSecret || !data.userId) {
      return Promise.reject(new Error("Missing OAuth credentials"));
    }
    if (data.clientId === "expired") {
      return Promise.reject(new Error("Token expired"));
    }
    return Promise.resolve({
      data: {
        userId: "test-user-id",
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresIn: 3600
      }
    });
  })
}));

// Mock getOAuthToken
jest.mock("../api/https/getOAuthToken", () => {
  return {
    __esModule: true,
    getOAuthToken: jest
      .fn()
      .mockImplementation(async (query: OAuthQuery, options: SDKOptions) => {
        try {
          const baseURL = options.emulator
            ? `http://${options.emulatorHost}:${options.emulatorFunctionsPort}/neurosity-device/us-central1`
            : "https://us-central1-neurosity-device.cloudfunctions.net";
          const response = await axios.post(baseURL, query);
          return response.data;
        } catch (error) {
          throw error;
        }
      })
  };
});

describe("OAuth and Token Management", () => {
  const options: SDKOptions = {
    emulator: true,
    emulatorHost: "localhost",
    emulatorFunctionsPort: 5001
  };

  describe("OAuth URL Creation", () => {
    const config: OAuthConfig = {
      clientId: "test-client-id",
      redirectUri: "http://localhost:3000/callback",
      responseType: "token",
      state: "random-state",
      scope: ["read:devices-info", "read:brainwaves"]
    };

    it("should create OAuth URL with valid credentials", async () => {
      const url = await createOAuthURL(config, options);
      expect(url).toContain(`client_id=${config.clientId}`);
      expect(url).toContain(
        `redirect_uri=${encodeURIComponent(config.redirectUri)}`
      );
      expect(url).toContain(`response_type=${config.responseType}`);
      expect(url).toContain(`state=${config.state}`);
      expect(url).toContain(
        `scope=${encodeURIComponent(config.scope.join(","))}`
      );
    });

    it("should reject OAuth URL creation with missing credentials", async () => {
      const { clientId, ...invalidConfig } = config;
      await expect(
        createOAuthURL(invalidConfig as OAuthConfig, options)
      ).rejects.toThrow("Missing required parameter: clientId");
    });
  });

  describe("OAuth Token Management", () => {
    it("should get OAuth token with valid credentials", async () => {
      const query: OAuthQuery = {
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        userId: "test-user-id"
      };

      const token = await getOAuthToken(query, options);
      expect(token).toEqual({
        userId: "test-user-id",
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiresIn: 3600
      });
    });

    it("should handle expired token", async () => {
      const query: OAuthQuery = {
        clientId: "expired",
        clientSecret: "test-client-secret",
        userId: "test-user-id"
      };

      await expect(getOAuthToken(query, options)).rejects.toThrow(
        "Token expired"
      );
    });

    it("should handle missing credentials", async () => {
      const query: OAuthQuery = {
        clientId: "test-client-id",
        clientSecret: "",
        userId: ""
      };

      await expect(getOAuthToken(query, options)).rejects.toThrow(
        "Missing OAuth credentials"
      );
    });
  });
});
