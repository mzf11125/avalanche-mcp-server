import { describe, it, expect } from "vitest";
import { getContractAddressesTool } from "../../src/tools/utils/index.js";
import { decodeWarpMessageTool } from "../../src/tools/utils/index.js";
import { scaffoldL1Tool } from "../../src/tools/utils/index.js";

describe("get_contract_addresses", () => {
  it("returns mainnet teleporter address", async () => {
    const result = JSON.parse(await getContractAddressesTool({ network: "mainnet" }));
    expect(result.addresses.teleporter).toBe("0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf");
  });

  it("returns fuji teleporter address", async () => {
    const result = JSON.parse(await getContractAddressesTool({ network: "fuji" }));
    expect(result.addresses.teleporter).toBe("0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf");
  });

  it("filters by contract name", async () => {
    const result = JSON.parse(
      await getContractAddressesTool({ network: "mainnet", contracts: ["teleporter"] })
    );
    expect(Object.keys(result.addresses)).toEqual(["teleporter"]);
  });
});

describe("decode_warp_message", () => {
  it("returns byte length and first 32 bytes", async () => {
    const hex = "0x" + "ab".repeat(64);
    const result = JSON.parse(await decodeWarpMessageTool({ payload_hex: hex, message_type: "icm" }));
    expect(result.byte_length).toBe(64);
    expect(result.first_32_bytes).toHaveLength(66); // 0x + 64 hex chars
  });
});

describe("scaffold_l1_deployment", () => {
  it("generates genesis.json with correct chainId", async () => {
    const result = JSON.parse(
      await scaffoldL1Tool({
        l1_name: "TestChain",
        native_token_symbol: "TST",
        native_token_name: "Test Token",
        chain_id: 99999,
        enable_icm: true,
        enable_fee_manager: false,
        permissioned: false,
        initial_supply: "1000000000000000000000000",
        admin_address: "0x1234567890123456789012345678901234567890",
      })
    );
    const genesisFile = result.files.find((f: { path: string }) => f.path === "genesis.json");
    expect(genesisFile).toBeDefined();
    const genesis = JSON.parse(genesisFile.content);
    expect(genesis.config.chainId).toBe(99999);
    expect(genesis.config.warpConfig).toBeDefined(); // ICM enabled
  });

  it("includes hardhat config and .env.example", async () => {
    const result = JSON.parse(
      await scaffoldL1Tool({
        l1_name: "MyL1",
        native_token_symbol: "ML1",
        native_token_name: "My L1 Token",
        chain_id: 12345,
        enable_icm: false,
        enable_fee_manager: false,
        permissioned: false,
        initial_supply: "1000000000000000000000000",
        admin_address: "0x0000000000000000000000000000000000000001",
      })
    );
    const paths = result.files.map((f: { path: string }) => f.path);
    expect(paths).toContain("hardhat.config.ts");
    expect(paths).toContain(".env.example");
    expect(paths).toContain("README.md");
  });
});
