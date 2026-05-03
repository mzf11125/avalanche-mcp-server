import { z } from "zod";
import { getICMMessages, getICMMessage } from "../../api/avacloud.js";

export const getICMMessagesSchema = z.object({
  source_chain: z.string().optional().describe("Source blockchain ID"),
  destination_chain: z.string().optional().describe("Destination blockchain ID"),
  limit: z.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "delivered", "failed", "all"]).default("all"),
});

export async function getICMMessagesTool(input: z.infer<typeof getICMMessagesSchema>): Promise<string> {
  try {
    const data = await getICMMessages({
      sourceChain: input.source_chain,
      destinationChain: input.destination_chain,
      limit: input.limit,
      status: input.status,
    });
    return JSON.stringify(data);
  } catch (err) {
    throw new Error(`Failed to fetch ICM messages: ${(err as Error).message}`);
  }
}

export const checkICMMessageSchema = z.object({
  message_id: z.string().optional().describe("ICM message ID (bytes32)"),
  source_tx_hash: z.string().optional().describe("Source transaction hash"),
}).refine((d) => d.message_id || d.source_tx_hash, {
  message: "Provide either message_id or source_tx_hash",
});

export async function checkICMMessageTool(input: z.infer<typeof checkICMMessageSchema>): Promise<string> {
  try {
    const id = input.message_id ?? input.source_tx_hash!;
    const data = await getICMMessage(id);
    return JSON.stringify(data);
  } catch (err) {
    throw new Error(`Failed to check ICM message: ${(err as Error).message}`);
  }
}

export const getICMStatsSchema = z.object({
  source_chain: z.string().optional(),
  destination_chain: z.string().optional(),
  timeframe: z.enum(["24h", "7d", "30d"]).default("24h"),
});

export async function getICMStatsTool(input: z.infer<typeof getICMStatsSchema>): Promise<string> {
  try {
    // Fetch a larger batch and compute stats locally
    const data = await getICMMessages({
      sourceChain: input.source_chain,
      destinationChain: input.destination_chain,
      limit: 100,
      status: "all",
    }) as { messages?: Array<{ status: string; fee_paid?: string }> };

    const messages = data.messages ?? [];
    const delivered = messages.filter((m) => m.status === "delivered").length;
    const pending = messages.filter((m) => m.status === "pending").length;
    const failed = messages.filter((m) => m.status === "failed").length;

    return JSON.stringify({
      total_messages: messages.length,
      delivered,
      pending,
      failed,
      timeframe: input.timeframe,
      note: "Stats computed from last 100 messages. Configure AVACLOUD_API_KEY for full historical data.",
    });
  } catch (err) {
    throw new Error(`Failed to fetch ICM stats: ${(err as Error).message}`);
  }
}
