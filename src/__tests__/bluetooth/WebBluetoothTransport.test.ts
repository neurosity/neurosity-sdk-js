import { WebBluetoothTransport } from "../../api/bluetooth/web/WebBluetoothTransport";
import { BLUETOOTH_CONNECTION } from "../../api/bluetooth/constants";
import { isWebBluetoothSupported } from "../../api/bluetooth/web/isWebBluetoothSupported";

jest.mock("../../api/bluetooth/web/isWebBluetoothSupported");

// Create a test class that exposes protected methods for testing
class TestableWebBluetoothTransport extends WebBluetoothTransport {
  public testGetCharacteristicByName(characteristicName: string) {
    return this.getCharacteristicByName(characteristicName);
  }
}

describe("WebBluetoothTransport", () => {
  let transport: TestableWebBluetoothTransport;

  beforeEach(() => {
    (isWebBluetoothSupported as jest.Mock).mockReturnValue(true);
    transport = new TestableWebBluetoothTransport();
  });

  it("should initialize with disconnected state", (done) => {
    transport.connection$.subscribe((state) => {
      expect(state).toBe(BLUETOOTH_CONNECTION.DISCONNECTED);
      done();
    });
  });

  it("should throw error if Web Bluetooth is not supported", () => {
    (isWebBluetoothSupported as jest.Mock).mockReturnValue(false);
    expect(() => new TestableWebBluetoothTransport()).toThrow(
      "Web Bluetooth is not supported"
    );
  });

  it("should handle characteristic not found error", async () => {
    await expect(
      transport.testGetCharacteristicByName("nonexistent")
    ).rejects.toThrow("Characteristic nonexistent not found");
  });

  it("should decode JSON data when skipJSONDecoding is false", (done) => {
    const mockCharacteristic = {
      value: {
        buffer: new TextEncoder().encode('{"test": "data"}')
      }
    } as unknown as BluetoothRemoteGATTCharacteristic;

    transport.characteristicsByName.test = mockCharacteristic;

    transport.subscribe("test").subscribe((value) => {
      expect(value).toEqual({ test: "data" });
      done();
    });
  });

  it("should not decode JSON data when skipJSONDecoding is true", (done) => {
    const mockData = new TextEncoder().encode('{"test": "data"}');
    const mockCharacteristic = {
      value: {
        buffer: mockData
      }
    } as unknown as BluetoothRemoteGATTCharacteristic;

    transport.characteristicsByName.test = mockCharacteristic;

    transport
      .subscribe("test", { skipJSONDecoding: true })
      .subscribe((value) => {
        expect(value).toEqual(mockData);
        done();
      });
  });
});
