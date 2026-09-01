import { CookieOptions } from "@/shared/application/cookies/cookies";

export type LoginInput = {
    email: string;
  password: string;
  // Confirma que o usuário quer derrubar a sessão já ativa em outro navegador.
  force?: boolean;
  setCookie: (key: string, value: string, options?: CookieOptions) => void;
}