export interface ISkill {
  install(): Promise<any>;
  uninstall(): Promise<any>;
}
