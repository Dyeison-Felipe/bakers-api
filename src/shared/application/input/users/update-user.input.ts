export type UpdateUserInput = {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  permissionsId: string[]
}