import { BehaviorSubject, of } from "rxjs";
import { take } from "rxjs/operators";
import { Settings } from "../types/settings";
import { Neurosity } from "../Neurosity";

// Mock CloudClient
jest.mock("../api/index", () => {
  const mockSettings = new BehaviorSubject<Settings>({
    lsl: false,
    supportAccess: false,
    activityLogging: false
  });

  const mockCloudClient = {
    login: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn(),
    onDeviceChange: jest.fn(),
    status: jest.fn(),
    didSelectDevice: jest.fn().mockResolvedValue(true),
    observeNamespace: jest.fn((namespace) => {
      if (namespace === "settings") {
        return mockSettings;
      }
      return of(null);
    }),
    changeSettings: jest.fn(async (settings) => {
      // Validate settings
      const validKeys = ["lsl", "bluetooth", "timesync", "deviceNickname"];
      const hasInvalidKey = Object.keys(settings).some(
        (key) => !validKeys.includes(key)
      );
      if (hasInvalidKey) {
        throw new Error("Invalid settings");
      }

      mockSettings.next({ ...mockSettings.value, ...settings });
      return Promise.resolve();
    }),
    userClaims: {
      scopes: ["settings"]
    }
  };

  return {
    CloudClient: jest.fn().mockImplementation(() => mockCloudClient)
  };
});

const testDeviceId = "mock-device-id";

describe("Settings", () => {
  let neurosity: Neurosity;
  let cloudClient: any;

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId
    });

    cloudClient = (neurosity as any).cloudClient;
  });

  describe("Settings Management", () => {
    it("should get current settings", (done) => {
      neurosity
        .settings()
        .pipe(take(1))
        .subscribe({
          next: (settings) => {
            expect(settings).toBeDefined();
            expect(settings.lsl).toBe(false);
            expect(settings.supportAccess).toBe(false);
            expect(settings.activityLogging).toBe(false);
            done();
          },
          error: done
        });
    });

    it("should update settings", (done) => {
      const newSettings = {
        lsl: true,
        bluetooth: true,
        timesync: true
      };

      neurosity
        .changeSettings(newSettings)
        .then(() => {
          neurosity
            .settings()
            .pipe(take(1))
            .subscribe({
              next: (settings) => {
                expect(settings.lsl).toBe(true);
                expect(settings.supportAccess).toBe(true);
                expect(settings.activityLogging).toBe(true);
                done();
              },
              error: done
            });
        })
        .catch(done);
    });

    it("should update device nickname", (done) => {
      neurosity
        .changeSettings({ supportAccess: true })
        .then(() => {
          neurosity
            .settings()
            .pipe(take(1))
            .subscribe({
              next: (settings) => {
                expect(settings.supportAccess).toBe(true);
                done();
              },
              error: done
            });
        })
        .catch(done);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid settings changes", async () => {
      const invalidChanges = {
        invalidSetting: true
      };

      // @ts-ignore - Testing invalid settings
      await expect(neurosity.changeSettings(invalidChanges)).rejects.toThrow(
        "Invalid settings"
      );
    });
  });
});
