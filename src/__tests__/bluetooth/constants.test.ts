import {
  BLUETOOTH_CONNECTION,
  BLUETOOTH_PRIMARY_SERVICE_UUID_HEX,
  BLUETOOTH_COMPANY_IDENTIFIER_HEX,
  BLUETOOTH_DEVICE_NAME_PREFIXES,
  BLUETOOTH_CHARACTERISTICS
} from "../../api/bluetooth/constants";

describe("Bluetooth Constants", () => {
  it("should define all connection states", () => {
    expect(BLUETOOTH_CONNECTION.DISCONNECTED).toBe("disconnected");
    expect(BLUETOOTH_CONNECTION.SCANNING).toBe("scanning");
    expect(BLUETOOTH_CONNECTION.CONNECTING).toBe("connecting");
    expect(BLUETOOTH_CONNECTION.CONNECTED).toBe("connected");
  });

  it("should define primary service UUID", () => {
    expect(BLUETOOTH_PRIMARY_SERVICE_UUID_HEX).toBe(
      "0000fe84-0000-1000-8000-00805f9b34fb"
    );
  });

  it("should define company identifier", () => {
    expect(BLUETOOTH_COMPANY_IDENTIFIER_HEX).toBe(0x0438);
  });

  it("should define device name prefixes", () => {
    expect(BLUETOOTH_DEVICE_NAME_PREFIXES).toEqual(["Crown", "Notion"]);
  });

  it("should define all characteristics", () => {
    expect(BLUETOOTH_CHARACTERISTICS.COMMAND).toBe("command");
    expect(BLUETOOTH_CHARACTERISTICS.ACTION).toBe("action");
    expect(BLUETOOTH_CHARACTERISTICS.STATUS).toBe("status");
    expect(BLUETOOTH_CHARACTERISTICS.INFO).toBe("info");
  });
});
