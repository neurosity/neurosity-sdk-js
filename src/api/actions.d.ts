interface IAction {
  command: string;
  action: string;
  message?: any;
  responseRequired?: boolean;
}

export default interface IActions {
  dispatch(action: IAction): Promise<any>;
}
