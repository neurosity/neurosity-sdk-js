import "./setup/webBluetooth.setup";
import { BLUETOOTH_PRIMARY_SERVICE_UUID_HEX } from "@neurosity/ipk";
import { BLUETOOTH_DEVICE_NAME_PREFIXES } from "@neurosity/ipk";
import { BLUETOOTH_COMPANY_IDENTIFIER_HEX } from "@neurosity/ipk";
import { NEVER } from "rxjs";
import { WebBluetoothTransport } from "../api/bluetooth/web/WebBluetoothTransport";
import { BLUETOOTH_CONNECTION, TRANSPORT_TYPE } from "../api/bluetooth/types";
import { DeviceInfo } from "../types/deviceInfo";
import { isWebBluetoothSupported } from "../api/bluetooth/web/isWebBluetoothSupported";

// Get the mock function for isWebBluetoothSupported
const mockIsWebBluetoothSupported = jest.requireMock(
  "../api/bluetooth/web/isWebBluetoothSupported"
).isWebBluetoothSupported;

describe("WebBluetoothTransport", () => {
  let transport: WebBluetoothTransport;
  let mockDevice: BluetoothDevice;
  let mockServer: BluetoothRemoteGATTServer;
  let mockService: BluetoothRemoteGATTService;
  let mockCharacteristic: BluetoothRemoteGATTCharacteristic;

  beforeEach(() => {
    // Mock device and GATT objects
    mockCharacteristic = {
      uuid: "characteristic-uuid",
      properties: {
        write: true,
        notify: true
      },
      startNotifications: jest.fn().mockResolvedValue(undefined),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      writeValue: jest.fn().mockResolvedValue(undefined)
    } as unknown as BluetoothRemoteGATTCharacteristic;

    mockService = {
      uuid: BLUETOOTH_PRIMARY_SERVICE_UUID_HEX,
      getCharacteristics: jest.fn().mockResolvedValue([mockCharacteristic])
    } as unknown as BluetoothRemoteGATTService;

    mockServer = {
      connected: true,
      getPrimaryService: jest.fn().mockResolvedValue(mockService),
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn()
    } as unknown as BluetoothRemoteGATTServer;

    mockDevice = {
      id: "test-device",
      name: "Test Device",
      gatt: mockServer,
      watchAdvertisements: jest.fn().mockResolvedValue(undefined),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as unknown as BluetoothDevice;

    // Mock navigator.bluetooth methods
    (window.navigator.bluetooth.getDevices as jest.Mock).mockResolvedValue([]);
    (window.navigator.bluetooth.requestDevice as jest.Mock).mockResolvedValue(
      mockDevice
    );

    transport = new WebBluetoothTransport();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with correct type and default options", () => {
    expect(transport.type).toBe(TRANSPORT_TYPE.WEB);
    expect(transport.options.autoConnect).toBe(true);
  });

  it("should throw error if Web Bluetooth is not supported", () => {
    mockIsWebBluetoothSupported.mockReturnValueOnce(false);

    expect(() => new WebBluetoothTransport()).toThrow(
      "Web Bluetooth is not supported"
    );
  });

  it("should enable/disable auto connect", (done) => {
    transport.enableAutoConnect(false);
    transport.connection().subscribe((connection) => {
      expect(connection).toBe(BLUETOOTH_CONNECTION.DISCONNECTED);
      done();
    });
  });

  it("should handle connection state changes", (done) => {
    const states: BLUETOOTH_CONNECTION[] = [];
    transport.connection().subscribe((state) => {
      states.push(state);
      if (states.length === 2) {
        expect(states).toEqual([
          BLUETOOTH_CONNECTION.DISCONNECTED,
          BLUETOOTH_CONNECTION.CONNECTED
        ]);
        done();
      }
    });

    transport.connection$.next(BLUETOOTH_CONNECTION.CONNECTED);
  });

  it("should request device with correct options", async () => {
    const deviceNickname = "Test Device";
    await transport.requestDevice(deviceNickname);

    expect(window.navigator.bluetooth.requestDevice).toHaveBeenCalledWith({
      filters: [
        {
          name: deviceNickname
        },
        {
          manufacturerData: [
            {
              companyIdentifier: BLUETOOTH_COMPANY_IDENTIFIER_HEX
            }
          ]
        }
      ],
      optionalServices: [BLUETOOTH_PRIMARY_SERVICE_UUID_HEX]
    });
  });

  it("should request device with prefixes when no nickname provided", async () => {
    await transport.requestDevice();

    expect(window.navigator.bluetooth.requestDevice).toHaveBeenCalledWith({
      filters: [
        ...BLUETOOTH_DEVICE_NAME_PREFIXES.map((namePrefix) => ({
          namePrefix
        })),
        {
          manufacturerData: [
            {
              companyIdentifier: BLUETOOTH_COMPANY_IDENTIFIER_HEX
            }
          ]
        }
      ],
      optionalServices: [BLUETOOTH_PRIMARY_SERVICE_UUID_HEX]
    });
  });

  it("should connect to device and setup GATT server", async () => {
    (mockServer.connect as jest.Mock).mockResolvedValueOnce(mockServer);
    await transport.getServerServiceAndCharacteristics(mockDevice);

    expect(mockServer.connect).toHaveBeenCalled();
    expect(mockServer.getPrimaryService).toHaveBeenCalledWith(
      BLUETOOTH_PRIMARY_SERVICE_UUID_HEX
    );
    expect(mockService.getCharacteristics).toHaveBeenCalled();
    expect(transport.connection$.getValue()).toBe(
      BLUETOOTH_CONNECTION.CONNECTED
    );
  });

  it("should handle disconnection", (done) => {
    (mockServer.connect as jest.Mock).mockResolvedValueOnce(mockServer);
    transport.device = mockDevice;
    transport.server = mockServer;
    transport.connection$.next(BLUETOOTH_CONNECTION.CONNECTED);

    transport.connection().subscribe((connection) => {
      if (connection === BLUETOOTH_CONNECTION.DISCONNECTED) {
        done();
      }
    });

    // Simulate disconnection
    const disconnectCallback = (
      mockDevice.addEventListener as jest.Mock
    ).mock.calls.find(
      ([eventName]: [string]) => eventName === "gattserverdisconnected"
    )[1];
    disconnectCallback();
  });

  it("should auto connect when enabled", async () => {
    const selectedDevice$ = NEVER;
    const autoConnect$ = transport._autoConnect(selectedDevice$);

    // Subscribe to auto connect observable
    autoConnect$.subscribe();

    // Verify auto connect is enabled
    expect(transport.options.autoConnect).toBe(true);
  });

  it("should get paired devices", async () => {
    const devices = [mockDevice];
    (window.navigator.bluetooth.getDevices as jest.Mock).mockResolvedValueOnce(
      devices
    );

    const result = await transport._getPairedDevices();
    expect(result).toEqual(devices);
  });

  it("should check connection status", () => {
    transport.connection$.next(BLUETOOTH_CONNECTION.CONNECTED);
    expect(transport.isConnected()).toBe(true);

    transport.connection$.next(BLUETOOTH_CONNECTION.DISCONNECTED);
    expect(transport.isConnected()).toBe(false);
  });

  it("should add logs", (done) => {
    const testLog = "Test log message";
    transport.logs$.subscribe((log) => {
      expect(log).toBe(testLog);
      done();
    });

    transport.addLog(testLog);
  });

  it("should handle connection errors", async () => {
    const error = new Error("Connection failed");
    (mockServer.connect as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      transport.getServerServiceAndCharacteristics(mockDevice)
    ).rejects.toThrow("Connection failed");
    expect(transport.connection$.getValue()).not.toBe(
      BLUETOOTH_CONNECTION.CONNECTED
    );
  });

  it("should handle service discovery errors", async () => {
    (mockServer.connect as jest.Mock).mockResolvedValueOnce(mockServer);
    (mockServer.getPrimaryService as jest.Mock).mockRejectedValueOnce(
      new Error("Service not found")
    );

    await expect(
      transport.getServerServiceAndCharacteristics(mockDevice)
    ).rejects.toThrow("Service not found");
    expect(transport.connection$.getValue()).not.toBe(
      BLUETOOTH_CONNECTION.CONNECTED
    );
  });

  it("should handle characteristic discovery errors", async () => {
    (mockServer.connect as jest.Mock).mockResolvedValueOnce(mockServer);
    (mockServer.getPrimaryService as jest.Mock).mockResolvedValueOnce(
      mockService
    );
    (mockService.getCharacteristics as jest.Mock).mockRejectedValueOnce(
      new Error("Characteristics not found")
    );

    await expect(
      transport.getServerServiceAndCharacteristics(mockDevice)
    ).rejects.toThrow("Characteristics not found");
    expect(transport.connection$.getValue()).not.toBe(
      BLUETOOTH_CONNECTION.CONNECTED
    );
  });
});
