import { z } from "zod";
import { pchainRpc, infoRpc } from "../../api/avalanchego.js";
import { getL1s, getChainMetrics } from "../../api/avacloud.js";

export const getNetworkOverviewSchema = z.object({});

export async function getNetworkOverview(): Promise<string> {
  try {
    const [validators, chains] = await Promise.allSettled([
      pchainRpc("platform.getCurrentValidators", {}),
      getL1s({ limit: 5 }),
    ]);

    const validatorCount =
      validators.status === "fulfilled"
        ? (validators.value as { validators: unknown[] }).validators?.length ?? "unknown"
        : "unavailable";

    const l1Count =
      chains.status === "fulfilled"
        ? (chains.value as { chains: unknown[] }).chains?.length ?? "unknown"
        : "unavailable";

    return JSON.stringify({
      primary_network: {
        total_validators: validatorCount,
        total_l1s: l1Count,
      },
      note: "For real-time TPS and price data, configure AVACLOUD_API_KEY",
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    throw new Error(`Failed to fetch network overview: ${(err as Error).message}`);
  }
}

export const getL1StatsSchema = z.object({
  blockchain_id: z.string().describe("Blockchain ID (bytes32 or base58)"),
  timeframe: z.enum(["24h", "7d", "30d"]).default("24h"),
});

export async function getL1Stats(input: z.infer<typeof getL1StatsSchema>): Promise<string> {
  try {
    const metrics = await getChainMetrics(input.blockchain_id, input.timeframe);
    return JSON.stringify(metrics);
  } catch (err) {
    throw new Error(`Failed to fetch L1 stats: ${(err as Error).message}`);
  }
}

export const getAvalancheL1sSchema = z.object({
  status: z.enum(["live", "testnet", "all"]).default("live"),
  limit: z.number().int().min(1).max(100).default(20),
});

export async function getAvalancheL1s(input: z.infer<typeof getAvalancheL1sSchema>): Promise<string> {
  try {
    const data = await getL1s({ limit: input.limit });
    return JSON.stringify(data);
  } catch (err) {
    throw new Error(`Failed to fetch L1 list: ${(err as Error).message}`);
  }
}

export const getValidatorInfoSchema = z.object({
  node_id: z.string().describe("Node ID, e.g. NodeID-5mb46qkSBj81k9g9e1af1uAGbFjGcr1LL"),
  blockchain_id: z.string().optional().describe("Subnet ID to check. Omit for primary network."),
  network: z.enum(["mainnet", "fuji"]).default("mainnet"),
});

export async function getValidatorInfo(input: z.infer<typeof getValidatorInfoSchema>): Promise<string> {
  try {
    const params: Record<string, unknown> = {};
    if (input.blockchain_id) params.subnetID = input.blockchain_id;

    const result = await pchainRpc("platform.getCurrentValidators", params, input.network) as {
      validators: Array<{
        nodeID: string;
        startTime: string;
        endTime: string;
        stakeAmount?: string;
        uptime?: string;
        connected?: boolean;
        rewardOwner?: { addresses: string[] };
        delegatorCount?: string;
      }>;
    };

    const validator = result.validators?.find((v) => v.nodeID === input.node_id);
    if (!validator) {
      return JSON.stringify({ node_id: input.node_id, status: "inactive", message: "Not found in current validators" });
    }

    return JSON.stringify({
      node_id: validator.nodeID,
      status: "active",
      stake_amount: validator.stakeAmount ? parseInt(validator.stakeAmount) / 1e9 : undefined,
      uptime_percent: validator.uptime ? parseFloat(validator.uptime) * 100 : undefined,
      connected: validator.connected ?? true,
      delegators: validator.delegatorCount ? parseInt(validator.delegatorCount) : 0,
      validation_start: new Date(parseInt(validator.startTime) * 1000).toISOString(),
      validation_end: new Date(parseInt(validator.endTime) * 1000).toISOString(),
      rewards_address: validator.rewardOwner?.addresses?.[0],
    });
  } catch (err) {
    throw new Error(`Failed to fetch validator info: ${(err as Error).message}`);
  }
}
