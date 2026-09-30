export const RAFFLE_CATEGORIES = [
  "VEÍCULOS",
  "ELETRÔNICOS",
  "ELETRODOMÉSTICOS",
  "IMÓVEIS",
  "INFORMÁTICA",
  "MÓVEIS",
  "FERRAMENTAS",
  "MÁQUINAS E EQUIPAMENTOS",
  "JOIAS E RELÓGIOS",
  "MODA E ACESSÓRIOS",
  "CASA E JARDIM",
  "ESPORTES E LAZER",
  "COMÉRCIO E NEGÓCIOS",
  "OUTROS"
] as const;

export type RaffleCategory = (typeof RAFFLE_CATEGORIES)[number];

export function isRaffleCategory(value: string): value is RaffleCategory {
  return (RAFFLE_CATEGORIES as readonly string[]).includes(value);
}
