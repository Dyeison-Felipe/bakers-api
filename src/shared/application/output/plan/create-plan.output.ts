import { PermissionsOutput } from "../permissions/permission.output";

export type CreatePlanOutput = {
  id: string,
  name: string,
  description: string,
  features: string[],
  price: number,
  active: boolean,
  duration: number;
  userLimit: number | null;
  permissions: PermissionsOutput[]
}