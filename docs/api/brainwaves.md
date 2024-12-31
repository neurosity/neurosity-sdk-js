---
id: brainwaves
title: Brainwaves
---

The brainwaves API is what we always wished for when it came to inventing the future: an easy way to get lossless brainwaves. Sometimes we wanted to manipulate the raw data and other times we wanted to analyze the power in each frequency bin. With brainwaves, our goal is to enable new APIs and powerful programs to be built. We expect that someone working with the brainwaves API has a bit of experience working with EEG data or a strong desire to learn.

## Sampling Rate

The sampling rate will vary depending on the model of your device.

- Crown -> `256Hz`
- Notion 2 -> `250Hz`
- Notion 1 -> `250Hz`

A sampling rate of `250Hz` means the data contains `250` samples per second.

## Metrics

There are four brainwaves metrics:

- raw
- rawUnfiltered
- psd
- powerByBand

### Raw

The `raw` brainwaves parameter emits events of 16 samples for Crown and 25 for Notion 1 and 2. We call these groups of samples Epochs. Each epoch includes an info object with sampling rate, start time, notch frequency, and channel names.

```js
const neurosity = new Neurosity();

neurosity.brainwaves("raw").subscribe((brainwaves) => {
  console.log(brainwaves);
});
```

The code above will output new epochs of 16 samples approximately every 62.5ms. Here's an example of 1 event:

```js
{
  data: [
    // Array of samples per channel
    [/* channel 1 samples */],
    [/* channel 2 samples */],
    // ... more channels
  ],
  info: {
    channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
    notchFrequency: "60Hz",
    samplingRate: 256,
    startTime: 1628194299499
  }
}
```

Epochs are pre-filtered on the device's Operating System to give you the cleanest data possible with maximum performance. These filters include:

- Notch of `50Hz` or `60Hz` and a bandwidth of `1`.
- Bandpass with cutoff between `2Hz` and `45Hz`.

The order of these filters is set to `2`, and the characteristic used is `butterworth`.

To apply your own filters, you can use the `rawUnfiltered` brainwaves parameter (see next section) and use the [Neurosity Pipes](https://github.com/neurosity/eeg-pipes) library for fine-grained customization.

### Raw Unfiltered

The unfiltered raw data follows the same shape as the `raw` data option, just without signal filters applied. The info object includes sampling rate, start time, and channel names, but no notch frequency since no filtering is applied.

```js
const neurosity = new Neurosity();

neurosity.brainwaves("rawUnfiltered").subscribe((brainwaves) => {
  console.log(brainwaves);
});
```

Example output:

```js
{
  data: [
    // Array of samples per channel
    [/* channel 1 samples */],
    [/* channel 2 samples */],
    // ... more channels
  ],
  info: {
    channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
    samplingRate: 256,
    startTime: 1628194299499
  }
}
```

### Power Spectral Density (PSD)

The PSD metric provides frequency domain information about the signal. Each event includes the PSD values, frequency bins, and an info object with sampling rate, start time, notch frequency, and channel names.

```js
const neurosity = new Neurosity();

neurosity.brainwaves("psd").subscribe((brainwaves) => {
  console.log(brainwaves);
});
```

Example output:

```js
{
  label: "psd",
  psd: [
    // PSD values per channel
    [/* channel 1 PSD values */],
    [/* channel 2 PSD values */],
    // ... more channels
  ],
  freqs: [
    0, 2, 4, 6, 8, 10, /* ... frequency bins up to 126Hz */
  ],
  info: {
    channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
    notchFrequency: "60Hz",
    samplingRate: 256,
    startTime: 1628194299499
  }
}
```

### Power by Band

The Power by Band metric provides the average power in each frequency band (delta, theta, alpha, beta, gamma) across all channels. The info object includes sampling rate, start time, and channel names to provide context for the power values.

```js
const neurosity = new Neurosity();

neurosity.brainwaves("powerByBand").subscribe((brainwaves) => {
  console.log(brainwaves);
});
```

Example output:

```js
{
  gamma: [/* power values */],
  beta: [/* power values */],
  alpha: [/* power values */],
  theta: [/* power values */],
  delta: [/* power values */],
  info: {
    channelNames: ["CP3", "C3", "F5", "PO3", "PO4", "F6", "C4", "CP4"],
    samplingRate: 256,
    startTime: 1628194299499
  }
}
```
