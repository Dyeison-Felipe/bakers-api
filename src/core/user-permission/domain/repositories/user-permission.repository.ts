import { UserPermissionEntity } from "../entities/user-permission.entity";

export interface UserPermissionRepository {
  create(entity: UserPermissionEntity):Promise<UserPermissionEntity>;
  findAllPermissionByUser(userId: string): Promise<UserPermissionEntity[]>;
  softDelete(id: string): Promise<void>;
  saveMany(entities: UserPermissionEntity[]): Promise<UserPermissionEntity[]>;
}