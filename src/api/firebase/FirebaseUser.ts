import { Observable, fromEventPattern, from, EMPTY } from "rxjs";
import { map, switchMap } from "rxjs/operators";
import { FirebaseApp as FirebaseAppType } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signInWithCredential,
  signOut,
  User,
  OAuthProvider
} from "firebase/auth";
import {
  getDatabase,
  ref,
  update,
  remove,
  get,
  onValue,
  off,
  serverTimestamp,
  DataSnapshot,
  query,
  orderByChild,
  equalTo,
  limitToFirst
} from "firebase/database";
import { getFunctions, httpsCallable } from "firebase/functions";

import { FirebaseApp } from "./FirebaseApp";
import {
  Credentials,
  EmailAndPassword,
  CustomToken
} from "../../types/credentials";
import { UserDevices, UserClaims } from "../../types/user";
import { DeviceInfo } from "../../types/deviceInfo";
import { OAuthRemoveResponse } from "../../types/oauth";
import { Experiment } from "../../types/experiment";
import { TransferDeviceOptions } from "../../utils/transferDevice";
import {
  ApiKeyRecord,
  CreateApiKeyRequest,
  CreateCustomTokenForApiKeyRequest,
  CreateCustomTokenForApiKeyResponse,
  RemoveApiKeyResponse
} from "../../types/apiKey";

/**
 * @hidden
 */
export type UserWithMetadata = User & {
  selectedDevice: DeviceInfo | null;
};

/**
 * @hidden
 */
export class FirebaseUser {
  public app: FirebaseAppType;
  public user: User | null;

  constructor(firebaseApp: FirebaseApp) {
    this.app = firebaseApp.app;
    const auth = getAuth(this.app);

    onAuthStateChanged(auth, (user: User | null) => {
      this.user = user;
    });
  }

  public auth() {
    return getAuth(this.app);
  }

  async createAccount(credentials: EmailAndPassword) {
    const { email, password } = credentials;
    const auth = getAuth(this.app);
    const [error, user] = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
      .then((user) => [null, user])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }

