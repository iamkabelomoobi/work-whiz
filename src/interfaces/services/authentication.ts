export interface IBaseRegister {
  email: string;
  phone: string;
}

export interface IAdminRegister extends IBaseRegister {
  firstName: string;
  lastName: string;
}

export interface ICandidateRegister extends IBaseRegister {
  firstName: string;
  lastName: string;
  title: string;
}

export interface IEmployerRegister extends IBaseRegister {
  name: string;
  industry: string;
}
