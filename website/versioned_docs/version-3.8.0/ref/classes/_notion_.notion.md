---
id: version-3.8.0-_notion_.notion
title: Notion
sidebar_label: Notion
original_id: _notion_.notion
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["Notion"](../modules/_notion_.md) › [Notion](_notion_.notion.md)

## Hierarchy

* **Notion**

## Implements

* [INotion](../interfaces/_types_notion_.inotion.md)

## Index

### Constructors

* [constructor](_notion_.notion.md#constructor)

### Accessors

* [training](_notion_.notion.md#training)

### Methods

* [addMarker](_notion_.notion.md#addmarker)
* [awareness](_notion_.notion.md#awareness)
* [brainwaves](_notion_.notion.md#brainwaves)
* [calm](_notion_.notion.md#calm)
* [changeSettings](_notion_.notion.md#changesettings)
* [channelAnalysis](_notion_.notion.md#channelanalysis)
* [disconnect](_notion_.notion.md#disconnect)
* [emotion](_notion_.notion.md#emotion)
* [focus](_notion_.notion.md#focus)
* [getInfo](_notion_.notion.md#getinfo)
* [kinesis](_notion_.notion.md#kinesis)
* [login](_notion_.notion.md#login)
* [logout](_notion_.notion.md#logout)
* [onAuthStateChanged](_notion_.notion.md#onauthstatechanged)
* [predictions](_notion_.notion.md#predictions)
* [settings](_notion_.notion.md#settings)
* [signalQuality](_notion_.notion.md#signalquality)
* [skill](_notion_.notion.md#skill)
* [status](_notion_.notion.md#status)

## Constructors

###  constructor

\+ **new Notion**(`options`: [IOptions](../interfaces/_types_options_.ioptions.md)): *[Notion](_notion_.notion.md)*

*Defined in [Notion.ts:23](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L23)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [IOptions](../interfaces/_types_options_.ioptions.md) |

**Returns:** *[Notion](_notion_.notion.md)*

## Accessors

###  training

• **get training**(): *object*

*Defined in [Notion.ts:281](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L281)*

**Returns:** *object*

Training methods

* **record**(`training`: any): *void*

* **stop**(`training`: any): *void*

* **stopAll**(): *void*

## Methods

###  addMarker

▸ **addMarker**(`label`: string): *void*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:111](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L111)*

Injects an EEG marker to data stream

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`label` | string | Name the label to inject  |

**Returns:** *void*

___

###  awareness

▸ **awareness**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:130](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L130)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

Observable of awareness metric events

___

###  brainwaves

▸ **brainwaves**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:145](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L145)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

Observable of brainwaves metric events

___

###  calm

▸ **calm**(): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:159](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L159)*

**Returns:** *Observable‹any›*

Observable of calm events - awareness/calm alias

___

###  changeSettings

▸ **changeSettings**(`settings`: [ChangeSettings](../modules/_types_settings_.md#changesettings)): *Promise‹void›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:274](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L274)*

**Parameters:**

Name | Type |
------ | ------ |
`settings` | [ChangeSettings](../modules/_types_settings_.md#changesettings) |

**Returns:** *Promise‹void›*

___

###  channelAnalysis

▸ **channelAnalysis**(): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:167](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L167)*

**Returns:** *Observable‹any›*

Observable of channelAnalysis metric events

___

###  disconnect

▸ **disconnect**(): *Promise‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:50](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L50)*

**Returns:** *Promise‹any›*

___

###  emotion

▸ **emotion**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:191](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L191)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

Observable of emotion metric events

___

###  focus

▸ **focus**(): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:224](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L224)*

**Returns:** *Observable‹any›*

Observable of focus events - awareness/focus alias

___

###  getInfo

▸ **getInfo**(): *Promise‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:46](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L46)*

**Returns:** *Promise‹any›*

___

###  kinesis

▸ **kinesis**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:232](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L232)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

Observable of kinesis metric events

___

###  login

▸ **login**(`credentials`: [Credentials](../modules/_types_credentials_.md#credentials)): *Promise‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:34](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`credentials` | [Credentials](../modules/_types_credentials_.md#credentials) |

**Returns:** *Promise‹any›*

___

###  logout

▸ **logout**(): *Promise‹any›*

*Defined in [Notion.ts:38](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L38)*

**Returns:** *Promise‹any›*

___

###  onAuthStateChanged

▸ **onAuthStateChanged**(): *Observable‹any›*

*Defined in [Notion.ts:42](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L42)*

**Returns:** *Observable‹any›*

___

###  predictions

▸ **predictions**(`label`: string, ...`otherLabels`: string[]): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:247](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L247)*

**Parameters:**

Name | Type |
------ | ------ |
`label` | string |
`...otherLabels` | string[] |

**Returns:** *Observable‹any›*

Observable of predictions metric events

___

###  settings

▸ **settings**(): *Observable‹[Settings](../modules/_types_settings_.md#settings)›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:207](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L207)*

Observes last state of `settings` and all subsequent `settings` changes

**Returns:** *Observable‹[Settings](../modules/_types_settings_.md#settings)›*

Observable of `settings` metric events

___

###  signalQuality

▸ **signalQuality**(): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:179](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L179)*

**Returns:** *Observable‹any›*

Observable of signalQuality metric events

___

###  skill

▸ **skill**(`bundleId`: string): *Promise‹[ISkillInstance](../interfaces/_types_skill_.iskillinstance.md)›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:327](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L327)*

Accesses a skill by Bundle ID. Additionally, allows to observe
and push skill metrics

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`bundleId` | string | Bundle ID of skill |

**Returns:** *Promise‹[ISkillInstance](../interfaces/_types_skill_.iskillinstance.md)›*

Skill isntance

___

###  status

▸ **status**(): *Observable‹any›*

*Implementation of [INotion](../interfaces/_types_notion_.inotion.md)*

*Defined in [Notion.ts:263](https://github.com/neurosity/notion-js/blob/58d781f/src/Notion.ts#L263)*

Observes last state of `status` and all subsequent `status` changes

**Returns:** *Observable‹any›*

Observable of `status` metric events
