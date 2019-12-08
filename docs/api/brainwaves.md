---
id: brainwaves
title: Brainwaves
---
The brainwaves API provides lossless [Electroencephalography ("EEG") data](https://en.wikipedia.org/wiki/Electroencephalography), [Fast Fourier Transform ("FFT")](https://en.wikipedia.org/wiki/Fast_Fourier_transform), and [Power Spectral Density ("PSD")](https://en.wikipedia.org/wiki/Spectral_density#Power_spectral_density). 

EEG data can feed Neural Nets and more complex feature extraction methods. FFT and PSD are so commonly used to build metrics across the brain that instead of having you, a developer, implement FFT in every app you use, you can subscribe to the global FFT, saving precious resources for computations that add value to your application. When we want to make a new API such as [calm](docs/api/calm) we'll use this `brainwaves` endpoint. We will then combine that generally with [@neurosity/eeg-pipes](https://github.com/neurosity/eeg-pipes). These provide an incredibly fast way to prototype new research papers. Notion is a platform for implementing EEG research, and NotionJS with EEG-Pipes is the way to do it. Someone working with the brainwaves API has a bit of experience working with raw brainwave data or a strong desire to learn.

## Metrics

There are four metrics:

- frequency
- [`psd`](https://en.wikipedia.org/wiki/Spectral_density#Power_spectral_density)
- raw
- timestamp

```js
const mind = new Notion();

mind.brainwaves().subscribe(brainwaves => {
  console.log(brainwaves);
  /* 
  {
    data: [Number, ... , Number],
    timestamp: Date,
    frequency: [
      [Number, ... , Number]
    ],
    psd: [Number, ... , Number]
  }
  */
});
```

Optionally, metrics can be filtered by adding their comma-separated names.

```js
brainwaves("frequency").subscribe(brainwaves => {
  console.log(brainwaves);
  /* 
  { frequency: [
      [Number, ... , Number]
    ]
  }
  */
});
```

### Raw

Raw data is what comes directly from the analog to digital converter. Note that you will see environmental noise in the signal which should be filtered out. As well as DC drift in the signal that will need to be filtered out for most cases. Raw data is eight channels sampled at 250 Hz, aka samples per second.

### Frequency


### PSD

