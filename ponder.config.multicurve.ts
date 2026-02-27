import { createConfig, factory, mergeAbis } from "ponder";
import { getAbiItem, http } from "viem";
import {
  UniswapV3InitializerABI,
  UniswapV4InitializerABI,
  UniswapV3PoolABI,
  AirlockABI,
  DERC20ABI,
  DopplerABI,
  PoolManagerABI,
  UniswapV2PairABI,
  ZoraFactoryABI,
  ZoraV4HookABI,
  ZoraCoinABI,
  ZoraCreatorCoinABI,
  V4MigratorHookABI,
  V4MigratorABI,
  DopplerHookInitializerABI,
  DopplerHookMigratorABI,
  RehypeDopplerHookMigratorABI,
} from "./src/abis";
import { BLOCK_INTERVALS } from "./src/config/chains/constants";
import { chainConfigs, CHAIN_IDS } from "./src/config/chains";
import { LockableUniswapV3InitializerABI } from "@app/abis/v3-abis/LockableUniswapV3InitializerABI";
import { UniswapV3MigratorAbi } from "@app/abis/v3-abis/UniswapV3Migrator";
import { UniswapV4MulticurveInitializerHookABI } from "@app/abis/multicurve-abis/UniswapV4MulticurveInitializerHookABI";
import { UniswapV4MulticurveInitializerABI } from "@app/abis/multicurve-abis/UniswapV4MulticurveInitializerABI";
import { UniswapV4ScheduledMulticurveInitializerHookABI } from "@app/abis/multicurve-abis/UniswapV4ScheduledMulticurveInitializerHookABI";
import { UniswapV4ScheduledMulticurveInitializerABI } from "@app/abis/multicurve-abis/UniswapV4ScheduledMulticurveInitializerABI";

const { base, unichain, ink, baseSepolia, monad } = chainConfigs;

// Use DATABASE_URL on Railway; fallback for local
function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/default";
}

// Only include chains that have an RPC URL set (run with just Base, or add env vars for others)
const chains: Record<string, { id: number; rpc: ReturnType<typeof http> }> = {};
if (process.env.PONDER_RPC_URL_84532) {
  chains.baseSepolia = { id: CHAIN_IDS.baseSepolia, rpc: http(process.env.PONDER_RPC_URL_84532) };
}
if (process.env.PONDER_RPC_URL_8453) {
  chains.base = { id: CHAIN_IDS.base, rpc: http(process.env.PONDER_RPC_URL_8453) };
}
if (process.env.PONDER_RPC_URL_130) {
  chains.unichain = { id: CHAIN_IDS.unichain, rpc: http(process.env.PONDER_RPC_URL_130) };
  chains.ink = { id: CHAIN_IDS.ink, rpc: http(process.env.PONDER_RPC_URL_130) };
}
if (process.env.PONDER_RPC_URL_143) {
  chains.monad = { id: CHAIN_IDS.monad, rpc: http(process.env.PONDER_RPC_URL_143) };
}

const has = (name: string) => name in chains;

