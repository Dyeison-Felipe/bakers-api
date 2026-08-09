export type CreateUserInput = {
  username: string;
  name: string;
  password: string;
  email: string;
  role: string
  permissionsId: string[]
}