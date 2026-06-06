export interface IBaseRegister {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface IAdminRegister extends IBaseRegister {
}

export interface ICandidateRegister extends IBaseRegister {
  title: string;
}

export interface IEmployerRegister extends IBaseRegister {
  industry: string;
}
