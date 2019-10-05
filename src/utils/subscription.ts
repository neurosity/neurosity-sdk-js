import { metrics } from "@neurosity/ipk";
import IOptions from "../types/options";

export const getLabels = (metric: string): string[] =>
  Object.keys(metrics[metric]);

export const hasInvalidLabels = (
  metric: string,
  labels: string[]
): boolean => {
  const validLabels = getLabels(metric);
  return !labels.every(label => validLabels.includes(label));
};

export const isMetricDisallowed = (
  metricName: string,
  options: IOptions
): boolean =>
  "skill" in options &&
  "metrics" in options.skill &&
  !options.skill.metrics.includes(metricName);

export const validate = (
  metric: string,
  labels: string[],
  options: IOptions
): Error | false => {
  const validLabels = getLabels(metric).join(", ");

  if (!labels.length) {
    return new Error(
      `At least one label is required for ${metric} metric. Please add one of the following labels: ${validLabels}`
    );
  }

  if (isMetricDisallowed(metric, options)) {
    return new Error(
      `No permission to access the ${metric} metric. To access this metric, edit the skill's permissions`
    );
  }

  if (hasInvalidLabels(metric, labels)) {
    return new Error(
      `One ore more labels provided to ${metric} are invalid. The valid labels for ${metric} are ${validLabels}`
    );
  }

  return false;
};
