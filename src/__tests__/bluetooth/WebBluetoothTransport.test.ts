import { WebBluetoothTransport } from "../../api/bluetooth/web/WebBluetoothTransport";
import { BLUETOOTH_CONNECTION } from "../../api/bluetooth/constants";
import { isWebBluetoothSupported } from "../../api/bluetooth/web/isWebBluetoothSupported";
import { firstValueFrom } from "rxjs";

jest.mock("../../api/bluetooth/web/isWebBluetoothSupported");

// Mock CustomEvent if not in browser environment
class MockCustomEvent extends Event {
  detail: any;
  constructor(type: string, init?: CustomEventInit) {
    super(type, init);
    this.detail = init?.detail;
  }
}
global.CustomEvent = MockCustomEvent as any;

// Mock Web Bluetooth API
const mockStartNotifications = jest.fn().mockResolvedValue(undefined);
const mockStopNotifications = jest.fn().mockResolvedValue(undefined);
const mockReadValue = jest.fn();
const mockWriteValue = jest.fn();
const mockGATTConnect = jest.fn();
const mockGATTDisconnect = jest.fn();

const createMockCharacteristic = (value: any = null) => {
  const listeners: Record<string, ((event: Event) => void)[]> = {};

  return {
    startNotifications: mockStartNotifications,
    stopNotifications: mockStopNotifications,
    readValue: mockReadValue.mockResolvedValue(value),
    writeValue: mockWriteValue.mockResolvedValue(undefined),
    addEventListener: jest.fn(
      (event: string, handler: (event: Event) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      }
    ),
    removeEventListener: jest.fn(
      (event: string, handler: (event: Event) => void) => {
        listeners[event] = (listeners[event] || []).filter(
          (h) => h !== handler
        );
      }
    ),
    _listeners: listeners, // For test access
    _triggerNotification(data: ArrayBuffer) {
      const dataView = new DataView(data);
      const mockEvent = {
        target: {
          value: dataView
        }
      };

      if (listeners.characteristicvaluechanged) {
        listeners.characteristicvaluechanged.forEach((handler) =>
          handler(mockEvent as unknown as Event)
        );
      }
    }
  };
};

// Create a test class that exposes protected methods for testing
class TestableWebBluetoothTransport extends WebBluetoothTransport {
  public testGetCharacteristicByName(characteristicName: string) {
    return this.getCharacteristicByName(characteristicName);
  }

  public setMockCharacteristic(name: string, characteristic: any) {
    this.characteristicsByName[name] = characteristic;
  }

