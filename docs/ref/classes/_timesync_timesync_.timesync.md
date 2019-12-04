---
id: "_timesync_timesync_.timesync"
title: "Timesync"
sidebar_label: "Timesync"
---

[@neurosity/notion](../index.md) › [Globals](../globals.md) › ["timesync/Timesync"](../modules/_timesync_timesync_.md) › [Timesync](_timesync_timesync_.timesync.md)

## Hierarchy

* **Timesync**

## Index

### Constructors

* [constructor](_timesync_timesync_.timesync.md#constructor)

### Properties

* [_offset](_timesync_timesync_.timesync.md#_offset)
* [options](_timesync_timesync_.timesync.md#options)

### Accessors

* [offset](_timesync_timesync_.timesync.md#offset)
* [timestamp](_timesync_timesync_.timesync.md#timestamp)

### Methods

* [average](_timesync_timesync_.timesync.md#private-average)
* [filterOutliers](_timesync_timesync_.timesync.md#filteroutliers)
* [starTimer](_timesync_timesync_.timesync.md#private-startimer)
* [toOffset](_timesync_timesync_.timesync.md#tooffset)

## Constructors

###  constructor

\+ **new Timesync**(`options`: [Options](../modules/_timesync_timesync_.md#options)): *[Timesync](_timesync_timesync_.timesync.md)*

*Defined in [timesync/Timesync.ts:19](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L19)*

**Parameters:**

Name | Type |
------ | ------ |
`options` | [Options](../modules/_timesync_timesync_.md#options) |

**Returns:** *[Timesync](_timesync_timesync_.timesync.md)*

## Properties

###  _offset

• **_offset**: *number* = 0

*Defined in [timesync/Timesync.ts:19](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L19)*

___

###  options

• **options**: *[Options](../modules/_timesync_timesync_.md#options)*

*Defined in [timesync/Timesync.ts:18](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L18)*

## Accessors

###  offset

• **get offset**(): *number*

*Defined in [timesync/Timesync.ts:88](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L88)*

**Returns:** *number*

___

###  timestamp

• **get timestamp**(): *number*

*Defined in [timesync/Timesync.ts:92](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L92)*

**Returns:** *number*

## Methods

### `Private` average

▸ **average**(`list`: number[]): *number*

*Defined in [timesync/Timesync.ts:82](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L82)*

**Parameters:**

Name | Type |
------ | ------ |
`list` | number[] |

**Returns:** *number*

___

###  filterOutliers

▸ **filterOutliers**(): *UnaryFunction‹Observable‹number[]›, Observable‹number[]››*

*Defined in [timesync/Timesync.ts:50](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L50)*

**Returns:** *UnaryFunction‹Observable‹number[]›, Observable‹number[]››*

___

### `Private` starTimer

▸ **starTimer**(): *void*

*Defined in [timesync/Timesync.ts:30](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L30)*

**Returns:** *void*

___

###  toOffset

▸ **toOffset**(): *UnaryFunction‹Observable‹unknown›, Observable‹number››*

*Defined in [timesync/Timesync.ts:60](https://github.com/neurosity/notion-js/blob/58d781f/src/timesync/Timesync.ts#L60)*

**Returns:** *UnaryFunction‹Observable‹unknown›, Observable‹number››*
