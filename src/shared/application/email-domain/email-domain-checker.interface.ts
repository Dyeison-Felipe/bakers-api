export interface EmailDomainChecker {
  /**
   * Retorna `false` só quando há certeza de que o domínio do e-mail não
   * recebe mensagens (domínio inexistente ou sem registro MX). Falhas de rede
   * ou timeout de DNS retornam `true`, para não bloquear o cadastro por
   * instabilidade externa.
   */
  hasValidDomain(email: string): Promise<boolean>;
}
