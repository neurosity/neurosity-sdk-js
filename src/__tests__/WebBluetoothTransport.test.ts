import { WebBluetoothTransport } from "../api/bluetooth/web/WebBluetoothTransport";
import { BLUETOOTH_CONNECTION } from "../api/bluetooth/constants";

// Mock isWebBluetoothSupported
jest.mock("../api/bluetooth/web/isWebBluetoothSupported", () => ({
  isWebBluetoothSupported: () => true
}));

// Mock Web Bluetooth API
(global as any).window = {
  navigator: {
    bluetooth: {
      requestDevice: jest.fn(),
      getAvailability: jest.fn().mockResolvedValue(true)
    }
  }
};

describe("WebBluetoothTransport", () => {
  let transport: WebBluetoothTransport;

  beforeEach(() => {
    transport = new WebBluetoothTransport();
  });

  it("should initialize with disconnected state", () => {
    expect(transport.connection$.getValue()).toBe(
      BLUETOOTH_CONNECTION.DISCONNECTED
    );
  });

  it("should have empty pending actions on initialization", () => {
    expect(transport.pendingActions$.getValue()).toEqual([]);
  });

  it("should have logs subject initialized", () => {
    expect(transport.logs$).toBeDefined();
  });

  it("should have onDisconnected$ observable", () => {
    expect(transport.onDisconnected$).toBeDefined();
  });

  // Add more test cases as needed
});
