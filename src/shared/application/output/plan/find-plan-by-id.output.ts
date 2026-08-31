import { PermissionsOutput } from "../permissions/permission.output";

export type FindPlanByIdOutput = {
  id: string,
  name: string,
  description: string,
  price: number,
  active: boolean,
  duration: number;
  permissions: PermissionsOutput[]
}
