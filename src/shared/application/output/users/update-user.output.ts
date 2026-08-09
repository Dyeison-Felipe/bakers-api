import { PermissionsOutput } from "../permissions/permission.output";
import { RoleOutput } from "../role/role.output";

export type UpdateUserOutput = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: RoleOutput;
  permissions: PermissionsOutput[];
}
