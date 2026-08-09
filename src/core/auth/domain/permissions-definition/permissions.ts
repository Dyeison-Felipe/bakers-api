import { PermissionCategory } from "./category";
import { PermissionPlan } from "./plan";
import { PermissionProduct } from "./product";
import { PermissionUser } from "./user";
import { PermissionBatch } from "./batch";
import { PermissionDailyProduction } from "./daily-production";
import { PermissionSale } from "./sale";
import { PermissionCashRegister } from "./cash-register";
import { PermissionExpense } from "./expense";
import { PermissionRecipe } from "./recipe";
import { PermissionCompany } from "./company";

export type PermissionRef = (typeof Permissions)[keyof typeof Permissions];

export type PermissionActions = PermissionRef['action'];

export type PermissionResources = PermissionRef['resource'];

export type Perm = Record<string, Record<'action' | 'resource', string>>;

export const Permissions = {
  ...PermissionPlan,
  ...PermissionCategory,
  ...PermissionProduct,
  ...PermissionUser,
  ...PermissionBatch,
  ...PermissionDailyProduction,
  ...PermissionSale,
  ...PermissionCashRegister,
  ...PermissionExpense,
  ...PermissionRecipe,
  ...PermissionCompany,
}
