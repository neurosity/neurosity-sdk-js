# v6.6.0

- FEAT: Added comprehensive test suite for WebBluetoothTransport
- FEAT: Added test utilities for Web Bluetooth functionality
- FEAT: Enhanced TypeScript configuration with web-bluetooth types
- TEST: Added extensive tests for Bluetooth utilities (create6DigitPin, decodeJSONChunks, stitch, TextCodec)
- CHORE: Updated TypeScript target to ES2020

# v5.0.0

- FEAT: Auto & manual device selection via `neurosity.selectDevice(...)` method
- FEAT: new methods: `neurosity.getDevices()` and `neurosity.onDeviceChange()`
- FIX: #46 Notion sends 1 packet of data even though it is asleep
- FIX: only send timesync actions if and when device is online

# v4.0.0

- Added types
- Improved documentation (Reference)

# v3.10.0

- Added periodic device status update call while subscribed to status

# v3.9.0

- Added clients connections and remove them when offline

# v3.8.1

### Package Updates

- Update IPK to v1.7.0
