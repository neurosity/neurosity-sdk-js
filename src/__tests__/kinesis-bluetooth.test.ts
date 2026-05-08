import { Neurosity } from "../Neurosity";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { filter, take, toArray } from "rxjs/operators";
import { DeviceInfo } from "../types/deviceInfo";
import { STATUS } from "../types/status";
import { DeviceStatus } from "../types/status";
import { Kinesis } from "../types/kinesis";
import { STREAMING_TYPE, STREAMING_MODE } from "../types/streaming";

// Mock CloudClient so the SDK constructs without hitting Firebase. The cloud
// path for kinesis is not exercised in this file; we exercise only the BLE
// path by forcing the active streaming mode to BLUETOOTH below.
jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  class MockCloudClient {
    public user = null;
    public userClaims = { scopes: ["kinesis"] };
    protected options: any;
    public subscriptionManager = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    };

    private _selectedDevice = new BehaviorSubject<DeviceInfo | null>({
      deviceId: "test-device-id",
      deviceNickname: "Test Device",
      channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
      channels: 8,
      samplingRate: 256,
      manufacturer: "Neurosity",
      model: "Crown",
      modelName: "Crown",
      modelVersion: "3",
      apiVersion: "1.0.0",
      osVersion: "16.0.0",
      emulator: false
    });

    constructor(options: any) {
      this.options = options;
    }

    login = jest.fn().mockResolvedValue({});
    logout = jest.fn().mockResolvedValue({});
    getInfo = jest.fn().mockResolvedValue(this._selectedDevice.value);
    selectDevice = jest
      .fn()
      .mockImplementation(async () => this._selectedDevice.value);
    didSelectDevice = jest.fn().mockResolvedValue(true);
    onDeviceChange = jest.fn().mockReturnValue(this._selectedDevice);
    osVersion = jest.fn().mockReturnValue(new BehaviorSubject("16.0.0"));
    status = jest.fn().mockReturnValue(
      new BehaviorSubject<DeviceStatus>({
        state: STATUS.ONLINE,
        charging: false,
        battery: 100,
        sleepMode: false,
        sleepModeReason: null,
        lastHeartbeat: Date.now(),
        ssid: "test-network"
      })
    );
    metrics = {
      subscribe: jest.fn(),
      on: jest.fn().mockImplementation(() => () => {}),
      unsubscribe: jest.fn()
    };
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Kinesis over Bluetooth", () => {
  let neurosity: Neurosity;
  let kinesis$: Subject<Kinesis>;
  const testDeviceId = "test-device-id";

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });

    // Stream used by the fake bluetoothClient as the BLE `kinesis`
    // characteristic feed.
    kinesis$ = new Subject<Kinesis>();

    // Replace internals so _withStreamingModeObservable picks the BLE branch.
    const anyNeurosity = neurosity as any;
    anyNeurosity.bluetoothClient = {
      kinesis: jest.fn().mockImplementation((label?: string) => {
        if (!label) {
          return kinesis$.asObservable();
        }
        return kinesis$
          .asObservable()
          .pipe(filter((event: Kinesis) => event?.label === label));
      })
    };

    // Force the active streaming mode to BLUETOOTH so
    // _withStreamingModeObservable selects the bluetooth branch.
    anyNeurosity.streamingState = jest.fn().mockReturnValue(
      new BehaviorSubject({
        connected: true,
        activeMode: STREAMING_TYPE.BLUETOOTH,
        streamingMode: STREAMING_MODE.BLUETOOTH_WITH_WIFI_FALLBACK
      })
    );
  });

  it("emits kinesis events received over the BLE transport", (done) => {
    const expected: Kinesis = {
      metric: "kinesis",
      label: "leftHandPinch",
      probability: 0.83,
      timestamp: Date.now()
    };

    neurosity
      .kinesis("leftHandPinch")
      .pipe(take(1))
      .subscribe({
        next: (kinesis) => {
          expect(kinesis).toEqual(expected);
          expect((neurosity as any).bluetoothClient.kinesis).toHaveBeenCalledWith(
            "leftHandPinch"
          );
          done();
        },
        error: done
      });

    // Emit after subscription is set up to avoid missing the Subject event.
    setImmediate(() => kinesis$.next(expected));
  });

  it("filters to the requested label on the BLE path", (done) => {
    const events: Kinesis[] = [
      {
        metric: "kinesis",
        label: "rightHandPinch",
        probability: 0.11,
        timestamp: 1
      },
      {
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.42,
        timestamp: 2
      },
      {
        metric: "kinesis",
        label: "rightHandPinch",
        probability: 0.77,
        timestamp: 3
      },
      {
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.95,
        timestamp: 4
      }
    ];

    const sub: Subscription = neurosity
      .kinesis("leftHandPinch")
      .pipe(take(2), toArray())
      .subscribe({
        next: (received) => {
          expect(received.map((k) => k.probability)).toEqual([0.42, 0.95]);
          expect(received.every((k) => k.label === "leftHandPinch")).toBe(true);
          sub.unsubscribe();
          done();
        },
        error: done
      });

    setImmediate(() => {
      for (const event of events) {
        kinesis$.next(event);
      }
    });
  });

  it("emits all kinesis events when no label is provided", (done) => {
    const events: Kinesis[] = [
      {
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.2,
        timestamp: 1
      },
      {
        metric: "kinesis",
        label: "rightHandPinch",
        probability: 0.5,
        timestamp: 2
      }
    ];

    neurosity
      .kinesis(undefined as unknown as string)
      .pipe(take(2), toArray())
      .subscribe({
        next: (received) => {
          expect(received.map((k) => k.label)).toEqual([
            "leftHandPinch",
            "rightHandPinch"
          ]);
          done();
        },
        error: done
      });

    setImmediate(() => {
      for (const event of events) {
        kinesis$.next(event);
      }
    });
  });
});
