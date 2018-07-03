interface IAction {
  command: string;
  action: string;
  message?: any;
}

export default interface IActions {
  on(callback: (action: IAction) => void): void;
  dispatch(action: IAction): void;
}
