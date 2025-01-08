/// <reference types="node" />

import { of } from "rxjs";

// Mock Firebase modules
jest.mock("../api/firebase", () => {
  const mockFirebaseApp = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    useEmulator: jest.fn()
  }));
  mockFirebaseApp.prototype.constructor = mockFirebaseApp;

  const mockFirebaseUser = jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue({}),
    logout: jest.fn().mockResolvedValue({}),
    onAuthStateChanged: jest.fn().mockReturnValue(of(null)),
    onUserClaimsChange: jest.fn().mockReturnValue(of({}))
  }));
  mockFirebaseUser.prototype.constructor = mockFirebaseUser;

  const mockFirebaseDevice = jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    getInfo: jest.fn().mockResolvedValue({}),
    selectDevice: jest.fn().mockResolvedValue({}),
    dispatchAction: jest.fn()
  }));
  mockFirebaseDevice.prototype.constructor = mockFirebaseDevice;

  return {
    FirebaseApp: mockFirebaseApp,
    FirebaseUser: mockFirebaseUser,
    FirebaseDevice: mockFirebaseDevice
  };
});