// Blocks: only include entries for chains we have
const blocks: Record<string, { chain: string; startBlock: number; interval: number }> = {};
if (has("baseSepolia")) {
  blocks.BaseSepoliaChainlinkEthPriceFeed = { chain: "baseSepolia", startBlock: 31000617, interval: BLOCK_INTERVALS.FIVE_MINUTES };
}
if (has("base")) {
  blocks.BaseChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: BLOCK_INTERVALS.FIVE_MINUTES };
  // Dummy blocks so shared blockHandlers validate when running Base-only; never run (huge interval)
  if (!has("baseSepolia")) {
    blocks.BaseSepoliaChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  }
  blocks.MainnetChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.SepoliaChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.BankrWethPrice = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.UnichainChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.InkChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.MonadChainlinkEthPriceFeed = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.MonadUsdcPrice = { chain: "base", startBlock: 36175538, interval: 99999999999 };
  blocks.ZoraUsdcPrice = { chain: "base", startBlock: 31058549, interval: 99999999999 };
  blocks.FxhWethPrice = { chain: "base", startBlock: 36175538, interval: BLOCK_INTERVALS.FIVE_MINUTES };
  blocks.NoiceWethPrice = { chain: "base", startBlock: 30530166, interval: BLOCK_INTERVALS.FIVE_MINUTES };
  blocks.EurcUsdcPrice = { chain: "base", startBlock: 38212428, interval: 99999999999 };
}
if (has("unichain")) {
  blocks.UnichainChainlinkEthPriceFeed = { chain: "unichain", startBlock: unichain.startBlock, interval: 99999999999 };
}
if (has("ink")) {
  blocks.InkChainlinkEthPriceFeed = { chain: "ink", startBlock: ink.startBlock, interval: 99999999999 };
}
if (has("monad")) {
  blocks.MonadChainlinkEthPriceFeed = { chain: "base", startBlock: monad.startBlock, interval: 99999999999 };
  blocks.MonadUsdcPrice = { chain: "monad", startBlock: monad.startBlock, interval: 99999999999 };
}

// Contract chain entries: only include chains we have (so Ponder doesn't require RPCs for unused chains)
const airlockChain: Record<string, unknown> = {};
if (has("baseSepolia")) {
  airlockChain.baseSepolia = { startBlock: 31000617, address: baseSepolia.addresses.shared.airlock };
}
if (has("base")) {
  airlockChain.base = { startBlock: 36178538, address: base.addresses.shared.airlock };
}

const derc20Chain: Record<string, unknown> = {};
if (has("base")) {
  derc20Chain.base = {
    startBlock: 36178538,
    address: factory({
      address: base.addresses.shared.airlock,
      event: getAbiItem({ abi: AirlockABI, name: "Create" }),
      parameter: "asset",
    }),
  };
}
if (has("baseSepolia")) {
  derc20Chain.baseSepolia = {
    startBlock: 31000617,
    address: factory({
      address: baseSepolia.addresses.shared.airlock,
      event: getAbiItem({ abi: AirlockABI, name: "Create" }),
      parameter: "asset",
    }),
  };
}

const multicurveInitChain: Record<string, unknown> = {};
if (has("baseSepolia")) {
  multicurveInitChain.baseSepolia = { startBlock: 31000617, address: baseSepolia.addresses.v4.v4MulticurveInitializer };
}
if (has("base")) {
  multicurveInitChain.base = { startBlock: 36178538, address: base.addresses.v4.v4MulticurveInitializer };
}

const multicurveInitHookChain: Record<string, unknown> = {};
if (has("baseSepolia")) {
  multicurveInitHookChain.baseSepolia = { startBlock: 31000617, address: baseSepolia.addresses.v4.v4MulticurveInitializerHook };
}
if (has("base")) {
  multicurveInitHookChain.base = { startBlock: 36178538, address: base.addresses.v4.v4MulticurveInitializerHook };
}

const scheduledInitChain: Record<string, unknown> = {};
if (has("baseSepolia")) {
  scheduledInitChain.baseSepolia = { startBlock: 32169922, address: baseSepolia.addresses.v4.v4ScheduledMulticurveInitializer };
}
if (has("base")) {
  scheduledInitChain.base = { startBlock: 36659443, address: base.addresses.v4.v4ScheduledMulticurveInitializer };
}

const scheduledInitHookChain: Record<string, unknown> = {};
if (has("baseSepolia")) {
  scheduledInitHookChain.baseSepolia = { startBlock: 32169922, address: baseSepolia.addresses.v4.v4ScheduledMulticurveInitializerHook };
}
if (has("base")) {
  scheduledInitHookChain.base = { startBlock: 36659444, address: base.addresses.v4.v4ScheduledMulticurveInitializerHook };
}

const v4MigratorChain: Record<string, unknown> = {};
if (has("baseSepolia")) {
  v4MigratorChain.baseSepolia = { startBlock: baseSepolia.startBlock, address: baseSepolia.addresses.v4.v4Migrator };
}
if (has("base")) {
  v4MigratorChain.base = { startBlock: base.v4StartBlock, address: base.addresses.v4.v4Migrator };
}

