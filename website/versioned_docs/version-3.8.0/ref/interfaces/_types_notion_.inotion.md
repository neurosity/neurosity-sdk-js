---
id: version-3.8.0-_types_notion_.inotion
title: INotion
sidebar_label: INotion
original_id: _types_notion_.inotion
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["types/notion"](../modules/_types_notion_.md) › [INotion](_types_notion_.inotion.md)

## Hierarchy

* **INotion**

## Implemented by

* [Notion](../classes/_notion_.notion.md)

## Index

### Properties

* [training](_types_notion_.inotion.md#training)

### Methods

* [addMarker](_types_notion_.inotion.md#addmarker)
* [awareness](_types_notion_.inotion.md#awareness)
* [brainwaves](_types_notion_.inotion.md#brainwaves)
* [calm](_types_notion_.inotion.md#calm)
* [changeSettings](_types_notion_.inotion.md#changesettings)
* [channelAnalysis](_types_notion_.inotion.md#channelanalysis)
* [disconnect](_types_notion_.inotion.md#disconnect)
* [emotion](_types_notion_.inotion.md#emotion)
* [focus](_types_notion_.inotion.md#focus)
* [getInfo](_types_notion_.inotion.md#getinfo)
* [kinesis](_types_notion_.inotion.md#kinesis)
* [login](_types_notion_.inotion.md#login)
* [predictions](_types_notion_.inotion.md#predictions)
* [settings](_types_notion_.inotion.md#settings)
* [signalQuality](_types_notion_.inotion.md#signalquality)
* [skill](_types_notion_.inotion.md#skill)
* [status](_types_notion_.inotion.md#status)

## Properties

###  training

• **training**: *[ITraining](_types_training_.itraining.md)*

*Defined in [types/notion.ts:24](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L24)*

## Methods

###  addMarker

▸ **addMarker**(`label`: string): *void*

*Defined in [types/notion.ts:8](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L8)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |

**Returns:** *void*

___

###  awareness

▸ **awareness**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Defined in [types/notion.ts:9](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

___

###  brainwaves

▸ **brainwaves**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Defined in [types/notion.ts:10](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L10)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

___

###  calm

▸ **calm**(): *Observable‹any›*

*Defined in [types/notion.ts:11](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L11)*

**Returns:** *Observable‹any›*

___

###  changeSettings

▸ **changeSettings**(`settings`: [ChangeSettings](../modules/_types_settings_.md#changesettings)): *Promise‹void›*

*Defined in [types/notion.ts:23](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`settings` | [ChangeSettings](../modules/_types_settings_.md#changesettings) |

**Returns:** *Promise‹void›*

___

###  channelAnalysis

▸ **channelAnalysis**(): *Observable‹any›*

*Defined in [types/notion.ts:12](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L12)*

**Returns:** *Observable‹any›*

___

###  disconnect

▸ **disconnect**(): *Promise‹any›*

*Defined in [types/notion.ts:25](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L25)*

**Returns:** *Promise‹any›*

___

###  emotion

▸ **emotion**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Defined in [types/notion.ts:13](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

___

###  focus

▸ **focus**(): *Observable‹any›*

*Defined in [types/notion.ts:14](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L14)*

**Returns:** *Observable‹any›*

___

###  getInfo

▸ **getInfo**(): *Promise‹any›*

*Defined in [types/notion.ts:15](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L15)*

**Returns:** *Promise‹any›*

___

###  kinesis

▸ **kinesis**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Defined in [types/notion.ts:17](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L17)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

___

###  login

▸ **login**(`credentails`: [Credentials](../modules/_types_credentials_.md#credentials)): *Promise‹any›*

*Defined in [types/notion.ts:16](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`credentails` | [Credentials](../modules/_types_credentials_.md#credentials) |

**Returns:** *Promise‹any›*

___

###  predictions

▸ **predictions**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Defined in [types/notion.ts:18](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L18)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

___

###  settings

▸ **settings**(): *Observable‹[Settings](../modules/_types_settings_.md#settings)›*

*Defined in [types/notion.ts:19](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L19)*

**Returns:** *Observable‹[Settings](../modules/_types_settings_.md#settings)›*

___

###  signalQuality

▸ **signalQuality**(): *Observable‹any›*

*Defined in [types/notion.ts:20](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L20)*

**Returns:** *Observable‹any›*

___

###  skill

▸ **skill**(`id`: string): *Promise‹[ISkillInstance](_types_skill_.iskillinstance.md)›*

*Defined in [types/notion.ts:22](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L22)*

**Parameters:**

Name | Type |
------ | ------ |
`id` | string |

**Returns:** *Promise‹[ISkillInstance](_types_skill_.iskillinstance.md)›*

___

###  status

▸ **status**(): *Observable‹any›*

*Defined in [types/notion.ts:21](https://github.com/neurosity/notion-js/blob/58d781f/src/types/notion.ts#L21)*

**Returns:** *Observable‹any›*
