/**
 * @hidden
 */
export interface Action {
  command: string;
  action: string;
  message?: unknown;
  responseRequired?: boolean;
  responseTimeout?: number;
}

/**
 * @hidden
 */
export interface Actions {
  dispatch(action: Action): Promise<unknown>;
}
