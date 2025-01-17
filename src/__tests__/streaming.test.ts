import { Neurosity } from "../Neurosity";
import { firstValueFrom, take, of } from "rxjs";
import { PowerByBand, PSD, Epoch } from "../types/brainwaves";
import { STATUS } from "../types/status";
import { Metrics } from "../types/metrics";
import { SubscriptionManager } from "../subscriptions/SubscriptionManager";
import { STREAMING_MODE } from "../types/streaming";

// Mock Firebase modules
jest.mock("../api/firebase", () => ({
  FirebaseApp: jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    useEmulator: jest.fn()
  })),
  FirebaseUser: jest.fn().mockImplementation(() => ({
    login: jest.fn(),
    logout: jest.fn(),
    onAuthStateChanged: jest.fn().mockReturnValue(of(null)),
    onUserClaimsChange: jest.fn().mockReturnValue(of({}))
  })),
  FirebaseDevice: jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    getInfo: jest.fn(),
    dispatchAction: jest.fn()
  }))
}));

describe("Data Streaming", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";
  const options = {
    deviceId: testDeviceId,
    emulator: true
  };

  beforeEach(() => {
    neurosity = new Neurosity(options);

    // Mock cloudClient with userClaims for OAuth scope validation
    neurosity["cloudClient"] = {
      user: null,
      userClaims: {
        scopes: "brainwaves"
      },
      options: options,
      onDeviceChange: jest.fn().mockReturnValue(
        of({
          deviceId: testDeviceId,
          status: STATUS.ONLINE
        })
      ),
      osVersion: jest.fn().mockReturnValue(of("1.0.0")),
      status: jest.fn().mockReturnValue(of({ state: STATUS.ONLINE })),
      metrics: {
        subscribe: jest.fn().mockReturnValue(of({})),
        on: jest.fn().mockImplementation((subscription, callback) => {
          callback({});
          return jest.fn();
        }),
        unsubscribe: jest.fn(),
        next: jest.fn()
      } as unknown as Metrics,
      subscriptionManager: new SubscriptionManager()
    } as any;

    // Mock _osHasBluetoothSupport to return false
    neurosity["_osHasBluetoothSupport"] = jest.fn().mockReturnValue(of(false));
  });

  describe("Brainwaves", () => {
    it("should stream raw brainwaves data", async () => {
      const mockRawData: Epoch = {
        data: [
          [1, 2, 3, 4, 5, 6, 7, 8],
          [9, 10, 11, 12, 13, 14, 15, 16]
        ],
        info: {
          samplingRate: 256,
          startTime: Date.now(),
          channelNames: [
            "CH1",
            "CH2",
            "CH3",
            "CH4",
            "CH5",
            "CH6",
            "CH7",
            "CH8"
          ],
          notchFrequency: "60Hz"
        }
      };

      // Mock the getCloudMetric function
      neurosity["_getCloudMetricDependencies"] = jest.fn().mockReturnValue({
        options,
        cloudClient: neurosity["cloudClient"],
        onDeviceChange: neurosity["cloudClient"].onDeviceChange,
        status: neurosity["cloudClient"].status,
        getCloudMetric: jest.fn().mockReturnValue(of(mockRawData))
      });

      const brainwaves = await firstValueFrom(
        neurosity.brainwaves("raw").pipe(take(1))
      );

      expect(brainwaves).toBeDefined();
      if ("data" in brainwaves) {
        expect(Array.isArray(brainwaves.data)).toBe(true);
        expect(brainwaves.data.length).toBe(2);
        expect(brainwaves.data[0].length).toBe(8);
        expect(brainwaves.info.samplingRate).toBe(256);
      }
    });

    it("should stream power by band data", async () => {
      const mockPowerByBand: PowerByBand = {
        gamma: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
        beta: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
        alpha: [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        theta: [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1],
        delta: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2],
        info: {
          samplingRate: 256,
          startTime: Date.now(),
          channelNames: ["CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"]
        }
      };

      // Mock the getCloudMetric function
      neurosity["_getCloudMetricDependencies"] = jest.fn().mockReturnValue({
        options,
        cloudClient: neurosity["cloudClient"],
        onDeviceChange: neurosity["cloudClient"].onDeviceChange,
        status: neurosity["cloudClient"].status,
        getCloudMetric: jest.fn().mockReturnValue(of(mockPowerByBand))
      });

      const powerByBand = await firstValueFrom(
        neurosity.brainwaves("powerByBand").pipe(take(1))
      );

      expect(powerByBand).toBeDefined();
      if ("gamma" in powerByBand) {
        expect(powerByBand.gamma).toBeDefined();
        expect(powerByBand.beta).toBeDefined();
        expect(powerByBand.alpha).toBeDefined();
        expect(powerByBand.theta).toBeDefined();
        expect(powerByBand.delta).toBeDefined();
        expect(powerByBand.gamma.length).toBe(8);
      }
    });

    it("should stream PSD data", async () => {
      const mockPSD: PSD = {
        label: "psd",
        psd: [
          [1, 2, 3, 4],
          [5, 6, 7, 8]
        ],
        freqs: [0, 2, 4, 6],
        info: {
          samplingRate: 256,
          startTime: Date.now(),
          notchFrequency: "60Hz",
          channelNames: ["CH1", "CH2", "CH3", "CH4", "CH5", "CH6", "CH7", "CH8"]
        }
      };

      // Mock the getCloudMetric function
      neurosity["_getCloudMetricDependencies"] = jest.fn().mockReturnValue({
        options,
        cloudClient: neurosity["cloudClient"],
        onDeviceChange: neurosity["cloudClient"].onDeviceChange,
        status: neurosity["cloudClient"].status,
        getCloudMetric: jest.fn().mockReturnValue(of(mockPSD))
      });

      const psd = await firstValueFrom(
        neurosity.brainwaves("psd").pipe(take(1))
      );

      expect(psd).toBeDefined();
      if ("psd" in psd) {
        expect(Array.isArray(psd.psd)).toBe(true);
        expect(Array.isArray(psd.freqs)).toBe(true);
        expect(psd.info.samplingRate).toBe(256);
      }
    });

    it("should throw error when OAuth scope is missing", async () => {
      expect.assertions(1);

      // Remove brainwaves scope and set OAuth to true
      if (neurosity["cloudClient"]?.userClaims) {
        neurosity["cloudClient"].userClaims = {
          oauth: true,
          scopes: "other-scope"
        };
      }

      // Mock streaming state to ensure we're using WiFi mode
      neurosity["streamingMode$"].next(STREAMING_MODE.WIFI_ONLY);

      // Mock device status
      neurosity["cloudClient"].status = jest
        .fn()
        .mockReturnValue(of({ state: STATUS.ONLINE }));

      // Mock device change
      neurosity["cloudClient"].onDeviceChange = jest
        .fn()
        .mockReturnValue(of({ deviceId: testDeviceId, status: STATUS.ONLINE }));

      // Mock bluetooth support
      neurosity["_osHasBluetoothSupport"] = jest
        .fn()
        .mockReturnValue(of(false));

      // Mock the dependencies to ensure error propagation
      neurosity["_getCloudMetricDependencies"] = jest.fn().mockReturnValue({
        options,
        cloudClient: neurosity["cloudClient"],
        onDeviceChange: neurosity["cloudClient"].onDeviceChange,
        status: neurosity["cloudClient"].status,
        getCloudMetric: jest.fn()
      });

      try {
        await firstValueFrom(neurosity.brainwaves("raw"));
      } catch (error: any) {
        expect(error.message).toBe(
          "Neurosity SDK: You are trying to access data with an OAuth token without access to the following scopes: read:brainwaves."
        );
      }
    });
  });
});