export default createConfig({
  database: {
    kind: "postgres",
    connectionString: getDatabaseUrl(),
    poolConfig: {
      max: 100,
    },
  },
  ordering: "multichain",
  chains,
  blocks,
  contracts: {
    Airlock: {
      abi: AirlockABI,
      chain: airlockChain,
    },
    MigrationPool: {
      abi: mergeAbis([UniswapV3PoolABI, UniswapV2PairABI]),
      chain: {},
    },
    UniswapV3Initializer: {
      abi: UniswapV3InitializerABI,
      chain: {},
    },
    UniswapV4Initializer: {
      abi: UniswapV4InitializerABI,
      chain: {},
    },
    UniswapV4Initializer2: {
      abi: UniswapV4InitializerABI,
      chain: {},
    },
    UniswapV4InitializerSelfCorrecting: {
      abi: UniswapV4InitializerABI,
      chain: {},
    },
    DERC20: {
      abi: DERC20ABI,
      chain: derc20Chain,
    },
    UniswapV3Migrator: {
      abi: UniswapV3MigratorAbi,
      chain: {},
    },
    UniswapV3Pool: {
      abi: UniswapV3PoolABI,
      chain: {},
    },
    LockableUniswapV3Pool: {
      abi: UniswapV3PoolABI,
      chain: {},
    },
    UniswapV2PairUnichain: {
      abi: UniswapV2PairABI,
      chain: {},
    },
    PoolManager: {
      abi: PoolManagerABI,
      chain: {},
    },
    UniswapV4Pool: {
      abi: DopplerABI,
      chain: {},
    },
    UniswapV4Pool2: {
      abi: DopplerABI,
      chain: {},
    },
    UniswapV4PoolSelfCorrecting: {
      abi: DopplerABI,
      chain: {},
    },
    LockableUniswapV3Initializer: {
      abi: LockableUniswapV3InitializerABI,
      chain: {},
    },
    ZoraFactory: {
      abi: ZoraFactoryABI,
      chain: {},
    },
    ZoraCoinV4: {
      abi: ZoraCoinABI,
      chain: {},
    },
    ZoraCreatorCoinV4: {
      abi: ZoraCreatorCoinABI,
      chain: {},
    },
    ZoraV4Hook: {
      abi: ZoraV4HookABI,
      chain: {},
    },
    ZoraV4CreatorCoinHook: {
      abi: ZoraV4HookABI,
      chain: {},
    },
    UniswapV4MulticurveInitializer: {
      abi: UniswapV4MulticurveInitializerABI,
      chain: multicurveInitChain,
    },
    UniswapV4MulticurveInitializerHook: {
      abi: UniswapV4MulticurveInitializerHookABI,
      chain: multicurveInitHookChain,
    },
    UniswapV4ScheduledMulticurveInitializer: {
      abi: UniswapV4ScheduledMulticurveInitializerABI,
      chain: scheduledInitChain,
    },
    UniswapV4ScheduledMulticurveInitializerHook: {
      abi: UniswapV4ScheduledMulticurveInitializerHookABI,
      chain: scheduledInitHookChain,
    },
    DopplerHookInitializer: {
      abi: DopplerHookInitializerABI,
      chain: {},
    },
    UniswapV4MigratorHook: {
      abi: V4MigratorHookABI,
      chain: {},
    },
    UniswapV4Migrator: {
      abi: V4MigratorABI,
      chain: v4MigratorChain,
    },
    DopplerHookMigrator: {
      abi: DopplerHookMigratorABI,
      chain: {},
    },
    RehypeDopplerHookMigrator: {
      abi: RehypeDopplerHookMigratorABI,
      chain: {},
    },
    DecayMulticurveInitializer: {
      abi: UniswapV4ScheduledMulticurveInitializerABI,
      chain: {},
    },
    DecayMulticurveInitializerHook: {
      abi: UniswapV4ScheduledMulticurveInitializerHookABI,
      chain: {},
    },
  },
});