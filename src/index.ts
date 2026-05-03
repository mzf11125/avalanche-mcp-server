#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  getNetworkOverview,
  getNetworkOverviewSchema,
  getL1Stats,
  getL1StatsSchema,
  getAvalancheL1s,
  getAvalancheL1sSchema,
  getValidatorInfo,
  getValidatorInfoSchema,
} from "./tools/network/index.js";

import {
  getICMMessagesTool,
  getICMMessagesSchema,
  checkICMMessageTool,
  checkICMMessageSchema,
  getICMStatsTool,
  getICMStatsSchema,
} from "./tools/icm/index.js";

import {
  getICTTTransfersTool,
  getICTTTransfersSchema,
  getICTTTokensTool,
  getICTTTokensSchema,
} from "./tools/ictt/index.js";

import {
  getContractAddressesTool,
  getContractAddressesSchema,
  checkAvaCloudStatusTool,
  checkAvaCloudStatusSchema,
  decodeWarpMessageTool,
  decodeWarpMessageSchema,
  scaffoldL1Tool,
  scaffoldL1Schema,
} from "./tools/utils/index.js";

const server = new Server(
  { name: "avalanche-mcp-server", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── Tool definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_network_overview",
      description: "High-level Avalanche network health snapshot: validator count, L1 count, and top L1s by activity.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "get_l1_stats",
      description: "Fetch real-time statistics for a specific Avalanche L1 by blockchain ID.",
      inputSchema: zodToJsonSchema(getL1StatsSchema),
    },
    {
      name: "get_avalanche_l1s",
      description: "List live Avalanche L1s with key metadata.",
      inputSchema: zodToJsonSchema(getAvalancheL1sSchema),
    },
    {
      name: "get_validator_info",
      description: "Check the status and details of a validator node on any Avalanche L1 or the primary network.",
      inputSchema: zodToJsonSchema(getValidatorInfoSchema),
    },
    {
      name: "get_icm_messages",
      description: "Fetch recent ICM (Interchain Messaging / Teleporter) messages between chains.",
      inputSchema: zodToJsonSchema(getICMMessagesSchema),
    },
    {
      name: "check_icm_message",
      description: "Look up the delivery status of a specific ICM message by message ID or source transaction hash.",
      inputSchema: zodToJsonSchema(checkICMMessageSchema),
    },
    {
      name: "get_icm_stats",
      description: "ICM volume and delivery statistics between chains.",
      inputSchema: zodToJsonSchema(getICMStatsSchema),
    },
    {
      name: "get_ictt_transfers",
      description: "Fetch recent ICTT (Interchain Token Transfer) token bridge transfers.",
      inputSchema: zodToJsonSchema(getICTTTransfersSchema),
    },
    {
      name: "get_ictt_tokens",
      description: "List tokens deployed via ICTT with their home and remote chain info.",
      inputSchema: zodToJsonSchema(getICTTTokensSchema),
    },
    {
      name: "get_contract_addresses",
      description: "Get official Avalanche contract addresses (Teleporter, precompiles, WAVAX, etc.) for mainnet or Fuji.",
      inputSchema: zodToJsonSchema(getContractAddressesSchema),
    },
    {
      name: "check_avacloud_status",
      description: "Check the operational status of AvaCloud and Avalanche network services.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "decode_warp_message",
      description: "Decode a raw Avalanche Warp message payload for debugging ICM/ICTT issues.",
      inputSchema: zodToJsonSchema(decodeWarpMessageSchema),
    },
    {
      name: "scaffold_l1_deployment",
      description: "Generate a complete deployment scaffold (genesis.json, hardhat config, .env) for a new Avalanche L1.",
      inputSchema: zodToJsonSchema(scaffoldL1Schema),
    },
  ],
}));

// ── Tool dispatch ───────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "get_network_overview":
        result = await getNetworkOverview();
        break;
      case "get_l1_stats":
        result = await getL1Stats(getL1StatsSchema.parse(args));
        break;
      case "get_avalanche_l1s":
        result = await getAvalancheL1s(getAvalancheL1sSchema.parse(args));
        break;
      case "get_validator_info":
        result = await getValidatorInfo(getValidatorInfoSchema.parse(args));
        break;
      case "get_icm_messages":
        result = await getICMMessagesTool(getICMMessagesSchema.parse(args));
        break;
      case "check_icm_message":
        result = await checkICMMessageTool(checkICMMessageSchema.parse(args));
        break;
      case "get_icm_stats":
        result = await getICMStatsTool(getICMStatsSchema.parse(args));
        break;
      case "get_ictt_transfers":
        result = await getICTTTransfersTool(getICTTTransfersSchema.parse(args));
        break;
      case "get_ictt_tokens":
        result = await getICTTTokensTool(getICTTTokensSchema.parse(args));
        break;
      case "get_contract_addresses":
        result = await getContractAddressesTool(getContractAddressesSchema.parse(args));
        break;
      case "check_avacloud_status":
        result = await checkAvaCloudStatusTool();
        break;
      case "decode_warp_message":
        result = await decodeWarpMessageTool(decodeWarpMessageSchema.parse(args));
        break;
      case "scaffold_l1_deployment":
        result = await scaffoldL1Tool(scaffoldL1Schema.parse(args));
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: "text", text: result }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${(err as Error).message}` }],
      isError: true,
    };
  }
});

// ── Minimal Zod → JSON Schema converter ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodToJsonSchema(schema: any): Record<string, unknown> {
  const def = schema._def;
  const shape = def.shape?.() ?? {};
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(shape)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fieldDef: any = (field as any)._def;
    const isOptional = fieldDef.typeName === "ZodOptional" || fieldDef.typeName === "ZodDefault";
    const innerDef = isOptional ? (fieldDef.innerType?._def ?? fieldDef) : fieldDef;

    let type = "string";
    if (innerDef.typeName === "ZodNumber") type = "number";
    else if (innerDef.typeName === "ZodBoolean") type = "boolean";
    else if (innerDef.typeName === "ZodArray") type = "array";

    properties[key] = {
      type,
      description: fieldDef.description,
      ...(innerDef.typeName === "ZodEnum" ? { enum: innerDef.values } : {}),
    };

    if (!isOptional) required.push(key);
  }

  return { type: "object", properties, required };
}

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Avalanche MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
