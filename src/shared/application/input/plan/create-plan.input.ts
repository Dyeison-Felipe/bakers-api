export type CreatePlanInput= {
  name: string;
  description: string;
  price: number;
  duration: number;
  userLimit: number | null;
  permissionIds: string[]
}