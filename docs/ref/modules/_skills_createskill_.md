---
id: "_skills_createskill_"
title: "skills/createSkill"
sidebar_label: "skills/createSkill"
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["skills/createSkill"](_skills_createskill_.md)

## Index

### Type aliases

* [ISkillApp](_skills_createskill_.md#iskillapp)

### Functions

* [createSkill](_skills_createskill_.md#createskill)

## Type aliases

###  ISkillApp

Ƭ **ISkillApp**: *function*

*Defined in [skills/createSkill.ts:8](https://github.com/neurosity/notion-js/blob/80b48df/src/skills/createSkill.ts#L8)*

#### Type declaration:

▸ (`notion`: [INotionOnDevice](_notionondevice_.md#inotionondevice), `skill`: [ISkillInstance](../interfaces/_types_skill_.iskillinstance.md)): *function*

**Parameters:**

Name | Type |
------ | ------ |
`notion` | [INotionOnDevice](_notionondevice_.md#inotionondevice) |
`skill` | [ISkillInstance](../interfaces/_types_skill_.iskillinstance.md) |

▸ (): *Promise‹void›*

## Functions

###  createSkill

▸ **createSkill**(`app`: [ISkillApp](_skills_createskill_.md#iskillapp)): *object*

*Defined in [skills/createSkill.ts:13](https://github.com/neurosity/notion-js/blob/80b48df/src/skills/createSkill.ts#L13)*

**Parameters:**

Name | Type |
------ | ------ |
`app` | [ISkillApp](_skills_createskill_.md#iskillapp) |

**Returns:** *object*

* **subscribe**(`options`: [IOnDeviceOptions](../interfaces/_notionondevice_.iondeviceoptions.md)): *Promise‹[ISkillSubscription](../interfaces/_types_skill_.iskillsubscription.md)›*
