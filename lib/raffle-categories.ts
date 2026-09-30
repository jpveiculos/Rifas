export const RAFFLE_CATEGORIES = [
  "VEÍCULOS",
  "MOTOS",
  "CAMINHÕES E UTILITÁRIOS",
  "PEÇAS E ACESSÓRIOS",
  "ELETRÔNICOS",
  "CELULARES E TABLETS",
  "ÁUDIO E VÍDEO",
  "GAMES E CONSOLES",
  "INFORMÁTICA",
  "ELETRODOMÉSTICOS",
  "MÓVEIS",
  "CASA E JARDIM",
  "CONSTRUÇÃO",
  "FERRAMENTAS",
  "MÁQUINAS E EQUIPAMENTOS",
  "ENERGIA SOLAR",
  "IMÓVEIS",
  "JOIAS E RELÓGIOS",
  "MODA E ACESSÓRIOS",
  "BELEZA E CUIDADOS PESSOAIS",
  "BEBÊ E INFANTIL",
  "INSTRUMENTOS MUSICAIS",
  "FOTOGRAFIA E VÍDEO",
  "ESPORTES E LAZER",
  "BICICLETAS",
  "PESCA E CAMPING",
  "COLECIONÁVEIS",
  "PET",
  "ANIMAIS",
  "RURAL",
  "AGRONEGÓCIO",
  "GADO E CRIAÇÃO",
  "PRODUTOS RURAIS",
  "COMÉRCIO E NEGÓCIOS",
  "OUTROS"
] as const;

export type RaffleCategory = (typeof RAFFLE_CATEGORIES)[number];

export function isRaffleCategory(value: string): value is RaffleCategory {
  return (RAFFLE_CATEGORIES as readonly string[]).includes(value);
}
