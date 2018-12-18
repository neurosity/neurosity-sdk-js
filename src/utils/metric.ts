import { metrics } from "@neurosity/ipk";

export const getMetricLabels = (metric): Array<string> =>
  Object.keys(metrics[metric]);

export const hasInvalidLabels = (metric, labels): boolean => {
  const validLabels = getMetricLabels(metric);
  return !labels.every(label => validLabels.includes(label));
};

export const isMetricDisallowed = (metricName, options): boolean =>
  !options.metricsAllowed.includes(metricName);

export const validateMetric = (
  metric,
  labels,
  options
): Error | false => {
  if (isMetricDisallowed(metric, options)) {
    return new Error(
      `No permission to access the ${metric} metric. To access this metric, edit the skill's permissions`
    );
  }

  if (hasInvalidLabels(metric, labels)) {
    const validLabels = getMetricLabels(metric).join(", ");
    return new Error(
      `One ore more labels provided to ${metric} are invalid. The valid labels for ${metric} are ${validLabels}`
    );
  }

  return false;
};
