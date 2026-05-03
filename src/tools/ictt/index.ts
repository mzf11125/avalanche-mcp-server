import { z } from "zod";
import { getICTTTransfers } from "../../api/avacloud.js";

export const getICTTTransfersSchema = z.object({
  token_address: z.string().optional().describe("Token contract address to filter by"),
  chain: z.string().optional().describe("Blockchain ID to filter by"),
  limit: z.number().int().min(1).max(100).default(20),
  direction: z.enum(["in", "out", "all"]).default("all"),
});

export async function getICTTTransfersTool(input: z.infer<typeof getICTTTransfersSchema>): Promise<string> {
  try {
    const data = await getICTTTransfers({
      tokenAddress: input.token_address,
      chain: input.chain,
      limit: input.limit,
    });
    return JSON.stringify(data);
  } catch (err) {
    throw new Error(`Failed to fetch ICTT transfers: ${(err as Error).message}`);
  }
}

export const getICTTTokensSchema = z.object({
  chain: z.string().optional().describe("Filter by blockchain ID"),
  token_address: z.string().optional().describe("Filter by token address"),
});

export async function getICTTTokensTool(input: z.infer<typeof getICTTTokensSchema>): Promise<string> {
  try {
    const data = await getICTTTransfers({ chain: input.chain, tokenAddress: input.token_address, limit: 1 });
    // Return token metadata from the response
    return JSON.stringify({
      note: "ICTT token registry requires AVACLOUD_API_KEY for full data",
      query: input,
      data,
    });
  } catch (err) {
    throw new Error(`Failed to fetch ICTT tokens: ${(err as Error).message}`);
  }
}
