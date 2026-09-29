export type RaffleStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED";

export type Raffle = {
  id: string;
  name: string;
  productName: string;
  description: string;
  totalNumbers: number;
  pricePerNumber: number;
  status: RaffleStatus;
};

export const raffles: Raffle[] = [];