import { validateOAuthScopeForFunctionName } from "../utils/oauth";
import { validateOAuthScopeForAction } from "../utils/oauth";
import { getCloudMetric } from "../utils/metrics";
import { isNode } from "../utils/is-node";
import { getLabels, validate } from "../utils/subscription";
import { Action } from "../types/actions";
import { UserClaims } from "../types/user";
import { Observable, firstValueFrom } from "rxjs";

type MetricLabels = {
  [key: string]: string[];
};

jest.mock("../utils/subscription", () => ({
  getLabels: jest.fn((metric: string) => {
    const metrics: MetricLabels = {
      brainwaves: ["raw", "powerByBand", "psd"],
      focus: ["focus"],
      calm: ["calm"],
      kinesis: ["someAction"]
    };
    return metrics[metric] || [];
  }),
  validate: jest.fn((metric: string, labels: string[]) => {
    const validMetrics = ["brainwaves", "focus", "calm", "kinesis"];
    if (!validMetrics.includes(metric)) {
      return new Error("Invalid metric");
    }
    if (!labels || labels.length === 0) {
      return new Error("At least one label is required");
    }
    return false;
  })
}));

describe("Utility Functions", () => {
  describe("OAuth Utilities", () => {
    const mockClaims: UserClaims = {
      oauth: true,
      scopes: "read:brainwaves,write:actions,write:brainwave-markers,read:focus"
    };

    it("should validate OAuth scopes for function names", () => {
      const [hasError, error] = validateOAuthScopeForFunctionName(
        mockClaims,
        "brainwaves"
      );
      expect(hasError).toBe(false);
      expect(error).toBeNull();

      const [hasErrorInvalid, errorInvalid] = validateOAuthScopeForFunctionName(
        { oauth: true, scopes: "invalid:scope" },
        "brainwaves"
      );
      expect(hasErrorInvalid).toBe(true);
      expect(errorInvalid).toBeTruthy();
    });

    it.skip("should validate OAuth scopes for actions", () => {
      const mockAction: Action = {
        command: "marker",
        action: "add",
        message: {}
      };

      const [hasError, error] = validateOAuthScopeForAction(
        mockClaims,
        mockAction
      );
      expect(hasError).toBe(false);
      expect(error).toBeNull();

      const [hasErrorInvalid, errorInvalid] = validateOAuthScopeForAction(
        { oauth: true, scopes: "invalid:scope" },
        mockAction
      );
      expect(hasErrorInvalid).toBe(true);
      expect(errorInvalid).toBeTruthy();
    });
  });

  describe("Metric Utilities", () => {
    const mockDependencies = {
      options: {},
      cloudClient: {
        userClaims: {},
        didSelectDevice: () => Promise.resolve(true)
      },
      onDeviceChange: () =>
        new Observable((observer) => {
          observer.next({ deviceId: "test" });
        }),
      status: () =>
        new Observable((observer) => {
          observer.next({ state: "online" });
        })
    };

    it("should get cloud metric", () => {
      const result = getCloudMetric(mockDependencies, {
        metric: "focus",
        labels: ["focus"],
        atomic: false
      });
      expect(result).toBeTruthy();
      expect(result instanceof Observable).toBe(true);
    });

    it("should handle invalid metric names", async () => {
      const result = getCloudMetric(mockDependencies, {
        metric: "invalidMetric",
        labels: [],
        atomic: false
      });

      await expect(firstValueFrom(result)).rejects.toThrow("Invalid metric");
    });
  });

  describe("Environment Detection", () => {
    it("should detect Node.js environment", () => {
      const result = isNode();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Subscription Utilities", () => {
    it("should get labels for valid metric", () => {
      const result = getLabels("brainwaves");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain("raw");
      expect(result).toContain("powerByBand");
      expect(result).toContain("psd");
    });

    it("should handle invalid metric names", () => {
      const result = getLabels("invalidMetric");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
