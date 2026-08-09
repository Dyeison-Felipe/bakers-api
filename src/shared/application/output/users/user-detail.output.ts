import { PermissionsOutput } from "../permissions/permission.output";
import { RoleOutput } from "../role/role.output";

export type UserDetailOutput = {
  id: string;
  username: string;
  name: string;
  email: string;
  active: boolean;
  role: RoleOutput;
  permissions: PermissionsOutput[];
}
