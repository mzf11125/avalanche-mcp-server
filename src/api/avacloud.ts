import axios, { AxiosInstance } from "axios";
import { getConfig } from "../utils/config.js";

const AVACLOUD_BASE = "https://glacier-api.avax.network";
const ICM_INDEXER_BASE = "https://data-api.avax.network/v1";

let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
  if (_client) return _client;
  const config = getConfig();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.avaclouApiKey) headers["x-glacier-api-key"] = config.avaclouApiKey;
  _client = axios.create({ baseURL: AVACLOUD_BASE, headers, timeout: config.requestTimeoutMs });
  return _client;
}

export async function getL1s(params: { status?: string; limit?: number } = {}): Promise<unknown> {
  const { data } = await getClient().get("/v1/chains", {
    params: { network: "mainnet", pageSize: params.limit ?? 20 },
  });
  return data;
}

export async function getChainMetrics(blockchainId: string, timeframe = "24h"): Promise<unknown> {
  const { data } = await getClient().get(`/v1/chains/${blockchainId}/metrics`, {
    params: { timeframe },
  });
  return data;
}

export async function getICMMessages(params: {
  sourceChain?: string;
  destinationChain?: string;
  limit?: number;
  status?: string;
}): Promise<unknown> {
  const config = getConfig();
  const { data } = await axios.get(`${ICM_INDEXER_BASE}/icm/messages`, {
    params: {
      sourceBlockchainId: params.sourceChain,
      destinationBlockchainId: params.destinationChain,
      pageSize: params.limit ?? 20,
      status: params.status !== "all" ? params.status : undefined,
    },
    timeout: config.requestTimeoutMs,
  });
  return data;
}

export async function getICMMessage(messageId: string): Promise<unknown> {
  const config = getConfig();
  const { data } = await axios.get(`${ICM_INDEXER_BASE}/icm/messages/${messageId}`, {
    timeout: config.requestTimeoutMs,
  });
  return data;
}

export async function getICTTTransfers(params: {
  tokenAddress?: string;
  chain?: string;
  limit?: number;
}): Promise<unknown> {
  const { data } = await getClient().get("/v1/ictt/transfers", {
    params: {
      tokenAddress: params.tokenAddress,
      blockchainId: params.chain,
      pageSize: params.limit ?? 20,
    },
  });
  return data;
}
