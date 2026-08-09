import { RoleOutput } from "../role/role.output";

export type FindAllUsersOutput = {
  id: string;
  username: string;
  name: string;
  email: string;
  active: boolean;
  role: RoleOutput;
}
