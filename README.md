# avalanche-mcp-server

[![npm version](https://img.shields.io/npm/v/avalanche-mcp-server)](https://www.npmjs.com/package/avalanche-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Retro9000](https://img.shields.io/badge/Retro9000-Tooling-red)](https://retro9000.avax.network)

MCP server that gives AI agents live access to Avalanche network data — L1 stats, ICM messages, ICTT transfers, validator info, and L1 deployment scaffolding.

Part of the [Avalanche Developer AI Toolkit](https://github.com/your-username/avalanche_agent_skills).

## Quick Start

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "avalanche": {
      "command": "npx",
      "args": ["avalanche-mcp-server"],
      "env": {
        "AVACLOUD_API_KEY": "your-key-here"
      }
    }
  }
}
```

Restart Claude Desktop. You can now ask:
- *"What are the most active Avalanche L1s right now?"*
- *"Check the status of ICM message 0x1234..."*
- *"Generate a genesis.json for my new L1 with chain ID 12345"*
- *"Is validator NodeID-XXX active on my subnet?"*

### Run Directly

```bash
npx avalanche-mcp-server
```

### Install Globally

```bash
npm install -g avalanche-mcp-server
avalanche-mcp-server
```

## Tools (13 total)

### Network

| Tool | Description |
|------|-------------|
| `get_network_overview` | Avalanche network health snapshot |
| `get_avalanche_l1s` | List live Avalanche L1s |
| `get_l1_stats` | Stats for a specific L1 (TPS, addresses, validators) |
| `get_validator_info` | Validator status and uptime |

### ICM (Interchain Messaging)

| Tool | Description |
|------|-------------|
| `get_icm_messages` | Recent ICM messages with filtering |
| `check_icm_message` | Delivery status of a specific message |
| `get_icm_stats` | ICM volume and delivery stats |

### ICTT (Interchain Token Transfer)

| Tool | Description |
|------|-------------|
| `get_ictt_transfers` | Recent token bridge transfers |
| `get_ictt_tokens` | ICTT-deployed tokens and their remotes |

### Developer Utilities

| Tool | Description |
|------|-------------|
| `scaffold_l1_deployment` | Generate genesis.json + Hardhat config for a new L1 |
| `get_contract_addresses` | Official Avalanche contract addresses |
| `decode_warp_message` | Decode a raw Warp message payload |
| `check_avacloud_status` | AvaCloud service health |

## Configuration

All tools work without any API key using public endpoints.

```env
# Optional — higher rate limits and additional data
AVACLOUD_API_KEY=

# Optional — override RPC endpoints
AVAX_MAINNET_RPC=https://api.avax.network/ext/bc/C/rpc
AVAX_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc

# Optional
DEFAULT_NETWORK=mainnet
REQUEST_TIMEOUT_MS=10000
```

Get a free AvaCloud API key at [avacloud.io](https://avacloud.io).

## Example Interactions

**Check ICM message delivery:**
> "Check if ICM message 0xabc123... was delivered"

**Scaffold a new L1:**
> "Generate deployment files for my L1 called 'GameChain' with chain ID 99999, native token GAME, ICM enabled"

**Monitor validators:**
> "Is NodeID-5mb46qkSBj81k9g9e1af1uAGbFjGcr1LL active on subnet 2D9GkvLMBuH4..."

## Development

```bash
git clone https://github.com/your-username/avalanche-mcp-server
cd avalanche-mcp-server
npm install
npm run dev    # run with tsx (no build needed)
npm run build  # compile to dist/
npm test       # run tests
```

## License

MIT
