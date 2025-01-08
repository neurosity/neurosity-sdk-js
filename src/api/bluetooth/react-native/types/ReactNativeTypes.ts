import { EventEmitter } from "events";

/**
 * The React Native implementation of the IOS RCTEventEmitter which is required when creating
 * a module that communicates with IOS
 */
interface NativeModule {
  /**
   * Add the provided eventType as an active listener
   * @param eventType name of the event for which we are registering listener
   */
  addListener: (eventType: string) => void;

  /**
   * Remove a specified number of events.  There are no eventTypes in this case, as
   * the native side doesn't remove the name, but only manages a counter of total
   * listeners
   * @param count number of listeners to remove (of any type)
   */
  removeListeners: (count: number) => void;
}

interface EmitterSubscription {
  remove(): void;
}

/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
export abstract class NativeEventEmitter extends EventEmitter {
  protected nativeModule?: NativeModule;

  constructor(nativeModule?: NativeModule) {
    super();
    this.nativeModule = nativeModule;
  }

  addListener(
    eventType: string | symbol,
    listener: (...args: unknown[]) => void,
    context?: Record<string, unknown>
  ): this {
    super.addListener(eventType, listener);
    return this;
  }

  removeAllListeners(eventType?: string | symbol): this {
    super.removeAllListeners(eventType);
    return this;
  }

  abstract removeSubscription(subscription: EmitterSubscription): void;
}

/**
 * @see https://reactnative.dev/docs/platform-specific-code#content
 */
export type PlatformOSType =
  | "ios"
  | "android"
  | "macos"
  | "windows"
  | "web"
  | "native";

export type BleErrorCode = string;

export class BleManager {
  private options?: { restoring?: boolean };

  constructor(options?: { restoring?: boolean }) {
    this.options = options;
  }
}

export class BleError extends Error {
  errorCode: BleErrorCode;

  constructor(message: string, errorCode: BleErrorCode) {
    super(message);
    this.errorCode = errorCode;
    // Set the prototype explicitly for Error subclasses
    Object.setPrototypeOf(this, BleError.prototype);
  }
}
