import { Neurosity } from "../Neurosity";
import { firstValueFrom, of, ReplaySubject } from "rxjs";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS } from "../types/status";
import { DeviceStatus } from "../types/status";
import { MODEL_VERSION_2 } from "../utils/platform";
import {
  Epoch,
  PowerByBand,
  PSD,
  BrainwavesLabel,
  RawUnfilteredEpoch
} from "../types/brainwaves";

// Mock CloudClient
jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  class MockCloudClient {
    public user = null;
    public userClaims = { scopes: ["brainwaves"] };
    protected options: any;
    protected firebaseApp: any;
    protected firebaseUser: any;
    protected firebaseDevice: any;
    public subscriptionManager = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    };
    private _selectedDevice = new ReplaySubject<DeviceInfo | null | undefined>(
      1
    );
    private _deviceInfo: DeviceInfo = {
      deviceId: "test-device-id",
      deviceNickname: "Test Device",
      channelNames: ["CH1", "CH2"],
      channels: 2,
      samplingRate: 250,
      manufacturer: "Neurosity",
      model: "Crown",
      modelName: "Crown",
      modelVersion: MODEL_VERSION_2,
      apiVersion: "1.0.0",
      osVersion: "1.0.0",
      emulator: false
    };

    constructor(options: any) {
      this.options = options;
      this._selectedDevice.next(this._deviceInfo);
    }

    getInfo = jest.fn().mockResolvedValue(this._deviceInfo);

    selectDevice = jest
      .fn()
      .mockImplementation(
        async (selector: (devices: DeviceInfo[]) => DeviceInfo) => {
          const selectedDevice = selector([this._deviceInfo]);
          this._selectedDevice.next(selectedDevice);
          return selectedDevice;
        }
      );

    getSelectedDevice = jest.fn().mockResolvedValue(this._deviceInfo);

    didSelectDevice = jest.fn().mockResolvedValue(true);

    onDeviceChange = jest.fn().mockReturnValue(
      of({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        updatingProgress: 0,
        bluetoothEnabled: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      } as DeviceStatus)
    );

    status = jest.fn().mockReturnValue(
      of({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        updatingProgress: 0,
        bluetoothEnabled: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      } as DeviceStatus)
    );

    osVersion = jest.fn().mockReturnValue(of("1.0.0"));

    metrics = {
      subscribe: jest.fn().mockImplementation((subscription) => {
        return subscription;
      }),
      unsubscribe: jest.fn(),
      on: jest.fn().mockImplementation((subscription, callback) => {
        switch (subscription.labels[0]) {
          case "raw":
            callback({
              data: [
                [100, 200],
                [150, 250]
              ],
              info: {
                samplingRate: 250,
                startTime: Date.now(),
                notchFrequency: "60Hz",
                channelNames: [
                  "CP3",
                  "C3",
                  "F5",
                  "PO3",
                  "PO4",
                  "F6",
                  "C4",
                  "CP4"
                ]
              }
            } as Epoch);
            break;
          case "rawUnfiltered":
            callback({
              data: [
                [100, 200],
                [150, 250]
              ],
              info: {
                samplingRate: 250,
                startTime: Date.now(),
                channelNames: [
                  "CP3",
                  "C3",
                  "F5",
                  "PO3",
                  "PO4",
                  "F6",
                  "C4",
                  "CP4"
                ]
              }
            } as RawUnfilteredEpoch);
            break;
          case "powerByBand":
            callback({
              gamma: [0.5, 0.6],
              beta: [0.4, 0.5],
              alpha: [0.3, 0.4],
              theta: [0.2, 0.3],
              delta: [0.1, 0.2],
              info: {
                channelNames: [
                  "CP3",
                  "C3",
                  "F5",
                  "PO3",
                  "PO4",
                  "F6",
                  "C4",
                  "CP4"
                ],
                samplingRate: 256,
                startTime: Date.now()
              }
            } as PowerByBand);
            break;
          case "psd":
            callback({
              label: "psd",
              psd: [
                [0.1, 0.2],
                [0.3, 0.4]
              ],
              freqs: [1, 2],
              info: {
                notchFrequency: "60Hz",
                samplingRate: 250,
                startTime: Date.now(),
                channelNames: [
                  "CP3",
                  "C3",
                  "F5",
                  "PO3",
                  "PO4",
                  "F6",
                  "C4",
                  "CP4"
                ]
              }
            } as PSD);
            break;
          default:
            throw new Error(
              `One ore more labels provided to brainwaves are invalid. The valid labels for brainwaves are raw, rawUnfiltered, frequency, powerByBand, psd`
            );
        }
        return () => {};
      })
    };
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Brainwaves", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });
  });

  describe("Raw Brainwaves", () => {
    it("should get raw brainwaves data", async () => {
      const data = (await firstValueFrom(neurosity.brainwaves("raw"))) as Epoch;
      expect(data).toBeDefined();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data[0]).toBeInstanceOf(Array);
      expect(data.info.samplingRate).toBe(250);
      expect(data.info.startTime).toBeDefined();
      expect(data.info.notchFrequency).toBe("60Hz");
      expect(data.info.channelNames).toEqual([
        "CP3",
        "C3",
        "F5",
        "PO3",
        "PO4",
        "F6",
        "C4",
        "CP4"
      ]);
    });

    it("should get raw unfiltered brainwaves data", async () => {
      const data = (await firstValueFrom(
        neurosity.brainwaves("rawUnfiltered")
      )) as RawUnfilteredEpoch;
      expect(data).toBeDefined();
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data[0]).toBeInstanceOf(Array);
      expect(data.info.samplingRate).toBe(250);
      expect(data.info.startTime).toBeDefined();
      expect(data.info.channelNames).toEqual([
        "CP3",
        "C3",
        "F5",
        "PO3",
        "PO4",
        "F6",
        "C4",
        "CP4"
      ]);
      expect((data.info as any).notchFrequency).toBeUndefined();
    });
  });

  describe("Power by Band", () => {
    it("should get power by band data", async () => {
      const data = (await firstValueFrom(
        neurosity.brainwaves("powerByBand")
      )) as PowerByBand;
      expect(data).toBeDefined();
      expect(data.gamma).toBeInstanceOf(Array);
      expect(data.beta).toBeInstanceOf(Array);
      expect(data.alpha).toBeInstanceOf(Array);
      expect(data.theta).toBeInstanceOf(Array);
      expect(data.delta).toBeInstanceOf(Array);
      // Verify info object exists and has correct properties
      expect(data.info).toBeDefined();
      expect(data.info.samplingRate).toBe(256);
      expect(data.info.startTime).toBeDefined();
      expect(data.info.channelNames).toEqual([
        "CP3",
        "C3",
        "F5",
        "PO3",
        "PO4",
        "F6",
        "C4",
        "CP4"
      ]);
    });
  });

  describe("Power Spectral Density", () => {
    it("should get PSD data", async () => {
      const data = (await firstValueFrom(neurosity.brainwaves("psd"))) as PSD;
      expect(data).toBeDefined();
      expect(data.label).toBe("psd");
      expect(data.psd).toBeInstanceOf(Array);
      expect(data.freqs).toBeInstanceOf(Array);
      expect(data.info.samplingRate).toBe(250);
      expect(data.info.startTime).toBeDefined();
      expect(data.info.notchFrequency).toBe("60Hz");
      expect(data.info.channelNames).toEqual([
        "CP3",
        "C3",
        "F5",
        "PO3",
        "PO4",
        "F6",
        "C4",
        "CP4"
      ]);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid brainwaves label", async () => {
      await expect(
        firstValueFrom(neurosity.brainwaves("invalid" as any))
      ).rejects.toThrow(
        "One ore more labels provided to brainwaves are invalid. The valid labels for brainwaves are raw, rawUnfiltered, frequency, powerByBand, psd"
      );
    });
  });
});
