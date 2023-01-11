import { metrics } from "@neurosity/ipk";

import * as errors from "../utils/errors.js";
import { SDKOptions } from "../types/options.js";

export const isMetric = (metric: string): boolean =>
  Object.keys(metrics).includes(metric);

export const getLabels = (metric: string): string[] =>
  Object.keys(metrics[metric]);

export const hasInvalidLabels = (metric: string, labels: string[]): boolean => {
  const validLabels = getLabels(metric);
  return !labels.every((label) => validLabels.includes(label));
};

export const validate = (
  metric: string,
  labels: string[],
  options: SDKOptions
): Error | false => {
  const validLabels = getLabels(metric).join(", ");

  if (!labels.length) {
    return new Error(
      `${errors.prefix}At least one label is required for ${metric} metric. Please add one of the following labels: ${validLabels}`
    );
  }

  if (hasInvalidLabels(metric, labels)) {
    return new Error(
      `${errors.prefix}One ore more labels provided to ${metric} are invalid. The valid labels for ${metric} are ${validLabels}`
    );
  }

  return false;
};
