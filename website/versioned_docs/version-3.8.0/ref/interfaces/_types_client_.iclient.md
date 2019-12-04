---
id: version-3.8.0-_types_client_.iclient
title: IClient
sidebar_label: IClient
original_id: _types_client_.iclient
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["types/client"](../modules/_types_client_.md) › [IClient](_types_client_.iclient.md)

## Hierarchy

* **IClient**

## Index

### Properties

* [actions](_types_client_.iclient.md#actions)
* [metrics](_types_client_.iclient.md#metrics)
* [skills](_types_client_.iclient.md#skills)
* [timestamp](_types_client_.iclient.md#timestamp)
* [user](_types_client_.iclient.md#user)

### Methods

* [changeSettings](_types_client_.iclient.md#changesettings)
* [disconnect](_types_client_.iclient.md#disconnect)
* [getInfo](_types_client_.iclient.md#getinfo)
* [login](_types_client_.iclient.md#optional-login)
* [offNamespace](_types_client_.iclient.md#offnamespace)
* [onNamespace](_types_client_.iclient.md#onnamespace)

## Properties

###  actions

• **actions**: *[IActions](_types_actions_.iactions.md)*

*Defined in [types/client.ts:10](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L10)*

___

###  metrics

• **metrics**: *[IMetrics](_types_metrics_.imetrics.md)*

*Defined in [types/client.ts:16](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L16)*

___

###  skills

• **skills**: *[ISkillsClient](_types_skill_.iskillsclient.md)*

*Defined in [types/client.ts:17](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L17)*

___

###  timestamp

• **timestamp**: *number*

*Defined in [types/client.ts:18](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L18)*

___

###  user

• **user**: *User | null*

*Defined in [types/client.ts:9](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L9)*

## Methods

###  changeSettings

▸ **changeSettings**(`settings`: [ChangeSettings](../modules/_types_settings_.md#changesettings)): *Promise‹void›*

*Defined in [types/client.ts:19](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`settings` | [ChangeSettings](../modules/_types_settings_.md#changesettings) |

**Returns:** *Promise‹void›*

___

###  disconnect

▸ **disconnect**(): *Promise‹any›*

*Defined in [types/client.ts:11](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L11)*

**Returns:** *Promise‹any›*

___

###  getInfo

▸ **getInfo**(): *Promise‹any›*

*Defined in [types/client.ts:12](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L12)*

**Returns:** *Promise‹any›*

___

### `Optional` login

▸ **login**(`credentails`: [Credentials](../modules/_types_credentials_.md#credentials)): *Promise‹any›*

*Defined in [types/client.ts:13](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`credentails` | [Credentials](../modules/_types_credentials_.md#credentials) |

**Returns:** *Promise‹any›*

___

###  offNamespace

▸ **offNamespace**(`namespace`: string, `listener`: Function): *void*

*Defined in [types/client.ts:15](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L15)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`listener` | Function |

**Returns:** *void*

___

###  onNamespace

▸ **onNamespace**(`namespace`: string, `callback`: Function): *Function*

*Defined in [types/client.ts:14](https://github.com/neurosity/notion-js/blob/58d781f/src/types/client.ts#L14)*

**Parameters:**

Name | Type |
------ | ------ |
`namespace` | string |
`callback` | Function |

**Returns:** *Function*
