export const PermissionCashRegister = {
  CASH_REGISTER_OPEN: {
    action: 'open',
    resource: 'cash_register',
  },
  CASH_REGISTER_CLOSE: {
    action: 'close',
    resource: 'cash_register',
  },
  CASH_REGISTER_READER: {
    action: 'reader',
    resource: 'cash_register',
  },
  CASH_REGISTER_MOVEMENT_CREATE: {
    action: 'movement_create',
    resource: 'cash_register',
  },
  // Separado de CASH_REGISTER_READER de propósito: reader cobre "existe um
  // caixa aberto agora?" (checado pelo PDV pra operar a venda) — history_reader
  // cobre o histórico/relatório de sessões passadas (tela "Histórico de
  // Caixa"). Sem essa separação, dar acesso ao PDV concederia também acesso
  // à tela de histórico, que é uma feature independente.
  CASH_REGISTER_HISTORY_READER: {
    action: 'history_reader',
    resource: 'cash_register',
  },
} as const;