  public getMockDevice() {
    return {
      gatt: {
        connected: true,
        connect: mockGATTConnect,
        disconnect: mockGATTDisconnect
      },
      dispatchEvent: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as unknown as BluetoothDevice;
  }
}

describe("WebBluetoothTransport", () => {
  let transport: TestableWebBluetoothTransport;

  beforeEach(() => {
    (isWebBluetoothSupported as jest.Mock).mockReturnValue(true);
    transport = new TestableWebBluetoothTransport();
    jest.clearAllMocks();
  });

  it("should initialize with disconnected state", async () => {
    const state = await firstValueFrom(transport.connection$);
    expect(state).toBe(BLUETOOTH_CONNECTION.DISCONNECTED);
  });

  it("should throw error if Web Bluetooth is not supported", () => {
    (isWebBluetoothSupported as jest.Mock).mockReturnValue(false);
    expect(() => new TestableWebBluetoothTransport()).toThrow(
      "Web Bluetooth is not supported"
    );
  });

  describe("Characteristic Operations", () => {
    const testCharName = "testCharacteristic";
    let mockCharacteristic: any;

    beforeEach(() => {
      mockCharacteristic = createMockCharacteristic({
        buffer: new TextEncoder().encode('{"test": "data"}')
      });
      transport.setMockCharacteristic(testCharName, mockCharacteristic);
    });

    it("should handle characteristic not found error", async () => {
      await expect(
        transport.testGetCharacteristicByName("nonexistent")
      ).rejects.toThrow("Characteristic nonexistent not found");
    });

    it("should decode JSON data when skipJSONDecoding is false", async () => {
      // Set up startNotifications to resolve after a delay
      mockStartNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

      // Set up stopNotifications to resolve after a delay
      mockStopNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

      const observable = transport.subscribe(testCharName);
      const subscriptionPromise = firstValueFrom(observable);
      const subscription = observable.subscribe();

      // Wait for subscription to be set up and startNotifications to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockStartNotifications).toHaveBeenCalled();

      // Get the notification handler
      expect(mockCharacteristic.addEventListener).toHaveBeenCalledWith(
        "characteristicvaluechanged",
        expect.any(Function)
      );

      // Simulate notification with proper event structure
      const mockData = { test: "data" };
      const encodedData = new TextEncoder().encode(JSON.stringify(mockData));
      mockCharacteristic._triggerNotification(encodedData.buffer);

      const value = await subscriptionPromise;
      expect(value).toEqual(mockData);

      // Cleanup subscription
      subscription.unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockStopNotifications).toHaveBeenCalled();
    });

    it("should not decode JSON data when skipJSONDecoding is true", async () => {
      // Set up startNotifications to resolve after a delay
      mockStartNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

      // Set up stopNotifications to resolve after a delay
      mockStopNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

      const mockData = new TextEncoder().encode('{"test": "data"}');
      mockCharacteristic = createMockCharacteristic({ buffer: mockData });
      transport.setMockCharacteristic(testCharName, mockCharacteristic);

      const observable = transport.subscribe(testCharName, {
        skipJSONDecoding: true
      });
      const subscriptionPromise = firstValueFrom(observable);
      const subscription = observable.subscribe();

      // Wait for subscription to be set up and startNotifications to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockStartNotifications).toHaveBeenCalled();

      // Get the notification handler
      expect(mockCharacteristic.addEventListener).toHaveBeenCalledWith(
        "characteristicvaluechanged",
        expect.any(Function)
      );

      // Simulate notification
      mockCharacteristic._triggerNotification(mockData.buffer);

      const value = await subscriptionPromise;
      expect(value).toEqual(new Uint8Array(mockData.buffer));

      // Cleanup subscription
      subscription.unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockStopNotifications).toHaveBeenCalled();
    });

    it("should handle notifications", async () => {
      // Set up startNotifications to resolve after a delay
      mockStartNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

      // Set up stopNotifications to resolve after a delay
      mockStopNotifications.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

      const mockData = { test: "notification" };
      const encodedData = new TextEncoder().encode(JSON.stringify(mockData));

      // Create a promise to wait for the notification
      let notificationReceived = false;
      const subscription = transport.subscribe(testCharName).subscribe(() => {
        notificationReceived = true;
      });

      // Wait for subscription to be set up and startNotifications to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockStartNotifications).toHaveBeenCalled();

      // Get the notification handler
      expect(mockCharacteristic.addEventListener).toHaveBeenCalledWith(
        "characteristicvaluechanged",
        expect.any(Function)
      );

      // Simulate notification
      mockCharacteristic._triggerNotification(encodedData.buffer);

      // Wait for notification to be processed
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(notificationReceived).toBe(true);

      // Cleanup
      subscription.unsubscribe();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockStopNotifications).toHaveBeenCalled();
    });
  });

  describe("Connection Events", () => {
    it("should handle device disconnection", async () => {
      const device = transport.getMockDevice();
      const disconnectEvent = new MockCustomEvent("gattserverdisconnected");
      if (device.gatt) {
        device.gatt.disconnect();
      }
      device.dispatchEvent(disconnectEvent);

      const state = await firstValueFrom(transport.connection$);
      expect(state).toBe(BLUETOOTH_CONNECTION.DISCONNECTED);
      expect(mockGATTDisconnect).toHaveBeenCalled();
    });
  });
});