    return user;
  }

  async deleteAccount() {
    const auth = getAuth(this.app);
    const user = auth.currentUser;

    if (!user) {
      return Promise.reject(
        new Error(
          `You are trying to delete an account that is not authenticated. To delete an account, the account must have signed in recently.`
        )
      );
    }

    const [devicesError, devices] = await this.getDevices()
      .then((response) => [null, response])
      .catch((error) => [error, null]);

    if (devicesError) {
      return Promise.reject(devicesError);
    }

    if (devices.length) {
      const removeDeviceError = await Promise.all(
        devices.map((device) => this.removeDevice(device.deviceId))
      )
        .then(() => null)
        .catch((error) => error);

      if (removeDeviceError) {
        return Promise.reject(removeDeviceError);
      }
    }

    return user.delete();
  }

  onAuthStateChanged(): Observable<User | null> {
    return new Observable((subscriber) => {
      try {
        const auth = getAuth(this.app);
        onAuthStateChanged(
          auth,
          (user: User | null) => {
            subscriber.next(user);
          },
          (error) => {
            subscriber.error(error);
          }
        );
      } catch (error) {
        subscriber.error(error);
      }
    });
  }

  onLogin(): Observable<User> {
    return new Observable((subscriber) => {
      const auth = getAuth(this.app);
      const unsubscribe = onAuthStateChanged(auth, (user: User) => {
        if (!!user) {
          subscriber.next(user);
          subscriber.complete();
        }
      });
      return () => unsubscribe();
    });
  }

  async login(credentials: Credentials) {
    const auth = getAuth(this.app);

    if ("apiKey" in credentials) {
      const { apiKey } = credentials;

      const { customToken } = await this._createCustomTokenForApiKey({
        apiKey
      });

      return await signInWithCustomToken(auth, customToken);
    }

    if ("customToken" in credentials) {
      const { customToken } = credentials;
      return await signInWithCustomToken(auth, customToken);
    }

    if ("idToken" in credentials && "providerId" in credentials) {
      const provider = new OAuthProvider(credentials.providerId);
      const oAuthCredential = provider.credential({
        idToken: credentials.idToken
      });
      return await signInWithCredential(auth, oAuthCredential);
    }

    if ("email" in credentials && "password" in credentials) {
      const { email, password } = credentials;
      return await signInWithEmailAndPassword(auth, email, password);
    }

    throw new Error(
      `Either {email,password}, {apiKey}, {customToken}, or {idToken,providerId} is required`
    );
  }

  logout() {
    const auth = getAuth(this.app);
    return signOut(auth);
  }

  public async createCustomToken(): Promise<CustomToken> {
    const functions = getFunctions(this.app);
    const createCustomTokenFn = httpsCallable(functions, "createCustomToken");

    const [error, customToken] = await createCustomTokenFn()
      .then(({ data }) => [null, data])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }

    return customToken;
  }

  public async createApiKey(data: CreateApiKeyRequest): Promise<ApiKeyRecord> {
    const { description, scopes } = data;

    if (!description) {
      return Promise.reject("createApiKey: description is required");
    }

    if (!scopes) {
      return Promise.reject("createApiKey: scopes is required");
    }

    const functions = getFunctions(this.app);
    const createApiKeyFn = httpsCallable(functions, "createApiKey");

    const [error, apiKeyRecord] = await createApiKeyFn(data)
      .then(({ data }) => [null, data as ApiKeyRecord])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }

    return apiKeyRecord;
  }

  public async removeApiKey(apiKeyId: string): Promise<RemoveApiKeyResponse> {
    if (!apiKeyId) {
      return Promise.reject("removeApiKey: apiKeyId is required");
    }

    const functions = getFunctions(this.app);
    const removeApiKeyFn = httpsCallable(functions, "removeApiKey");

    const [error, removeApiKeyResponse] = await removeApiKeyFn({ apiKeyId })
      .then(({ data }) => [null, data as RemoveApiKeyResponse])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }

    return removeApiKeyResponse;
  }

  private async _createCustomTokenForApiKey({
    apiKey
  }: CreateCustomTokenForApiKeyRequest): Promise<CreateCustomTokenForApiKeyResponse> {
    const functions = getFunctions(this.app);
    const createCustomTokenForApiKeyFn = httpsCallable(
      functions,
      "createCustomTokenForApiKey"
    );

    const [error, createCustomTokenForApiKeyResponse] =
      await createCustomTokenForApiKeyFn({ apiKey })
        .then(({ data }) => [null, data as CreateCustomTokenForApiKeyResponse])
        .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }

    return createCustomTokenForApiKeyResponse;
  }

  public async removeOAuthAccess(): Promise<OAuthRemoveResponse> {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(
        `OAuth access can only be removed while logged in via OAuth.`
      );
    }

    const functions = getFunctions(this.app);
    const removeAccessOAuthAppFn = httpsCallable(
      functions,
      "removeAccessOAuthApp"
    );

    const [error, response] = await removeAccessOAuthAppFn()
      .then(({ data }) => [null, data])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }

    const logoutError = await this.logout()
      .then(() => false)
      .catch((error) => error);

    if (logoutError) {
      return Promise.reject(logoutError);
    }

    return response;
  }

  async getDevices() {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(`Please login.`);
    }

    const database = getDatabase(this.app);
    const userDevicesRef = ref(database, this.getUserDevicesPath());
    const snapshot = await get(userDevicesRef);

    const userDevices: UserDevices | null = snapshot.val();

    return this.userDevicesToDeviceInfoList(userDevices);
  }

  async addDevice(deviceId: string): Promise<void> {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(`Please login.`);
    }

    const devices = await this.getDevices().catch((error) => {
      console.log(error);
    });

    const deviceAlreadyInAccount =
      devices &&
      devices.length &&
      devices.map(({ deviceId }) => deviceId).includes(deviceId);

    if (deviceAlreadyInAccount) {
      return Promise.reject(`The device is already added to this account.`);
    }

    const [isValid, invalidErrorMessage] = await this.isDeviceIdValid(deviceId)
      .then((isValid) => [isValid])
      .catch((error) => [false, error]);

    if (!isValid) {
      return Promise.reject(invalidErrorMessage);
    }

    const claimedByPath = this.getDeviceClaimedByPath(deviceId);
    const userDevicePath = this.getUserClaimedDevicePath(deviceId);

    const database = getDatabase(this.app);
    const [hasError, errorMessage] = await update(ref(database), {
      [claimedByPath]: userId,
      [userDevicePath]: {
        claimedOn: serverTimestamp()
      }
    })
      .then(() => [false])
      .catch((error) => [true, error]);

    if (hasError) {
      return Promise.reject(errorMessage);
    }
  }

  async removeDevice(deviceId: string): Promise<void> {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(`Please login.`);
    }

    const claimedByPath = this.getDeviceClaimedByPath(deviceId);
    const userDevicePath = this.getUserClaimedDevicePath(deviceId);

    const database = getDatabase(this.app);
    const claimedByRef = ref(database, claimedByPath);
    const userDeviceRef = ref(database, userDevicePath);

    const [hasError, errorMessage] = await Promise.all([
      remove(claimedByRef),
      remove(userDeviceRef)
    ])
      .then(() => [false])
      .catch((error) => [true, error]);

    if (hasError) {
      return Promise.reject(errorMessage);
    }
  }

  public async transferDevice(options: TransferDeviceOptions): Promise<void> {
    const userId = this.user?.uid;

    if (!userId) {
      return Promise.reject(new Error(`transferDevice: auth is required.`));
    }

    if (!("recipientsEmail" in options) && !("recipientsUserId" in options)) {
      return Promise.reject(
        new Error(
          `transferDevice: either 'recipientsEmail' or 'recipientsUserId' key is required.`
        )
      );
    }

    if (!options?.deviceId) {
      return Promise.reject(
        new Error(`transferDevice: a deviceId is required.`)
      );
    }

    const functions = getFunctions(this.app);
    const transferDeviceOwnershipFn = httpsCallable(
      functions,
      "transferDeviceOwnership"
    );

    const [error, response] = await transferDeviceOwnershipFn(options)
      .then(({ data }) => [null, data])
      .catch((error) => [error, null]);

    if (error) {
      return Promise.reject(error);
    }
  }

  async isDeviceIdValid(deviceId: string): Promise<boolean> {
    // hex string of 32 characters
    const hexRegEx = /[0-9A-Fa-f]{32}/g;
    if (!deviceId || deviceId.length !== 32 || !hexRegEx.test(deviceId)) {
      return Promise.reject("The device id is incorrectly formatted.");
    }

    const claimedByPath = this.getDeviceClaimedByPath(deviceId);
    const database = getDatabase(this.app);
    const claimedByRef = ref(database, claimedByPath);

    const claimedBySnapshot = await get(claimedByRef).catch(() => null);

    if (!claimedBySnapshot || claimedBySnapshot.exists()) {
      return Promise.reject("The device has already been claimed.");
    }

    return true;
  }

  onUserDevicesChange(): Observable<DeviceInfo[]> {
    return this.onAuthStateChanged().pipe(
      switchMap((user) => {
        if (!user) {
          return EMPTY;
        }

        const userDevicesPath = this.getUserDevicesPath();
        const database = getDatabase(this.app);
        const userDevicesRef = ref(database, userDevicesPath);

        return fromEventPattern(
          (handler) =>
            onValue(userDevicesRef, (snapshot: DataSnapshot) =>
              handler(snapshot)
            ),
          (handler) => off(userDevicesRef)
        ).pipe(
          map((snapshot: DataSnapshot) => snapshot.val()),
          switchMap((userDevices: UserDevices | null) => {
            return from(this.userDevicesToDeviceInfoList(userDevices));
          })
        );
      })
    );
  }

  onUserClaimsChange(): Observable<UserClaims> {
    return this.onAuthStateChanged().pipe(
      switchMap((user) => {
        if (!user) {
          return EMPTY;
        }

        const claimsUpdatedOnPath = this.getUserClaimsUpdatedOnPath();
        const database = getDatabase(this.app);
        const claimsUpdatedOnRef = ref(database, claimsUpdatedOnPath);

        return fromEventPattern(
          (handler) =>
            onValue(claimsUpdatedOnRef, (snapshot: DataSnapshot) =>
              handler(snapshot)
            ),
          (handler) => off(claimsUpdatedOnRef)
        ).pipe(
          map((snapshot: DataSnapshot) => snapshot.val()),
          switchMap(() => {
            // Force refresh of auth id token
            return from(this.getIdToken(true)).pipe(
              switchMap(() => from(this.getClaims()))
            );
          })
        );
      })
    );
  }

  async getIdToken(forceRefresh = false): Promise<void> {
    const auth = getAuth(this.app);
    const user = auth?.currentUser;

    if (!user) {
      return Promise.reject(`getUserIdToken: unable to get currentUser`);
    }

    await user.getIdToken(forceRefresh).catch((error) => {
      console.error(error);
    });
  }

  getClaims(): Promise<UserClaims> {
    const auth = getAuth(this.app);
    const user = auth?.currentUser;

    if (!user) {
      return Promise.reject(`getUserClaims: unable to get currentUser`);
    }

    return user
      .getIdTokenResult()
      .then((token) => token.claims)
      .catch((error) => {
        console.error(error);
        return null;
      });
  }

  private async userDevicesToDeviceInfoList(
    userDevices: UserDevices | null
  ): Promise<DeviceInfo[]> {
    const database = getDatabase(this.app);
    const devicesInfoSnapshots = Object.keys(userDevices ?? {}).map(
      (deviceId) => {
        const deviceInfoRef = ref(database, this.getDeviceInfoPath(deviceId));
        return get(deviceInfoRef);
      }
    );

    const devicesList: DeviceInfo[] = await Promise.all(
      devicesInfoSnapshots
    ).then((snapshots) => snapshots.map((snapshot) => snapshot.val()));

    const validDevices = devicesList.filter((device) => !!device);

    validDevices.sort((a, b) => {
      return (
        userDevices[a.deviceId].claimedOn - userDevices[b.deviceId].claimedOn
      );
    });

    return validDevices;
  }

  public async hasDevicePermission(deviceId: string): Promise<boolean> {
    const deviceInfoPath = this.getDeviceInfoPath(deviceId);
    const database = getDatabase(this.app);
    const deviceInfoRef = ref(database, deviceInfoPath);

    const hasPermission = await get(deviceInfoRef)
      .then(() => true)
      .catch(() => false);

    return hasPermission;
  }

  private getDeviceClaimedByPath(deviceId: string): string {
    return `devices/${deviceId}/status/claimedBy`;
  }

  private getUserClaimedDevicePath(deviceId: string): string {
    const userId = this.user.uid;
    return `users/${userId}/devices/${deviceId}`;
  }

  private getUserDevicesPath(): string {
    const userId = this.user.uid;
    return `users/${userId}/devices`;
  }

  private getUserClaimsUpdatedOnPath(): string {
    const userId = this.user.uid;
    return `users/${userId}/claimsUpdatedOn`;
  }

  private getDeviceInfoPath(deviceId: string): string {
    return `devices/${deviceId}/info`;
  }

  onUserExperiments(): Observable<Experiment[]> {
    return this.onAuthStateChanged().pipe(
      switchMap((user) => {
        if (!user) {
          return EMPTY;
        }

        const userId = this.user.uid;

        const database = getDatabase(this.app);
        const userExperimentsRef = query(
          ref(database, "experiments"),
          orderByChild("userId"),
          equalTo(userId),
          limitToFirst(100)
        );

        return fromEventPattern(
          (handler) =>
            onValue(userExperimentsRef, (snapshot: DataSnapshot) =>
              handler(snapshot)
            ),
          (handler) => off(userExperimentsRef)
        ).pipe(
          map((snapshot: DataSnapshot) => snapshot.val()),
          // transform experiments map into sorted list
          map((experimentsMaps): Experiment[] => {
            return Object.entries(experimentsMaps ?? {})
              .map(([id, value]: any) => ({
                id: value?.id ?? id,
                ...value
              }))
              .sort(
                (a: any, b: any): any =>
                  new Date(b?.timestamp).getTime() -
                  new Date(a?.timestamp).getTime()
              );
          })
        );
      })
    );
  }

  async deleteUserExperiment(experimentId: string): Promise<void> {
    if (!experimentId) {
      return Promise.reject(
        `deleteUserExperiment: please provide an experiment id`
      );
    }

    const removeExperiment = (experimentId: string) => {
      const database = getDatabase(this.app);
      const experimentRef = ref(database, `experiments/${experimentId}`);
      return remove(experimentRef);
    };

    const removeRelations = (experimentId: string) => {
      const functions = getFunctions(this.app);
      const removeRelationsFn = httpsCallable(functions, "removeRelations");
      return removeRelationsFn({
        experimentId
      });
    };

    await Promise.all([
      removeExperiment(experimentId),
      removeRelations(experimentId)
    ]).catch(() => {});
  }
}
