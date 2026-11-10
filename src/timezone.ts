// Fuso da aplicação: horário de Brasília, seja qual for o fuso do servidor
// (o container de produção roda em UTC).
//
// As colunas `timestamp` não guardam fuso: o driver grava e lê o horário no
// fuso do processo Node, e o `now()` dos defaults usa o fuso da conexão com o
// banco (forçado em databaseConfig.ts). Os dois precisam ser o mesmo, senão
// os horários ficam 3h deslocados.
//
// Este arquivo precisa ser o PRIMEIRO import do main.ts.
process.env.TZ = 'America/Sao_Paulo';
