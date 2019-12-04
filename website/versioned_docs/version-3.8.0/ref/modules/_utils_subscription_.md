---
id: version-3.8.0-_utils_subscription_
title: utils/subscription
sidebar_label: utils/subscription
original_id: _utils_subscription_
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["utils/subscription"](_utils_subscription_.md)

## Index

### Functions

* [getLabels](_utils_subscription_.md#const-getlabels)
* [hasInvalidLabels](_utils_subscription_.md#const-hasinvalidlabels)
* [isMetricDisallowed](_utils_subscription_.md#const-ismetricdisallowed)
* [validate](_utils_subscription_.md#const-validate)

## Functions

### `Const` getLabels

▸ **getLabels**(`metric`: string): *string[]*

*Defined in [utils/subscription.ts:4](https://github.com/neurosity/notion-js/blob/58d781f/src/utils/subscription.ts#L4)*

**Parameters:**

Name | Type |
------ | ------ |
`metric` | string |

**Returns:** *string[]*

___

### `Const` hasInvalidLabels

▸ **hasInvalidLabels**(`metric`: string, `labels`: string[]): *boolean*

*Defined in [utils/subscription.ts:7](https://github.com/neurosity/notion-js/blob/58d781f/src/utils/subscription.ts#L7)*

**Parameters:**

Name | Type |
------ | ------ |
`metric` | string |
`labels` | string[] |

**Returns:** *boolean*

___

### `Const` isMetricDisallowed

▸ **isMetricDisallowed**(`metricName`: string, `options`: [IOptions](../interfaces/_types_options_.ioptions.md)): *boolean*

*Defined in [utils/subscription.ts:15](https://github.com/neurosity/notion-js/blob/58d781f/src/utils/subscription.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`metricName` | string |
`options` | [IOptions](../interfaces/_types_options_.ioptions.md) |

**Returns:** *boolean*

___

### `Const` validate

▸ **validate**(`metric`: string, `labels`: string[], `options`: [IOptions](../interfaces/_types_options_.ioptions.md)): *Error | false*

*Defined in [utils/subscription.ts:23](https://github.com/neurosity/notion-js/blob/58d781f/src/utils/subscription.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`metric` | string |
`labels` | string[] |
`options` | [IOptions](../interfaces/_types_options_.ioptions.md) |

**Returns:** *Error | false*
