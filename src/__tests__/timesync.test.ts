import { Neurosity } from "../Neurosity";

// Mock CloudClient
jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  class MockCloudClient {
    public user = null;
    public userClaims = { scopes: ["brainwaves"] };
    protected options: any;

    constructor(options: any) {
      this.options = options;
    }

    getTimesyncOffset = jest.fn().mockImplementation(() => {
      return 150; // Mock 150ms offset
    });
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Timesync", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";

  describe("with timesync enabled", () => {
    beforeEach(() => {
      neurosity = new Neurosity({
        deviceId: testDeviceId,
        emulator: true,
        timesync: true
      });
    });

    it("should get timesync offset", () => {
      const offset = neurosity.getTimesyncOffset();
      expect(offset).toBeDefined();
      expect(typeof offset).toBe("number");
      expect(offset).toBe(150);
    });
  });

  describe("with timesync disabled", () => {
    beforeEach(() => {
      neurosity = new Neurosity({
        deviceId: testDeviceId,
        emulator: true,
        timesync: false
      });
    });

    it("should return 0 when timesync is disabled", () => {
      const offset = neurosity.getTimesyncOffset();
      expect(offset).toBeDefined();
      expect(typeof offset).toBe("number");
      expect(offset).toBe(0);
    });
  });
});
