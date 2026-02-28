/**
 * Bankr-only indexer: Base chain + only Bankr-relevant contracts and blocks.
 * Use this to avoid indexing Doppler, Ohara, Long, Duels, Zora, etc. — fewer RPC calls and 429s.
 *
 * Start: pnpm start:bankr  or  ponder start --config ./ponder.config.bankr-only.ts -p $PORT --schema default
 */
import { createConfig } from "ponder";
import { http } from "viem";
import {
  PoolManagerABI,
  DopplerABI,
  RehypeDopplerHookMigratorABI,
} from "./src/abis";
import { UniswapV4ScheduledMulticurveInitializerABI } from "./src/abis/multicurve-abis/UniswapV4ScheduledMulticurveInitializerABI";
import { UniswapV4ScheduledMulticurveInitializerHookABI } from "./src/abis/multicurve-abis/UniswapV4ScheduledMulticurveInitializerHookABI";
import { BLOCK_INTERVALS } from "./src/config/chains/constants";
import { chainConfigs, CHAIN_IDS } from "./src/config/chains";

const base = chainConfigs.base;
// Rehype Doppler Hook Migrator on Base mainnet (Bankr); baseConfig has ZERO so we set explicitly
const REHYPE_DOPPLER_HOOK_MIGRATOR_BASE = "0x2497969a9d38045e7bd3d632af9685d9fd774ca1" as const;

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/default";
}

// Only Base chain
const chains: Record<string, { id: number; rpc: ReturnType<typeof http> }> = {};
if (process.env.PONDER_RPC_URL_8453) {
  chains.base = { id: CHAIN_IDS.base, rpc: http(process.env.PONDER_RPC_URL_8453) };
}

// Only blocks needed for Bankr: ETH price and Bankr WETH price
const blocks: Record<string, { chain: string; startBlock: number; interval: number }> = {};
if (chains.base) {
  blocks.BaseChainlinkEthPriceFeed = {
    chain: "base",
    startBlock: 36175538,
    interval: BLOCK_INTERVALS.FIVE_MINUTES,
  };
  blocks.BankrWethPrice = {
    chain: "base",
    startBlock: 41900609,
    interval: BLOCK_INTERVALS.FIVE_MINUTES,
  };
}

// Bankr pool creation and fee events (Base only)
const decayInitStart = 42019831;
const decayHookStart = 42019829;

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: getDatabaseUrl(),
    poolConfig: { max: 100 },
  },
  ordering: "multichain",
  chains,
  blocks,
  contracts: {
    DecayMulticurveInitializer: {
      abi: UniswapV4ScheduledMulticurveInitializerABI,
      chain: {
        base: {
          startBlock: decayInitStart,
          address: base.addresses.v4.DecayMulticurveInitializer,
        },
      },
    },
    DecayMulticurveInitializerHook: {
      abi: UniswapV4ScheduledMulticurveInitializerHookABI,
      chain: {
        base: {
          startBlock: decayHookStart,
          address: base.addresses.v4.DecayMulticurveInitializerHook,
        },
      },
    },
    RehypeDopplerHookMigrator: {
      abi: RehypeDopplerHookMigratorABI,
      chain: {
        base: {
          startBlock: decayHookStart,
          address: REHYPE_DOPPLER_HOOK_MIGRATOR_BASE,
        },
      },
    },
    PoolManager: {
      abi: PoolManagerABI,
      chain: {},
    },
    UniswapV4Pool: {
      abi: DopplerABI,
      chain: {},
    },
  },
});
