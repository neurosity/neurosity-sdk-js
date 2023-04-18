---
id: haptics
title: Haptics
---

The haptics API is the way to communicate to the user without a screen or speaker. There are two haptic motors on both Crown and Notion 2, none on DK1. We assume the number of haptics will change, so our approach to haptic control became a dynamic strategy. Each haptic motor's location is positioned in reference to the 10-10 EEG system used to label the channels of the Crown's EEG sensors. Notion 2 and Crown have haptics at P7 and P8.

<p align="center">
  <img alt="EEG-10-10" src="/img/api/eeg-10-10-dark.png" />
  <br />
  <b>FIG. 1</b><i> International standard for EEG 10-10 channel locations</i>
</p>

A haptic motor location is referenced local to the human head and using the EEG 10-10 chart can pin point exactly where the motor is on the Crown. P7 is on the back left side of the human head from the top down perspective shown in FIG. 1. The outerband passes over both P7 and P8. The motor at P7, compared with electorde 4, is a bit farther away from the midline of the head. P8, on the right side of the outerband, is a bit farther away from the midline of the head compared to electrode 5.

Haptic effects are able to be sent to one or more motors at a time. Sending the commands together starts the effects at the same time on the device. A list of effects may be found on this [SDKs github](https://github.com/neurosity/neurosity-sdk-js/blob/master/src/utils/hapticEffects.ts).

To send one effect to one motor:

```js
const neurosity = new Neurosity();

const effects = neurosity.getHapticEffects();

const result = await neurosity.haptics({
  P8: [effects.strongClick100]
});

console.log(result.status); // prints: complete
```

If you want to combine multiple haptic effects together:

```js
...
await neurosity.haptics({
  P7: [
    effects.transitionRampUpLongSmooth1_0_to_100,
    effects.transitionRampDownLongSmooth1_100_to_0
  ]
});
```

To send effects to multiple haptic motors at once:

```js
...
await neurosity.haptics({
  P7: [
    effects.transitionRampUpLongSmooth1_0_to_100,
    effects.transitionRampDownLongSmooth1_100_to_0
  ],
  P8: [
    effects.transitionRampUpLongSmooth1_0_to_100,
    effects.transitionRampDownLongSmooth1_100_to_0
  ]
});
```

You may queue up to seven (7) effects in one command

```js
...
await neurosity.haptics({
  P7: [
    effects.transitionRampUpLongSmooth1_0_to_100,
    effects.transitionRampDownLongSmooth1_100_to_0,
    effects.transitionRampUpLongSmooth1_0_to_100,
    effects.transitionRampDownLongSmooth1_100_to_0,
    effects.transitionRampUpLongSmooth1_0_to_100,
    effects.transitionRampDownLongSmooth1_100_to_0,
    effects.longDoubleSharpClickStrong1_100
  ]
});
```

**Sources**

Figure 1 - EEG 10-10
Seeck M et al. The standardized EEG electrode array of the IFCN. Clin Neurophysiol (2017), http://dx.doi.org/10.1016/j.clinph.2017.06.254
