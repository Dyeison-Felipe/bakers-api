// Derruba, em tempo real, qualquer conexão WebSocket que o usuário ainda
// tenha aberta com uma sessão diferente da recém-confirmada — é o que faz o
// navegador antigo ser deslogado assim que o login é confirmado em outro,
// sem precisar esperar a próxima requisição REST dele.
export interface SessionNotifierService {
  invalidateOtherSessions(userId: string, currentSessionId: string): void;
}
