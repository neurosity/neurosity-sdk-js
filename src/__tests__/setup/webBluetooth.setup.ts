/**
 * Setup file for Web Bluetooth tests
 * This configures a minimal browser-like environment for testing Web Bluetooth functionality
 */

// Mock window and navigator.bluetooth
const mockBluetooth = {
  getDevices: jest.fn(),
  requestDevice: jest.fn()
};

const mockNavigator = {
  bluetooth: mockBluetooth
} as unknown as Navigator;

const mockWindow = {
  navigator: mockNavigator
} as unknown as Window & typeof globalThis;

// Set up global object for Node environment
(global as any).window = mockWindow;
(global as any).navigator = mockWindow.navigator;

// Mock isWebBluetoothSupported
jest.mock("../../api/bluetooth/web/isWebBluetoothSupported", () => ({
  isWebBluetoothSupported: jest.fn().mockReturnValue(true)
}));

// Mock IPK constants
jest.mock("@neurosity/ipk", () => ({
  BLUETOOTH_PRIMARY_SERVICE_UUID_HEX: "test-service-uuid",
  BLUETOOTH_COMPANY_IDENTIFIER_HEX: 0x1234,
  BLUETOOTH_DEVICE_NAME_PREFIXES: ["Crown"],
  BLUETOOTH_CHUNK_DELIMITER: "\n",
  BLUETOOTH_CHARACTERISTICS: {
    ACTION: "test-action-uuid",
    ACTION_STATUS: "test-action-status-uuid",
    COMMAND: "test-command-uuid",
    STATE: "test-state-uuid"
  }
}));
