import { BehaviorSubject, Subject, Subscription, NEVER, of } from "rxjs";
import { take, toArray } from "rxjs/operators";

import { BluetoothClient } from "../api/bluetooth/BluetoothClient";
import {
  BLUETOOTH_CONNECTION,
  TRANSPORT_TYPE
} from "../api/bluetooth/types";
import { Kinesis } from "../types/kinesis";
import { DeviceInfo } from "../types/deviceInfo";

/**
 * Builds a minimal fake BluetoothTransport that satisfies the surface of
 * `BluetoothClient` used by `kinesis()`. The real WebBluetoothTransport is
 * deliberately not instantiated here because its `_onDisconnected` wiring
 * requires a live GATT device.
 */
function createFakeTransport(kinesisFeed$: Subject<Kinesis>) {
  const subscribeToCharacteristic = jest
    .fn()
    .mockImplementation(({ characteristicName }) => {
      if (characteristicName === "kinesis") {
        return kinesisFeed$.asObservable();
      }
      return NEVER;
    });

  return {
    type: TRANSPORT_TYPE.WEB,
    addLog: jest.fn(),
    logs$: new Subject<string>(),
    connection$: new BehaviorSubject<BLUETOOTH_CONNECTION>(
      BLUETOOTH_CONNECTION.CONNECTED
    ),
    onDisconnected$: NEVER,
    connection: () => of(BLUETOOTH_CONNECTION.CONNECTED),
    connect: jest.fn(),
    disconnect: jest.fn(),
    readCharacteristic: jest.fn(),
    writeCharacteristic: jest.fn(),
    dispatchAction: jest.fn(),
    subscribeToCharacteristic,
    _autoConnect: () => NEVER,
    _autoToggleActionNotifications: () => NEVER,
    enableAutoConnect: jest.fn()
  } as any;
}

describe("BluetoothClient.kinesis()", () => {
  let client: BluetoothClient;
  let kinesisFeed$: Subject<Kinesis>;
  let transport: any;

  beforeEach(() => {
    kinesisFeed$ = new Subject<Kinesis>();
    transport = createFakeTransport(kinesisFeed$);

    const selectedDevice$ = new BehaviorSubject<DeviceInfo | null>({
      deviceId: "test-device-id",
      deviceNickname: "Test",
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
    const osHasBluetoothSupport$ = new BehaviorSubject<boolean>(true);

    client = new BluetoothClient({
      transport,
      selectedDevice$,
      osHasBluetoothSupport$,
      createBluetoothToken: undefined as any
    });

    // The constructor wires auto-authentication only when a
    // createBluetoothToken function is provided, so the authenticated state
    // must be pushed directly for the metric streams to become active.
    client.isAuthenticated$.next(true);
  });

  it("subscribes to the `kinesis` BLE characteristic on first use", (done) => {
    const sub: Subscription = client
      .kinesis("leftHandPinch")
      .pipe(take(1))
      .subscribe({
        next: () => {
          expect(transport.subscribeToCharacteristic).toHaveBeenCalledWith(
            expect.objectContaining({ characteristicName: "kinesis" })
          );
          sub.unsubscribe();
          done();
        },
        error: done
      });

    setImmediate(() =>
      kinesisFeed$.next({
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.7,
        timestamp: 1
      })
    );
  });

  it("filters events by label when provided", (done) => {
    const sub: Subscription = client
      .kinesis("leftHandPinch")
      .pipe(take(2), toArray())
      .subscribe({
        next: (received) => {
          expect(received.map((k) => k.probability)).toEqual([0.4, 0.9]);
          sub.unsubscribe();
          done();
        },
        error: done
      });

    setImmediate(() => {
      kinesisFeed$.next({
        metric: "kinesis",
        label: "rightHandPinch",
        probability: 0.1,
        timestamp: 1
      });
      kinesisFeed$.next({
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.4,
        timestamp: 2
      });
      kinesisFeed$.next({
        metric: "kinesis",
        label: "rightHandPinch",
        probability: 0.55,
        timestamp: 3
      });
      kinesisFeed$.next({
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.9,
        timestamp: 4
      });
    });
  });

  it("emits every event when no label is provided", (done) => {
    const sub: Subscription = client
      .kinesis()
      .pipe(take(3), toArray())
      .subscribe({
        next: (received) => {
          expect(received.map((k) => k.label)).toEqual([
            "leftHandPinch",
            "rightHandPinch",
            "tongue"
          ]);
          sub.unsubscribe();
          done();
        },
        error: done
      });

    setImmediate(() => {
      kinesisFeed$.next({
        metric: "kinesis",
        label: "leftHandPinch",
        probability: 0.1,
        timestamp: 1
      });
      kinesisFeed$.next({
        metric: "kinesis",
        label: "rightHandPinch",
        probability: 0.2,
        timestamp: 2
      });
      kinesisFeed$.next({
        metric: "kinesis",
        label: "tongue",
        probability: 0.3,
        timestamp: 3
      });
    });
  });
});
