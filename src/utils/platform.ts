export const MODEL_VERSION_1 = "1";
export const MODEL_VERSION_2 = "2";
export const MODEL_VERSION_3 = "3";

export const FEATURE_HAPTICS = "haptics";
export const FEATURE_ACCEL = "accel";

export const HAPTIC_P7 = "P7";
export const HAPTIC_P8 = "P8";

export const platformFeaturesByModelVersion = {
  [MODEL_VERSION_1]: [],
  [MODEL_VERSION_2]: [FEATURE_HAPTICS, FEATURE_ACCEL],
  [MODEL_VERSION_3]: [FEATURE_HAPTICS, FEATURE_ACCEL]
};

export const platformConfigByModelVersion = {
  [MODEL_VERSION_1]: {},
  [MODEL_VERSION_2]: {
    motorByMotorName: {
      [HAPTIC_P7]: [],
      [HAPTIC_P8]: []
    }
  },
  [MODEL_VERSION_3]: {
    motorByMotorName: {
      [HAPTIC_P7]: [],
      [HAPTIC_P8]: []
    }
  }
};

export const supportsHaptics = (modelVersion: string): boolean => {
  const platformFeaturesForModel =
    platformFeaturesByModelVersion[modelVersion];
  return platformFeaturesForModel.includes(FEATURE_HAPTICS);
};

export const supportsAccel = (modelVersion: string): boolean => {
  const platformFeaturesForModel =
    platformFeaturesByModelVersion[modelVersion];
  return platformFeaturesForModel.includes(FEATURE_ACCEL);
};

export const getPlatformHapticMotors = (modelVersion: string) => {
  const platformConfigForModel =
    platformConfigByModelVersion[modelVersion];
  const platformMotorByMotorName =
    platformConfigForModel?.motorByMotorName ?? {};
  return { ...platformMotorByMotorName };
};
