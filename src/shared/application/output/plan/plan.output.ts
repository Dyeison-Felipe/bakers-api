export type PlanOutput = {
  id: string,
  name: string,
  description: string,
  features: string[],
  price: number,
  active: boolean,
  duration: number;
  userLimit: number | null;
}