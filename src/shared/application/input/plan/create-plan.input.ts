export type CreatePlanInput= {
  name: string;
  description: string;
  features: string[];
  price: number;
  duration: number;
  userLimit: number | null;
  permissionIds: string[]
}