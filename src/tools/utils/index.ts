import { z } from "zod";
import axios from "axios";
import { ScaffoldFile } from "../../types/index.js";

// ── Contract Addresses ──────────────────────────────────────────────────────

const CONTRACT_ADDRESSES: Record<string, Record<string, string>> = {
  mainnet: {
    teleporter: "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf",
    "teleporter-registry": "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228",
    wavax: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    "native-minter-precompile": "0x0200000000000000000000000000000000000001",
    "fee-manager-precompile": "0x0200000000000000000000000000000000000003",
    "warp-precompile": "0x0200000000000000000000000000000000000005",
  },
  fuji: {
    teleporter: "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf",
    "teleporter-registry": "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228",
    wavax: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
    "native-minter-precompile": "0x0200000000000000000000000000000000000001",
    "fee-manager-precompile": "0x0200000000000000000000000000000000000003",
    "warp-precompile": "0x0200000000000000000000000000000000000005",
  },
};

export const getContractAddressesSchema = z.object({
  network: z.enum(["mainnet", "fuji"]).default("mainnet"),
  contracts: z.array(z.string()).optional().describe("Specific contract names to fetch"),
});

export async function getContractAddressesTool(
  input: z.infer<typeof getContractAddressesSchema>
): Promise<string> {
  const addresses = CONTRACT_ADDRESSES[input.network];
  const filtered = input.contracts
    ? Object.fromEntries(input.contracts.map((k) => [k, addresses[k] ?? "not found"]))
    : addresses;
  return JSON.stringify({ network: input.network, addresses: filtered, updated_at: new Date().toISOString() });
}

// ── AvaCloud Status ─────────────────────────────────────────────────────────

export const checkAvaCloudStatusSchema = z.object({});

export async function checkAvaCloudStatusTool(): Promise<string> {
  try {
    const { data } = await axios.get("https://status.avax.network/api/v2/status.json", { timeout: 8000 });
    return JSON.stringify({
      status: data.status?.indicator === "none" ? "operational" : data.status?.indicator ?? "unknown",
      description: data.status?.description,
      updated_at: new Date().toISOString(),
    });
  } catch {
    return JSON.stringify({ status: "unknown", error: "Could not reach status API", updated_at: new Date().toISOString() });
  }
}

// ── Decode Warp Message ─────────────────────────────────────────────────────

export const decodeWarpMessageSchema = z.object({
  payload_hex: z.string().describe("Hex-encoded Warp message payload"),
  message_type: z.enum(["icm", "ictt", "unknown"]).default("unknown"),
});

export async function decodeWarpMessageTool(input: z.infer<typeof decodeWarpMessageSchema>): Promise<string> {
  try {
    const hex = input.payload_hex.startsWith("0x") ? input.payload_hex.slice(2) : input.payload_hex;
    const bytes = Buffer.from(hex, "hex");
    return JSON.stringify({
      raw_hex: input.payload_hex,
      byte_length: bytes.length,
      message_type: input.message_type,
      note: "Full ABI decoding requires knowing the exact struct layout. Use the payload with abi.decode() in Solidity or ethers.js AbiCoder.",
      first_32_bytes: "0x" + bytes.slice(0, 32).toString("hex"),
    });
  } catch (err) {
    throw new Error(`Failed to decode Warp message: ${(err as Error).message}`);
  }
}

// ── Scaffold L1 Deployment ──────────────────────────────────────────────────

export const scaffoldL1Schema = z.object({
  l1_name: z.string().describe("Name of your L1"),
  native_token_symbol: z.string().describe("Symbol for the native gas token, e.g. MTK"),
  native_token_name: z.string().describe("Full name of the native token"),
  chain_id: z.number().int().describe("EVM chain ID (must be unique)"),
  enable_icm: z.boolean().default(true),
  enable_fee_manager: z.boolean().default(false),
  permissioned: z.boolean().default(false),
  initial_supply: z.string().default("240000000000000000000000000"),
  admin_address: z.string().default("0xYourAdminAddress"),
});

export async function scaffoldL1Tool(input: z.infer<typeof scaffoldL1Schema>): Promise<string> {
  const files: ScaffoldFile[] = [];

  // genesis.json
  const genesis: Record<string, unknown> = {
    config: {
      chainId: input.chain_id,
      homesteadBlock: 0,
      eip150Block: 0,
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      muirGlacierBlock: 0,
      subnetEVMTimestamp: 0,
      feeConfig: {
        gasLimit: 8000000,
        minBaseFee: 25000000000,
        targetGas: 15000000,
        baseFeeChangeDenominator: 36,
        minBlockGasCost: 0,
        maxBlockGasCost: 1000000,
        targetBlockRate: 2,
        blockGasCostStep: 200000,
      },
    },
    alloc: {
      [input.admin_address]: { balance: "0x" + BigInt(input.initial_supply).toString(16) },
    },
    nonce: "0x0",
    timestamp: "0x0",
    extraData: "0x00",
    gasLimit: "0x7A1200",
    difficulty: "0x0",
    mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    coinbase: "0x0000000000000000000000000000000000000000",
    number: "0x0",
    gasUsed: "0x0",
    parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
  };

  if (input.enable_icm) {
    (genesis.config as Record<string, unknown>).warpConfig = { blockTimestamp: 0, quorumNumerator: 67 };
  }
  if (input.enable_fee_manager) {
    (genesis.config as Record<string, unknown>).feeManagerConfig = {
      blockTimestamp: 0,
      adminAddresses: [input.admin_address],
    };
  }
  if (input.permissioned) {
    (genesis.config as Record<string, unknown>).contractDeployerAllowListConfig = {
      blockTimestamp: 0,
      adminAddresses: [input.admin_address],
    };
  }

  files.push({ path: "genesis.json", content: JSON.stringify(genesis, null, 2) });

  // hardhat.config.ts
  files.push({
    path: "hardhat.config.ts",
    content: `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.25",
  networks: {
    ${input.l1_name.toLowerCase().replace(/\s+/g, "_")}: {
      url: process.env.L1_RPC_URL!,
      chainId: ${input.chain_id},
      accounts: [process.env.PRIVATE_KEY!],
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
};

export default config;
`,
  });

  // .env.example
  files.push({
    path: ".env.example",
    content: `PRIVATE_KEY=0x...
L1_RPC_URL=https://your-l1-rpc/ext/bc/CHAIN_ID/rpc
L1_BLOCKCHAIN_ID=  # bytes32 blockchain ID
`,
  });

  // README
  files.push({
    path: "README.md",
    content: `# ${input.l1_name}

Avalanche L1 — Chain ID: ${input.chain_id}
Native Token: ${input.native_token_name} (${input.native_token_symbol})

## Setup

\`\`\`bash
npm install
cp .env.example .env
# Fill in your private key and RPC URL
\`\`\`

## Deploy

\`\`\`bash
npx hardhat run scripts/deploy.ts --network ${input.l1_name.toLowerCase().replace(/\s+/g, "_")}
\`\`\`
${input.enable_icm ? "\n## ICM\n\nThis L1 has ICM (Warp) enabled. Teleporter is deployed at `0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf`.\n" : ""}`,
  });

  return JSON.stringify({
    files,
    setup_commands: [
      "npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox",
      "cp .env.example .env",
      "# Edit .env with your private key and RPC URL",
    ],
  });
}
