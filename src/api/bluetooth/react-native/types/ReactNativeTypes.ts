// This is a subset of React Native's types
// EmitterSubscription
// EventSubscription
// EventSubscriptionVendor
// EventEmitter
// NativeModule
// NativeEventEmitter
// PlatformOSType

// Type definitions for react-native 0.70
// Project: https://github.com/facebook/react-native
// Definitions by: Eloy Durán <https://github.com/alloy>
//                 HuHuanming <https://github.com/huhuanming>
//                 Kyle Roach <https://github.com/iRoachie>
//                 Tim Wang <https://github.com/timwangdev>
//                 Kamal Mahyuddin <https://github.com/kamal>
//                 Alex Dunne <https://github.com/alexdunne>
//                 Manuel Alabor <https://github.com/swissmanu>
//                 Michele Bombardi <https://github.com/bm-software>
//                 Martin van Dam <https://github.com/mvdam>
//                 Kacper Wiszczuk <https://github.com/esemesek>
//                 Ryan Nickel <https://github.com/mrnickel>
//                 Souvik Ghosh <https://github.com/souvik-ghosh>
//                 Cheng Gibson <https://github.com/nossbigg>
//                 Saransh Kataria <https://github.com/saranshkataria>
//                 Wojciech Tyczynski <https://github.com/tykus160>
//                 Jake Bloom <https://github.com/jakebloom>
//                 Ceyhun Ozugur <https://github.com/ceyhun>
//                 Mike Martin <https://github.com/mcmar>
//                 Theo Henry de Villeneuve <https://github.com/theohdv>
//                 Romain Faust <https://github.com/romain-faust>
//                 Be Birchall <https://github.com/bebebebebe>
//                 Jesse Katsumata <https://github.com/Naturalclar>
//                 Xianming Zhong <https://github.com/chinesedfan>
//                 Valentyn Tolochko <https://github.com/vtolochk>
//                 Sergey Sychev <https://github.com/SychevSP>
//                 Daiki Ihara <https://github.com/sasurau4>
//                 Abe Dolinger <https://github.com/256hz>
//                 Dominique Richard <https://github.com/doumart>
//                 Mohamed Shaban <https://github.com/drmas>
//                 Jérémy Barbet <https://github.com/jeremybarbet>
//                 David Sheldrick <https://github.com/ds300>
//                 Natsathorn Yuthakovit <https://github.com/natsathorn>
//                 ConnectDotz <https://github.com/connectdotz>
//                 Alexey Molchan <https://github.com/alexeymolchan>
//                 Alex Brazier <https://github.com/alexbrazier>
//                 Arafat Zahan <https://github.com/kuasha420>
//                 Pedro Hernández <https://github.com/phvillegas>
//                 Sebastian Silbermann <https://github.com/eps1lon>
//                 Zihan Chen <https://github.com/ZihanChen-MSFT>
//                 Lorenzo Sciandra <https://github.com/kelset>
//                 Mateusz Wit <https://github.com/MateWW>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 3.0

/**
 * EmitterSubscription represents a subscription with listener and context data.
 */
interface EmitterSubscription extends EventSubscription {
  emitter: EventEmitter;
  listener: () => any;
  context: any;

  /**
   * @param emitter - The event emitter that registered this
   *   subscription
   * @param subscriber - The subscriber that controls
   *   this subscription
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  new (
    emitter: EventEmitter,
    subscriber: EventSubscriptionVendor,
    listener: () => any,
    context: any
  ): EmitterSubscription;

  /**
   * Removes this subscription from the emitter that registered it.
   * Note: we're overriding the `remove()` method of EventSubscription here
   * but deliberately not calling `super.remove()` as the responsibility
   * for removing the subscription lies with the EventEmitter.
   */
  remove(): void;
}

/**
 * EventSubscription represents a subscription to a particular event. It can
 * remove its own subscription.
 */
interface EventSubscription {
  eventType: string;
  key: number;
  subscriber: EventSubscriptionVendor;

