/**
 * @hidden
 */
export interface Action {
  command: string;
  action: string;
  message?: any;
  responseRequired?: boolean;
  responseTimeout?: number;
}

/**
 * @hidden
 */
export interface Actions {
  dispatch(action: Action): Promise<any>;
}
