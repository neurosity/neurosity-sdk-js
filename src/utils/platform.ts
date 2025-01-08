// Model version constants
export const MODEL_VERSION_1 = "1";
export const MODEL_VERSION_2 = "2";
export const MODEL_VERSION_3 = "3";

// Feature constants
export const FEATURE_HAPTICS = "haptics";
export const FEATURE_ACCEL = "accel";

// Haptic constants
export const HAPTIC_P7 = "P7";
export const HAPTIC_P8 = "P8";

type PlatformFeature = typeof FEATURE_HAPTICS | typeof FEATURE_ACCEL;
type ModelVersion =
  | typeof MODEL_VERSION_1
  | typeof MODEL_VERSION_2
  | typeof MODEL_VERSION_3;
type HapticMotor = typeof HAPTIC_P7 | typeof HAPTIC_P8;

export const platformFeaturesByModelVersion: Record<
  ModelVersion,
  PlatformFeature[]
> = {
  [MODEL_VERSION_1]: [],
  [MODEL_VERSION_2]: [FEATURE_HAPTICS, FEATURE_ACCEL],
  [MODEL_VERSION_3]: [FEATURE_HAPTICS, FEATURE_ACCEL]
};

interface PlatformConfig {
  motorByMotorName?: Record<HapticMotor, unknown[]>;
}

export const platformConfigByModelVersion: Record<
  ModelVersion,
  PlatformConfig
> = {
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

export const supportsHaptics = (modelVersion: ModelVersion): boolean => {
  const platformFeaturesForModel = platformFeaturesByModelVersion[modelVersion];
  return platformFeaturesForModel.includes(FEATURE_HAPTICS);
};

export const supportsAccel = (modelVersion: ModelVersion): boolean => {
  const platformFeaturesForModel = platformFeaturesByModelVersion[modelVersion];
  return platformFeaturesForModel.includes(FEATURE_ACCEL);
};

export const getPlatformHapticMotors = (
  modelVersion: ModelVersion
): Record<HapticMotor, unknown[]> => {
  const platformConfigForModel = platformConfigByModelVersion[modelVersion];
  const platformMotorByMotorName =
    platformConfigForModel?.motorByMotorName ?? {};
  return { ...platformMotorByMotorName };
};
