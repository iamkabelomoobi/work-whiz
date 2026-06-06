export interface IBaseRegister {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export type IAdminRegister = IBaseRegister;

export interface ICandidateRegister extends IBaseRegister {
  title: string;
}

export interface IEmployerRegister extends IBaseRegister {
  industry: string;
}
