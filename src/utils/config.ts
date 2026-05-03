import { Config } from "../types/index.js";

export function getConfig(): Config {
  return {
    avaxMainnetRpc: process.env.AVAX_MAINNET_RPC ?? "https://api.avax.network/ext/bc/C/rpc",
    avaxFujiRpc: process.env.AVAX_FUJI_RPC ?? "https://api.avax-test.network/ext/bc/C/rpc",
    avaxMainnetPChain: process.env.AVAX_MAINNET_PCHAIN ?? "https://api.avax.network/ext/bc/P",
    avaxFujiPChain: process.env.AVAX_FUJI_PCHAIN ?? "https://api.avax-test.network/ext/bc/P",
    avaclouApiKey: process.env.AVACLOUD_API_KEY,
    defaultNetwork: (process.env.DEFAULT_NETWORK as "mainnet" | "fuji") ?? "mainnet",
    requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS ?? "10000"),
  };
}
