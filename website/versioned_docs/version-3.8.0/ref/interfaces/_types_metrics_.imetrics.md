---
id: version-3.8.0-_types_metrics_.imetrics
title: IMetrics
sidebar_label: IMetrics
original_id: _types_metrics_.imetrics
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["types/metrics"](../modules/_types_metrics_.md) › [IMetrics](_types_metrics_.imetrics.md)

## Hierarchy

* **IMetrics**

## Index

### Methods

* [next](_types_metrics_.imetrics.md#next)
* [on](_types_metrics_.imetrics.md#on)
* [subscribe](_types_metrics_.imetrics.md#subscribe)
* [unsubscribe](_types_metrics_.imetrics.md#unsubscribe)

## Methods

###  next

▸ **next**(`metricName`: string, `metricValue`: object): *void*

*Defined in [types/metrics.ts:6](https://github.com/neurosity/notion-js/blob/58d781f/src/types/metrics.ts#L6)*

**Parameters:**

Name | Type |
------ | ------ |
`metricName` | string |
`metricValue` | object |

**Returns:** *void*

___

###  on

▸ **on**(`subscription`: [ISubscription](_types_subscription_.isubscription.md), `callback`: Function): *[SubscriptionListener](../modules/_types_metrics_.md#subscriptionlistener)*

*Defined in [types/metrics.ts:7](https://github.com/neurosity/notion-js/blob/58d781f/src/types/metrics.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`subscription` | [ISubscription](_types_subscription_.isubscription.md) |
`callback` | Function |

**Returns:** *[SubscriptionListener](../modules/_types_metrics_.md#subscriptionlistener)*

___

###  subscribe

▸ **subscribe**(`subscription`: [ISubscription](_types_subscription_.isubscription.md)): *[ISubscription](_types_subscription_.isubscription.md)*

*Defined in [types/metrics.ts:11](https://github.com/neurosity/notion-js/blob/58d781f/src/types/metrics.ts#L11)*

**Parameters:**

Name | Type |
------ | ------ |
`subscription` | [ISubscription](_types_subscription_.isubscription.md) |

**Returns:** *[ISubscription](_types_subscription_.isubscription.md)*

___

###  unsubscribe

▸ **unsubscribe**(`subscription`: [ISubscription](_types_subscription_.isubscription.md), `listener`: [SubscriptionListener](../modules/_types_metrics_.md#subscriptionlistener)): *void*

*Defined in [types/metrics.ts:12](https://github.com/neurosity/notion-js/blob/58d781f/src/types/metrics.ts#L12)*

**Parameters:**

Name | Type |
------ | ------ |
`subscription` | [ISubscription](_types_subscription_.isubscription.md) |
`listener` | [SubscriptionListener](../modules/_types_metrics_.md#subscriptionlistener) |

**Returns:** *void*
