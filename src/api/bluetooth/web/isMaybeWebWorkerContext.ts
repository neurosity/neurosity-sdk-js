declare class WorkerGlobalScope {
  readonly self: WorkerGlobalScope;
}

export const isMaybeWebWorkerContext = (): boolean => {
  try {
    return (
      typeof WorkerGlobalScope !== "undefined" &&
      self instanceof WorkerGlobalScope
    );
  } catch {
    return false;
  }
};
