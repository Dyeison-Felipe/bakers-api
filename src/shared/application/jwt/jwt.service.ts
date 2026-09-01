
export type UserGenerateToken = {
  sub: string;
  username: string;
  email: string;
  role: string;
  // Só o login preenche isto — verificação de e-mail e reset de senha geram
  // tokens de uso único que não participam do controle de sessão única.
  sessionId?: string;
};

export type GenerateJwtToken = {
  token: string;
};

export type Options = {
  secret?: string;
  expiresIn?: number;
};

export type Payload = {
  sub: string;
  username: string;
  email?: string;
  sessionId?: string;
  iat: number;
  exp: number;
};

export type VerifyOptions = {
  secret?: string;
};

export interface JwtService {
  generateJwt(user: UserGenerateToken, options?: Options): Promise<GenerateJwtToken>;
  decodeJwt(jwt: string): Payload;
  verifyJwt(jwt: string, options?: VerifyOptions): Promise<Payload | null>;
}
