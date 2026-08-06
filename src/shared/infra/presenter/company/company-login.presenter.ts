export class CompanyLoginPlanPermissionPresenter {
  readonly action: string;
  readonly subject: string;
}

export class CompanyLoginPlanPresenter {
  readonly id: string;
  readonly name: string;
  readonly permissions: CompanyLoginPlanPermissionPresenter[];
}

export class CompanyLoginPresenter {
  readonly id: string;
  readonly cnpj: string;
  readonly stateRegistration: string;
  readonly fantasyName: string;
  readonly socialReazon: string;
  readonly plan: CompanyLoginPlanPresenter;
}
