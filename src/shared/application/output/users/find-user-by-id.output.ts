import { CompanyOutput } from "../company/company.output";

export type PermissionRefOutput = {
  action: string;
  subject: string;
}

export type FindByUserId = {
  id: string;
  role: string;
  username: string;
  email: string;
  permissions?: PermissionRefOutput[]
}
