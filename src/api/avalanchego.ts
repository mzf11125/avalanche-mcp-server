import axios, { AxiosInstance } from "axios";
import { getConfig } from "../utils/config.js";

export function createAvalancheGoClient(network: "mainnet" | "fuji" = "mainnet"): AxiosInstance {
  const config = getConfig();
  const baseURL = network === "mainnet" ? config.avaxMainnetPChain : config.avaxFujiPChain;
  return axios.create({ baseURL, timeout: config.requestTimeoutMs });
}

export async function pchainRpc(
  method: string,
  params: Record<string, unknown> = {},
  network: "mainnet" | "fuji" = "mainnet"
): Promise<unknown> {
  const client = createAvalancheGoClient(network);
  const { data } = await client.post("", { jsonrpc: "2.0", method, params, id: 1 });
  if (data.error) throw new Error(`P-Chain RPC error: ${data.error.message}`);
  return data.result;
}

export async function infoRpc(
  method: string,
  params: Record<string, unknown> = {},
  network: "mainnet" | "fuji" = "mainnet"
): Promise<unknown> {
  const config = getConfig();
  const baseURL = network === "mainnet"
    ? "https://api.avax.network/ext/info"
    : "https://api.avax-test.network/ext/info";
  const { data } = await axios.post(baseURL, { jsonrpc: "2.0", method, params, id: 1 }, {
    timeout: config.requestTimeoutMs,
  });
  if (data.error) throw new Error(`Info RPC error: ${data.error.message}`);
  return data.result;
}
