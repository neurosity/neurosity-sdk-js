import { Observable, of } from "rxjs";
import { BluetoothTransport } from "../../api/bluetooth/BluetoothTransport";
import { BLUETOOTH_CONNECTION } from "../../api/bluetooth/constants";

class MockBluetoothTransport extends BluetoothTransport {
  device = {} as BluetoothDevice;
  server = {} as BluetoothRemoteGATTServer;
  service = {} as BluetoothRemoteGATTService;
  characteristicsByName: Record<string, BluetoothRemoteGATTCharacteristic> = {};

  connection$ = of(BLUETOOTH_CONNECTION.DISCONNECTED);
  pendingActions$ = of([]);
  logs$ = of("");
  onDisconnected$ = of(undefined);

  subscribe(
    _characteristicName: string,
    _options?: {
      manageNotifications?: boolean;
      skipJSONDecoding?: boolean;
    }
  ): Observable<unknown> {
    return of(null);
  }

  protected _onDisconnected(): Observable<void> {
    return of(undefined);
  }

  protected _manageNotifications(
    _characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<unknown> {
    return of(null);
  }

  protected _startNotifications(
    _characteristic: BluetoothRemoteGATTCharacteristic
  ): Observable<unknown> {
    return of(null);
  }

  protected getCharacteristicByName(
    _characteristicName: string
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    return Promise.resolve({} as BluetoothRemoteGATTCharacteristic);
  }
}

describe("BluetoothTransport", () => {
  let transport: BluetoothTransport;

  beforeEach(() => {
    transport = new MockBluetoothTransport();
  });

  it("should implement all required properties", () => {
    expect(transport.device).toBeDefined();
    expect(transport.server).toBeDefined();
    expect(transport.service).toBeDefined();
    expect(transport.characteristicsByName).toBeDefined();
  });

  it("should implement all required observables", (done) => {
    transport.connection$.subscribe((state) => {
      expect(state).toBe(BLUETOOTH_CONNECTION.DISCONNECTED);
      done();
    });
  });

  it("should implement subscribe method", (done) => {
    transport.subscribe("test").subscribe((value) => {
      expect(value).toBeNull();
      done();
    });
  });
});
