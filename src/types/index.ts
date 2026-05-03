// Shared TypeScript types for the Avalanche MCP server

export interface L1Summary {
  id: string;
  name: string;
  vmId: string;
  validators: number;
  transactions_24h: number;
  active_addresses_24h: number;
  tvl_usd?: number;
}

export interface ValidatorInfo {
  node_id: string;
  status: "active" | "inactive" | "pending";
  stake_amount?: number;
  uptime_percent: number;
  connected: boolean;
  delegators?: number;
  validation_start: string;
  validation_end: string;
  rewards_address?: string;
}

export interface ICMMessage {
  message_id: string;
  source_chain: string;
  destination_chain: string;
  sender: string;
  status: "pending" | "delivered" | "failed";
  timestamp: string;
  fee_paid: string;
  payload_hex: string;
  delivery_tx?: string;
}

export interface ICTTTransfer {
  transfer_id: string;
  token: string;
  amount: string;
  from_chain: string;
  to_chain: string;
  sender: string;
  recipient: string;
  status: "pending" | "complete";
  timestamp: string;
  source_tx: string;
  destination_tx?: string;
}

export interface ICTTToken {
  name: string;
  symbol: string;
  token_home_chain: string;
  token_home_address: string;
  remotes: {
    chain: string;
    remote_address: string;
    collateral_locked: string;
    supply_remote: string;
  }[];
  total_bridged_usd?: number;
}

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface Config {
  avaxMainnetRpc: string;
  avaxFujiRpc: string;
  avaxMainnetPChain: string;
  avaxFujiPChain: string;
  avaclouApiKey?: string;
  defaultNetwork: "mainnet" | "fuji";
  requestTimeoutMs: number;
}
