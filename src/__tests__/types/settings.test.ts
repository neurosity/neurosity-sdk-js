import { Settings, ChangeSettings } from "../../types/settings";

describe("Settings Types", () => {
  it("should allow valid Settings object", () => {
    const validSettings: Settings = {
      lsl: false,
      bluetooth: true,
      timesync: false,
      deviceNickname: "test-device"
    };

    // TypeScript compilation would fail if the type is wrong
    expect(validSettings.lsl).toBeDefined();
    expect(validSettings.bluetooth).toBeDefined();
    expect(validSettings.timesync).toBeDefined();
    expect(validSettings.deviceNickname).toBeDefined();
  });

  it("should allow partial settings for ChangeSettings", () => {
    const partialSettings: ChangeSettings = {
      lsl: true,
      bluetooth: false
    };

    // TypeScript compilation would fail if the type is wrong
    expect(partialSettings.lsl).toBeDefined();
    expect(partialSettings.bluetooth).toBeDefined();
    expect(partialSettings.timesync).toBeUndefined();
    expect(partialSettings.deviceNickname).toBeUndefined();
  });
});
