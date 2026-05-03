# Product Requirements Document
# avalanche-mcp-server

**Version:** 1.0  
**Status:** Draft  
**Program Target:** Retro9000 - Avalanche L1 & Infrastructure Tooling Round  
**Next Snapshot Deadline:** July 14, 2026

---

## 1. Overview

`avalanche-mcp-server` is a Model Context Protocol (MCP) server that gives AI agents live access to Avalanche network data and developer utilities - directly inside any MCP-compatible tool (Claude Desktop, Cursor, Windsurf, etc.).

It is the companion to [`avalanche_agent_skills`](https://github.com/your-username/avalanche_agent_skills). Where the skills provide static knowledge, the MCP server provides live, queryable data and code generation.

**One-liner:** Ask your AI agent "what's the ICM message volume between my L1 and C-Chain today?" and get a real answer.

---

## 2. Problem

- **No live Avalanche data in AI tools.** Developers using Claude or Cursor can't query validator status, ICM message delivery, or L1 metrics without leaving their editor.
- **Scaffolding is manual.** Setting up `genesis.json`, Hardhat config, and `.env` for a new L1 requires reading multiple docs pages. An AI agent with the right tool can do it in one prompt.
- **ICM/ICTT debugging is painful.** Checking whether a cross-chain message was delivered requires knowing the right API endpoint, the right parameters, and the right format. A tool abstracts all of that.

---

## 3. Goals

| ID | Goal |
|----|------|
| G1 | Give AI agents real-time access to Avalanche L1 stats, validator info, and network health |
| G2 | Enable AI agents to query, filter, and explain ICM message status and volume |
| G3 | Enable AI agents to query ICTT token bridge transfers |
| G4 | Generate complete L1 deployment scaffolds from a single natural-language prompt |
| G5 | Work without any API key using public endpoints |
| G6 | Publish to npm so any developer can run it with `npx avalanche-mcp-server` |

---

## 4. Non-Goals

- No web UI or REST API - MCP only
- No wallet signing or key management - read-only + local generation
- No support for non-Avalanche chains
- No paid tiers - fully free and open-source

---

## 5. Users

**Primary:** Avalanche L1 builders using AI coding assistants who want to query live network data without leaving their tool.

**Secondary:** DevOps/validator operators who want to check node health conversationally.

**Tertiary:** dApp developers debugging ICM/ICTT integrations.

---

## 6. Tools Specification

### 6.1 Network Tools

---

#### `get_network_overview`

High-level Avalanche network health snapshot.

**Input:** none

**Output:**
```json
{
  "primary_network": {
    "total_validators": 1200,
    "total_l1s": 87
  },
  "updated_at": "2026-05-03T03:00:00Z"
}
```

**Data source:** AvalancheGo P-Chain RPC (`platform.getCurrentValidators`)

---

#### `get_avalanche_l1s`

List live Avalanche L1s with metadata.

**Input:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | `"live" \| "testnet" \| "all"` | `"live"` | Filter by network type |
| `limit` | `number` | `20` | Max results (1–100) |

**Output:** Array of L1 objects from AvaCloud Glacier API.

**Data source:** AvaCloud Glacier API (`/v1/chains`)

---

#### `get_l1_stats`

Real-time statistics for a specific Avalanche L1.

**Input:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `blockchain_id` | `string` | required | Blockchain ID (bytes32 or base58) |
| `timeframe` | `"24h" \| "7d" \| "30d"` | `"24h"` | Stats window |

**Output:** TPS, active addresses, gas used, validator count.

**Data source:** AvaCloud Glacier API (`/v1/chains/{id}/metrics`)

---

#### `get_validator_info`

Status and details of a specific validator node.

**Input:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `node_id` | `string` | required | e.g. `NodeID-5mb46qkSBj81k9g9e1af1uAGbFjGcr1LL` |
| `blockchain_id` | `string` | optional | Subnet ID. Omit for primary network. |
| `network` | `"mainnet" \| "fuji"` | `"mainnet"` | Network to query |

**Output:**
```json
{
  "node_id": "NodeID-...",
  "status": "active",
  "stake_amount": 2000,
  "uptime_percent": 99.8,
  "connected": true,
  "validation_start": "2025-01-01T00:00:00Z",
  "validation_end": "2026-01-01T00:00:00Z"
}
```

**Data source:** AvalancheGo P-Chain RPC (`platform.getCurrentValidators`)

---

### 6.2 ICM Tools

---

#### `get_icm_messages`

Fetch recent ICM (Teleporter) messages with filtering.

**Input:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `source_chain` | `string` | optional | Source blockchain ID |
| `destination_chain` | `string` | optional | Destination blockchain ID |
| `limit` | `number` | `20` | Max results (1–100) |
| `status` | `"pending" \| "delivered" \| "failed" \| "all"` | `"all"` | Filter by delivery status |

**Output:** Array of ICM message objects with IDs, chains, sender, status, fee, and delivery tx.

**Data source:** AvaCloud Data API (`/v1/icm/messages`)

---

#### `check_icm_message`

Delivery status of a specific ICM message.

**Input:** `message_id` (bytes32) OR `source_tx_hash` - one required.

**Output:**
```json
{
  "message_id": "0x...",
  "status": "delivered",
  "source_chain": "...",
  "destination_chain": "...",
  "source_tx": "0x...",
  "delivery_tx": "0x...",
  "delivery_timestamp": "2026-05-03T02:55:00Z"
}
```

**Data source:** AvaCloud Data API (`/v1/icm/messages/{id}`)

---

#### `get_icm_stats`

ICM volume and delivery statistics.

**Input:**
| Field | Type | Default |
|-------|------|---------|
| `source_chain` | `string` | optional |
| `destination_chain` | `string` | optional |
| `timeframe` | `"24h" \| "7d" \| "30d"` | `"24h"` |

**Output:** Total messages, delivered, pending, failed counts.

**Data source:** AvaCloud Data API (computed from message list)

---

### 6.3 ICTT Tools

---

#### `get_ictt_transfers`

Recent ICTT token bridge transfers.

**Input:**
| Field | Type | Default |
|-------|------|---------|
| `token_address` | `string` | optional |
| `chain` | `string` | optional |
| `limit` | `number` | `20` |
| `direction` | `"in" \| "out" \| "all"` | `"all"` |

**Output:** Array of transfer objects with token, amount, chains, sender, recipient, status, and tx hashes.

**Data source:** AvaCloud Glacier API (`/v1/ictt/transfers`)

---

#### `get_ictt_tokens`

ICTT-deployed tokens with home and remote chain info.

**Input:** `chain` (optional), `token_address` (optional)

**Output:** Token metadata including home chain, remote deployments, and collateral locked.

**Data source:** AvaCloud Glacier API

---

### 6.4 Developer Utility Tools

---

#### `scaffold_l1_deployment`

Generate a complete deployment scaffold for a new Avalanche L1. **No network call - fully local.**

**Input:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `l1_name` | `string` | required | Name of the L1 |
| `native_token_symbol` | `string` | required | Gas token symbol, e.g. `GAME` |
| `native_token_name` | `string` | required | Full token name |
| `chain_id` | `number` | required | EVM chain ID (must be unique) |
| `enable_icm` | `boolean` | `true` | Include Warp config in genesis |
| `enable_fee_manager` | `boolean` | `false` | Enable FeeManager precompile |
| `permissioned` | `boolean` | `false` | Enable ContractDeployerAllowList |
| `initial_supply` | `string` | `"240000000000000000000000000"` | Pre-funded supply in wei |
| `admin_address` | `string` | `"0xYourAdminAddress"` | Admin/pre-funded address |

**Output:** Array of files to write:
- `genesis.json` - complete genesis with fee config, precompiles, and alloc
- `hardhat.config.ts` - configured for the new L1 + Fuji
- `.env.example` - required environment variables
- `README.md` - setup and deploy instructions

---

#### `get_contract_addresses`

Official Avalanche contract addresses for mainnet or Fuji.

**Input:** `network` (`"mainnet"` | `"fuji"`), `contracts` (optional filter list)

**Output:**
```json
{
  "network": "mainnet",
  "addresses": {
    "teleporter": "0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf",
    "teleporter-registry": "0xF86Cb19Ad8405AEFa7d09C778215D2Cb6eBfB228",
    "wavax": "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    "native-minter-precompile": "0x0200000000000000000000000000000000000001",
    "fee-manager-precompile": "0x0200000000000000000000000000000000000003",
    "warp-precompile": "0x0200000000000000000000000000000000000005"
  }
}
```

**Data source:** Static (hardcoded verified addresses)

---

#### `decode_warp_message`

Decode a raw Avalanche Warp message payload for debugging.

**Input:** `payload_hex` (hex string), `message_type` (`"icm"` | `"ictt"` | `"unknown"`)

**Output:** Byte length, first 32 bytes, and guidance for full ABI decoding.

**Data source:** Local (no network call)

---

#### `check_avacloud_status`

Operational status of AvaCloud and Avalanche network services.

**Input:** none

**Output:** `operational` | `degraded` | `outage` with per-service breakdown.

**Data source:** `https://status.avax.network/api/v2/status.json`

---

### 6.5 Tool Summary

| Tool | Category | Auth Required | Network Call |
|------|----------|---------------|--------------|
| `get_network_overview` | Network | No | Yes |
| `get_avalanche_l1s` | Network | Optional | Yes |
| `get_l1_stats` | Network | Optional | Yes |
| `get_validator_info` | Network | No | Yes |
| `get_icm_messages` | ICM | Optional | Yes |
| `check_icm_message` | ICM | Optional | Yes |
| `get_icm_stats` | ICM | Optional | Yes |
| `get_ictt_transfers` | ICTT | Optional | Yes |
| `get_ictt_tokens` | ICTT | Optional | Yes |
| `scaffold_l1_deployment` | Utils | No | No |
| `get_contract_addresses` | Utils | No | No |
| `decode_warp_message` | Utils | No | No |
| `check_avacloud_status` | Utils | No | Yes |

**Total: 13 tools across 4 categories**

---

## 7. Configuration

```env
# Optional - enables higher rate limits and additional data fields
AVACLOUD_API_KEY=

# Optional - override default RPC endpoints
AVAX_MAINNET_RPC=https://api.avax.network/ext/bc/C/rpc
AVAX_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc

# Optional
DEFAULT_NETWORK=mainnet
REQUEST_TIMEOUT_MS=10000
```

All 13 tools function without `AVACLOUD_API_KEY` using public endpoints. The API key unlocks higher rate limits and additional data fields on network/ICM/ICTT tools.

---

## 8. Installation & Setup

### npx (no install)
```bash
npx avalanche-mcp-server
```

### Claude Desktop
```json
{
  "mcpServers": {
    "avalanche": {
      "command": "npx",
      "args": ["avalanche-mcp-server"],
      "env": { "AVACLOUD_API_KEY": "optional" }
    }
  }
}
```

### Cursor / Windsurf
Add to MCP settings with the same `command` + `args` pattern.

---

## 9. Architecture

```
AI Tool (Claude / Cursor / Windsurf)
        │
        │  MCP protocol (JSON-RPC over stdio)
        ▼
┌──────────────────────────────────────┐
│        avalanche-mcp-server          │
│                                      │
│  Network  │  ICM  │  ICTT  │  Utils  │
│  Tools    │ Tools │ Tools  │  Tools  │
│           │       │        │         │
│  ┌────────┴───────┴────────┴──────┐  │
│  │         API Clients            │  │
│  │  AvaCloud Glacier  │  P-Chain  │  │
│  │  Data API          │  RPC      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Data Sources

| Source | Used For |
|--------|----------|
| AvaCloud Glacier API (`glacier-api.avax.network`) | L1 list, L1 stats, ICTT data |
| AvaCloud Data API (`data-api.avax.network/v1`) | ICM messages and stats |
| AvalancheGo P-Chain RPC | Validator info, network overview |
| AvaCloud Status API | Service health |
| Local generation | `scaffold_l1_deployment`, `get_contract_addresses`, `decode_warp_message` |

### Tech Stack

| Component | Choice |
|-----------|--------|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| MCP SDK | `@modelcontextprotocol/sdk` |
| HTTP client | `axios` |
| Validation | `zod` |
| Tests | `vitest` |
| Transport | stdio (standard MCP) |

---

## 10. Repository Structure

```
avalanche-mcp-server/
├── README.md
├── LICENSE                    # MIT
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts               # MCP server entry point + tool dispatch
│   ├── types/index.ts         # Shared TypeScript types
│   ├── utils/config.ts        # Environment config
│   ├── api/
│   │   ├── avacloud.ts        # AvaCloud API client
│   │   └── avalanchego.ts     # AvalancheGo RPC client
│   └── tools/
│       ├── network/index.ts   # get_network_overview, get_l1_stats, get_avalanche_l1s, get_validator_info
│       ├── icm/index.ts       # get_icm_messages, check_icm_message, get_icm_stats
│       ├── ictt/index.ts      # get_ictt_transfers, get_ictt_tokens
│       └── utils/index.ts     # scaffold_l1_deployment, get_contract_addresses, decode_warp_message, check_avacloud_status
└── tests/
    └── tools/
        └── utils.test.ts      # Unit tests for local tools
```

---

## 11. Retro9000 Alignment

| Criterion | How This Addresses It |
|-----------|----------------------|
| Open-source | MIT license |
| Publicly usable | `npx avalanche-mcp-server` - zero install friction |
| ICM/ICTT integration | 5 dedicated ICM/ICTT tools - maximum emphasis on Retro9000's preferred protocols |
| Live on mainnet | Queries mainnet by default |
| Developer tooling | `scaffold_l1_deployment` directly accelerates L1 builder onboarding |
| Technical merit | 13 tools, typed with Zod, tested, builds clean |

---

## 12. Success Metrics (July 14 Snapshot)

| Metric | Target |
|--------|--------|
| npm installs | ≥ 200 |
| GitHub stars | ≥ 50 |
| Tools implemented | 13 / 13 |
| Test coverage (local tools) | 100% |
| Works without API key | Yes (all 13 tools) |

---

## 13. Roadmap

### v0.1 (current)
- [x] All 13 tools implemented
- [x] TypeScript, builds clean
- [x] Unit tests for local tools
- [x] README with Claude Desktop setup

### v0.2
- [ ] Integration tests against Fuji testnet
- [ ] `get_ictt_tokens` full implementation (requires AvaCloud token registry endpoint)
- [ ] Retry logic and better error messages for rate-limited responses
- [ ] Published to npm

### v0.3
- [ ] SSE transport option (for web-based MCP clients)
- [ ] Caching layer for frequently-queried data (validator list, contract addresses)
- [ ] `get_icm_stats` using dedicated stats endpoint when available
- [ ] Avalanche Academy / Builder Hub integration pitch

---

*This document covers `avalanche-mcp-server` only. For the agent skills product, see the main [PRD](../avalanche_agent_skills/prd.md).*
