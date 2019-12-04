---
id: version-3.8.0-_notionondevice_
title: NotionOnDevice
sidebar_label: NotionOnDevice
original_id: _notionondevice_
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["NotionOnDevice"](_notionondevice_.md)

## Index

### Interfaces

* [IOnDeviceOptions](../interfaces/_notionondevice_.iondeviceoptions.md)

### Type aliases

* [INotionOnDevice](_notionondevice_.md#inotionondevice)

### Functions

* [createNotionOnDevice](_notionondevice_.md#createnotionondevice)

## Type aliases

###  INotionOnDevice

Ƭ **INotionOnDevice**: *Pick‹[INotion](../interfaces/_types_notion_.inotion.md), Exclude‹keyof INotion, "skill"››*

*Defined in [NotionOnDevice.ts:6](https://github.com/neurosity/notion-js/blob/58d781f/src/NotionOnDevice.ts#L6)*

## Functions

###  createNotionOnDevice

▸ **createNotionOnDevice**(`options`: [IOnDeviceOptions](../interfaces/_notionondevice_.iondeviceoptions.md)): *Promise‹[[INotionOnDevice](_notionondevice_.md#inotionondevice), [ISkillInstance](../interfaces/_types_skill_.iskillinstance.md)]›*

*Defined in [NotionOnDevice.ts:16](https://github.com/neurosity/notion-js/blob/58d781f/src/NotionOnDevice.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [IOnDeviceOptions](../interfaces/_notionondevice_.iondeviceoptions.md) |

**Returns:** *Promise‹[[INotionOnDevice](_notionondevice_.md#inotionondevice), [ISkillInstance](../interfaces/_types_skill_.iskillinstance.md)]›*
