---
id: recording
title: Recording
---

Record raw brainwave data for a specified duration. The recording is saved as a dataset in cloud storage with a metadata record in Firestore.

If the device loses network connectivity during or after recording, the data is saved locally on the device and uploaded automatically when connectivity is restored.

## Basic Usage

```js
import { Neurosity } from "@neurosity/sdk";

const neurosity = new Neurosity();

const result = await neurosity.record({
  label: "eyes-closed",
  duration: 60000 // 1 minute in milliseconds
});

console.log(result.id); // Firestore record ID
```

## All Options

```js
const result = await neurosity.record({
  name: "Morning focus session",
  label: "focus-training",
  duration: 120000, // 2 minutes
  experimentId: "experiment-001"
});

console.log(result);
// { ok: true, id: "abc123", cloudUpload: true }
```

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `label` | `string` | Yes | Label for categorization (e.g. "eyes-closed") |
| `duration` | `number` | Yes | Duration in milliseconds (max 30 minutes) |
| `name` | `string` | No | Human-readable name (defaults to label) |
| `experimentId` | `string` | No | Experiment identifier for grouping recordings |

## Result

| Property | Type | Description |
|----------|------|-------------|
| `ok` | `boolean` | Whether the recording was saved successfully |
| `id` | `string` | Firestore memory record ID |
| `cloudUpload` | `boolean` | Whether the recording was uploaded to cloud storage |

## Offline Resilience

Recordings are saved locally on the device before uploading to the cloud. If the network is unavailable:

1. The recording data is saved to local storage on the device
2. When connectivity is restored, the device automatically uploads the recording
3. A Firestore metadata record is created with the correct timestamp

This ensures no recording data is lost, even during network outages or device reboots.
