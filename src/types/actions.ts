/**
 * @internal
 */
export interface Action {
  command: string;
  action: string;
  message?: any;
  responseRequired?: boolean;
}

/**
 * @internal
 */
export interface Actions {
  dispatch(action: Action): Promise<any>;
}
