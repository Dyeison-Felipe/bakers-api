export type CreatePlanInput= {
  name: string;
  description: string;
  price: number;
  duration: number;
  permissionIds: string[]
}