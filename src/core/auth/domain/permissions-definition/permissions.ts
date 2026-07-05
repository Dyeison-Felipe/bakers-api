import { PermissionAddress } from "./address";
import { PermissionCategory } from "./category";
import { PermissionPlan } from "./plan";
import { PermissionProduct } from "./product";
import { PermissionUser } from "./user";

export type PermissionRef = (typeof Permissions)[keyof typeof Permissions];

export type PermissionActions = PermissionRef['action'];

export type PermissionResources = PermissionRef['resource'];

export type Perm = Record<string, Record<'action' | 'resource', string>>;

export const Permissions = {
  ...PermissionAddress,
  ...PermissionPlan,
  ...PermissionCategory,
  ...PermissionProduct,
  ...PermissionUser,
}