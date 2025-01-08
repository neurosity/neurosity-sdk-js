import { Neurosity } from "../Neurosity";
import { DeviceInfo } from "../types/deviceInfo";
import { BehaviorSubject, take } from "rxjs";
import { EmailAndPassword } from "../types/credentials";

// Mock CloudClient
jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");

  class MockCloudClient {
    public user = null;
    public userClaims = { scopes: ["brainwaves"] };
    protected options: any;
    protected firebaseApp: any;
    protected firebaseUser: any;
    protected firebaseDevice: any;
    public subscriptionManager = {
      add: jest.fn(),
      remove: jest.fn(),
      removeAll: jest.fn()
    };
    private _selectedDevice = new BehaviorSubject<
      DeviceInfo | null | undefined
    >(undefined);
    private _authStateSubject = new BehaviorSubject<any>(null);

    constructor(options: any) {
      this.options = options;
    }

    login = jest.fn().mockImplementation(async (credentials) => {
      if (credentials.email === "invalid@example.com") {
        throw new Error("Invalid credentials");
      }
      this._authStateSubject.next({ email: credentials.email });
      return { user: { email: credentials.email } };
    });

    logout = jest.fn().mockImplementation(async () => {
      this._authStateSubject.next(null);
      return {};
    });

    createAccount = jest.fn().mockImplementation(async (credentials) => {
      if (this._existingAccounts?.includes(credentials.email)) {
        throw new Error("Account already exists");
      }
      if (!this._existingAccounts) {
        this._existingAccounts = [];
      }
      this._existingAccounts.push(credentials.email);
      return { user: { email: credentials.email } };
    });

    deleteAccount = jest.fn().mockImplementation(async () => {
      this._authStateSubject.next(null);
      return {};
    });

    onAuthStateChanged = jest.fn().mockImplementation(() => {
      return this._authStateSubject.asObservable();
    });

    private _existingAccounts: string[] = [];
  }

  return {
    ...originalModule,
    CloudClient: jest
      .fn()
      .mockImplementation((options) => new MockCloudClient(options))
  };
});

describe("Authentication", () => {
  let neurosity: Neurosity;
  const testDeviceId = "test-device-id";
  const credentials: EmailAndPassword = {
    email: "test@example.com",
    password: "testPassword123"
  };

  beforeEach(() => {
    neurosity = new Neurosity({
      deviceId: testDeviceId,
      emulator: true
    });
  });

  afterEach(async () => {
    try {
      await neurosity.logout();
    } catch (error) {
      // Ignore logout errors in cleanup
    }
  });

  describe("Basic Authentication", () => {
    it("should handle login and logout flow", (done) => {
      neurosity.login(credentials).then(() => {
        neurosity
          .onAuthStateChanged()
          .pipe(take(1))
          .subscribe({
            next: (authState) => {
              expect(authState).toBeTruthy();
              expect(authState.email).toBe(credentials.email);
              done();
            },
            error: done
          });
      });
    });

    it("should handle logout", (done) => {
      neurosity.login(credentials).then(() => {
        neurosity.logout().then(() => {
          neurosity
            .onAuthStateChanged()
            .pipe(take(1))
            .subscribe({
              next: (loggedOutState) => {
                expect(loggedOutState).toBeFalsy();
                done();
              },
              error: done
            });
        });
      });
    });

    it("should reject invalid credentials", async () => {
      const invalidCredentials: EmailAndPassword = {
        email: "invalid@example.com",
        password: "wrongPassword"
      };

      await expect(neurosity.login(invalidCredentials)).rejects.toThrow(
        "Invalid credentials"
      );
    });
  });

  describe("Account Management", () => {
    it("should create account", (done) => {
      const newAccount: EmailAndPassword = {
        email: "new@example.com",
        password: "newPassword123"
      };

      neurosity.createAccount(newAccount).then(() => {
        neurosity.login(newAccount).then(() => {
          neurosity
            .onAuthStateChanged()
            .pipe(take(1))
            .subscribe({
              next: (authState) => {
                expect(authState).toBeTruthy();
                expect(authState.email).toBe(newAccount.email);
                done();
              },
              error: done
            });
        });
      });
    });

    it("should delete account", (done) => {
      const account: EmailAndPassword = {
        email: "delete@example.com",
        password: "deletePassword123"
      };

      neurosity.createAccount(account).then(() => {
        neurosity.login(account).then(() => {
          neurosity.deleteAccount().then(() => {
            neurosity
              .onAuthStateChanged()
              .pipe(take(1))
              .subscribe({
                next: (deletedState) => {
                  expect(deletedState).toBeFalsy();
                  done();
                },
                error: done
              });
          });
        });
      });
    });

    it("should prevent duplicate account creation", async () => {
      const existingAccount: EmailAndPassword = {
        email: "existing@example.com",
        password: "existingPassword123"
      };

      await expect(
        neurosity.createAccount(existingAccount)
      ).resolves.not.toThrow();
      await expect(neurosity.createAccount(existingAccount)).rejects.toThrow(
        "Account already exists"
      );

      // Cleanup
      await neurosity.login(existingAccount);
      await neurosity.deleteAccount();
    });
  });

  describe("Auth State Changes", () => {
    it("should emit initial auth state", (done) => {
      neurosity
        .onAuthStateChanged()
        .pipe(take(1))
        .subscribe({
          next: (state) => {
            expect(state).toBeFalsy(); // Initial state should be null
            done();
          },
          error: done
        });
    });

    it("should emit logged in state", (done) => {
      neurosity.login(credentials).then(() => {
        neurosity
          .onAuthStateChanged()
          .pipe(take(1))
          .subscribe({
            next: (loggedInState) => {
              expect(loggedInState).toBeTruthy();
              expect(loggedInState.email).toBe(credentials.email);
              done();
            },
            error: done
          });
      });
    });

    it("should handle session expiration", (done) => {
      neurosity.login(credentials).then(() => {
        const cloudClient = (neurosity as any).cloudClient;
        cloudClient._authStateSubject.next(null);

        neurosity
          .onAuthStateChanged()
          .pipe(take(1))
          .subscribe({
            next: (expiredState) => {
              expect(expiredState).toBeFalsy();
              done();
            },
            error: done
          });
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors during login", async () => {
      const cloudClient = (neurosity as any).cloudClient;
      cloudClient.login.mockRejectedValueOnce(new Error("Network error"));

      await expect(neurosity.login(credentials)).rejects.toThrow(
        "Network error"
      );
    });

    it("should handle server errors during account creation", async () => {
      const cloudClient = (neurosity as any).cloudClient;
      cloudClient.createAccount.mockRejectedValueOnce(
        new Error("Server error")
      );

      await expect(neurosity.createAccount(credentials)).rejects.toThrow(
        "Server error"
      );
    });
  });
});
