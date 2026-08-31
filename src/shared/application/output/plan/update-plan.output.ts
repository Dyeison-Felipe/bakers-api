import { PermissionsOutput } from "../permissions/permission.output";

export type UpdatePlanOutput = {
  id: string,
  name: string,
  description: string,
  price: number,
  active: boolean,
  duration: number,
  permissions: PermissionsOutput[]
}