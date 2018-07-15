interface IAction {
  command: string;
  action: string;
  message?: any;
}

export default interface IActions {
  dispatch(action: IAction): void;
}