  /**
   * @param subscriber the subscriber that controls
   *   this subscription.
   */
  new (subscriber: EventSubscriptionVendor): EventSubscription;

  /**
   * Removes this subscription from the subscriber that controls it.
   */
  remove(): void;
}

/**
 * EventSubscriptionVendor stores a set of EventSubscriptions that are
 * subscribed to a particular event type.
 */
declare class EventSubscriptionVendor {
  constructor();

  /**
   * Adds a subscription keyed by an event type.
   *
   */
  addSubscription(
    eventType: string,
    subscription: EventSubscription
  ): EventSubscription;

  /**
   * Removes a bulk set of the subscriptions.
   *
   * @param eventType - Optional name of the event type whose
   *   registered supscriptions to remove, if null remove all subscriptions.
   */
  removeAllSubscriptions(eventType?: string): void;

  /**
   * Removes a specific subscription. Instead of calling this function, call
   * `subscription.remove()` directly.
   *
   */
  removeSubscription(subscription: any): void;

  /**
   * Returns the array of subscriptions that are currently registered for the
   * given event type.
   *
   * Note: This array can be potentially sparse as subscriptions are deleted
   * from it when they are removed.
   *
   */
  getSubscriptionsForType(eventType: string): EventSubscription[];
}

declare class EventEmitter {
  /**
   *
   * @param subscriber - Optional subscriber instance
   *   to use. If omitted, a new subscriber will be created for the emitter.
   */
  constructor(subscriber?: EventSubscriptionVendor | null);

  /**
   * Adds a listener to be invoked when events of the specified type are
   * emitted. An optional calling context may be provided. The data arguments
   * emitted will be passed to the listener function.
   *
   * @param eventType - Name of the event to listen to
   * @param listener - Function to invoke when the specified event is
   *   emitted
   * @param context - Optional context object to use when invoking the
   *   listener
   */
  addListener(
    eventType: string,
    listener: (...args: any[]) => any,
    context?: any
  ): EmitterSubscription;

  /**
   * Removes all of the registered listeners, including those registered as
   * listener maps.
   *
   * @param eventType - Optional name of the event whose registered
   *   listeners to remove
   */
  removeAllListeners(eventType?: string): void;

  /**
   * Returns the number of listeners that are currently registered for the given
   * event.
   *
   * @param eventType - Name of the event to query
   */
  listenerCount(eventType: string): number;

  /**
   * Emits an event of the given type with the given data. All handlers of that
   * particular type will be notified.
   *
   * @param eventType - Name of the event to emit
   * @param Arbitrary arguments to be passed to each registered listener
   *
   * @example
   *   emitter.addListener('someEvent', function(message) {
   *     console.log(message);
   *   });
   *
   *   emitter.emit('someEvent', 'abc'); // logs 'abc'
   */
  emit(eventType: string, ...params: any[]): void;
}

/**
 * The React Native implementation of the IOS RCTEventEmitter which is required when creating
 * a module that communicates with IOS
 */
type NativeModule = {
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
};

/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
export declare class NativeEventEmitter extends EventEmitter {
  /**
   * @param nativeModule the NativeModule implementation.  This is required on IOS and will throw
   *      an invariant error if undefined.
   */
  constructor(nativeModule?: NativeModule);

  /**
   * Add the specified listener, this call passes through to the NativeModule
   * addListener
   *
   * @param eventType name of the event for which we are registering listener
   * @param listener the listener function
   * @param context context of the listener
   */
  addListener(
    eventType: string,
    listener: (event: any) => void,
    context?: Object
  ): EmitterSubscription;

  /**
   * @param eventType  name of the event whose registered listeners to remove
   */
  removeAllListeners(eventType: string): void;

  /**
   * Removes a subscription created by the addListener, the EventSubscription#remove()
   * function actually calls through to this.
   */
  removeSubscription(subscription: EmitterSubscription): void;
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
