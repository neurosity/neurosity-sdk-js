const self: any = this;

export const isMaybeWebWorkerContext = (): boolean => {
  return self && self?.document === undefined;
};
