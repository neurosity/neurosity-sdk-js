import { Neurosity } from "../Neurosity";
import { firstValueFrom } from "rxjs";
import { EmailAndPassword } from "../types/credentials";

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
    it.skip("should handle login and logout flow", async () => {
      await expect(neurosity.login(credentials)).resolves.not.toThrow();
      const authState = await firstValueFrom(neurosity.onAuthStateChanged());
      expect(authState).toBeTruthy();

      await expect(neurosity.logout()).resolves.not.toThrow();
      const loggedOutState = await firstValueFrom(
        neurosity.onAuthStateChanged()
      );
      expect(loggedOutState).toBeFalsy();
    });

    it.skip("should reject invalid credentials", async () => {
      const invalidCredentials: EmailAndPassword = {
        email: "invalid@example.com",
        password: "wrongPassword"
      };
      await expect(neurosity.login(invalidCredentials)).rejects.toThrow();
    });
  });

  describe("Account Management", () => {
    it.skip("should create and delete account", async () => {
      const newAccount: EmailAndPassword = {
        email: "new@example.com",
        password: "newPassword123"
      };

      await expect(neurosity.createAccount(newAccount)).resolves.not.toThrow();
      await expect(neurosity.login(newAccount)).resolves.not.toThrow();

      const authState = await firstValueFrom(neurosity.onAuthStateChanged());
      expect(authState).toBeTruthy();

      await expect(neurosity.deleteAccount()).resolves.not.toThrow();
      const deletedState = await firstValueFrom(neurosity.onAuthStateChanged());
      expect(deletedState).toBeFalsy();
    });

    it.skip("should prevent duplicate account creation", async () => {
      const existingAccount: EmailAndPassword = {
        email: "existing@example.com",
        password: "existingPassword123"
      };

      await expect(
        neurosity.createAccount(existingAccount)
      ).resolves.not.toThrow();
      await expect(neurosity.createAccount(existingAccount)).rejects.toThrow();

      // Cleanup
      await neurosity.login(existingAccount);
      await neurosity.deleteAccount();
    });
  });

  describe("Auth State Changes", () => {
    it.skip("should emit auth state changes", async () => {
      const authStates: boolean[] = [];
      const subscription = neurosity.onAuthStateChanged().subscribe((state) => {
        authStates.push(!!state);
      });

      await neurosity.login(credentials);
      await neurosity.logout();

      subscription.unsubscribe();
      expect(authStates).toEqual([false, true, false]);
    });

    it.skip("should handle session expiration", async () => {
      await neurosity.login(credentials);
      const initialState = await firstValueFrom(neurosity.onAuthStateChanged());
      expect(initialState).toBeTruthy();

      // Mock session expiration
      // TODO: Implement session expiration simulation
      const expiredState = await firstValueFrom(neurosity.onAuthStateChanged());
      expect(expiredState).toBeFalsy();
    });
  });

  describe("Error Handling", () => {
    it.skip("should handle network errors during login", async () => {
      // Mock network error
      await expect(neurosity.login(credentials)).rejects.toThrow();
    });

    it.skip("should handle server errors during account creation", async () => {
      // Mock server error
      await expect(neurosity.createAccount(credentials)).rejects.toThrow();
    });
  });
});
