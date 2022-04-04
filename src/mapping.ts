import {
  Staked,
  Unstaked,
  YieldClaimed,
  StakeLockUpdated,
  PoolWeightUpdated,
} from "../generated/WildTokenPool/zStakeCorePool";
import {
  Account,
  TokenStaked,
  TokenStakeLockUpdated,
  TokenUnstaked,
  StakeYieldClaimed,
  TokenPoolWeightUpdated,
} from "../generated/schema";
import { ethereum } from "@graphprotocol/graph-ts";

function resolveAccount(address: string): Account {
  let account = Account.load(address);
  if (!account) {
    return new Account(address);
  }
  return account;
}

function id(event: ethereum.Event): string {
  const id = (event.block.number
    .toString()
    .concat("-")
    .concat(event.logIndex.toString()));
  return id;
}

export function handleStaked(event: Staked): void {
  const staked: TokenStaked = new TokenStaked(id(event));

  const by = resolveAccount(event.params._by.toHexString());
  by.save();

  const from = resolveAccount(event.params._from.toHexString());
  from.save();

  staked.by = by.id;
  staked.from = from.id;
  staked.amount = event.params.amount;
  staked.timestamp = event.block.timestamp;
  staked.save();
}

export function handleUnstaked(event: Unstaked): void {
  // Consider also adding tx hash (but not in place of log index)
  const unstaked = new TokenUnstaked(id(event));

  const by = resolveAccount(event.params._by.toHexString());
  by.save();

  const to = resolveAccount(event.params._to.toHexString());
  to.save();

  unstaked.by = by.id;
  unstaked.to = to.id;
  unstaked.amount = event.params.amount;
  unstaked.timestamp = event.block.timestamp;
  unstaked.save();
}

export function handleStakeLockUpdate(event: StakeLockUpdated): void {
  const stakeLockUpdated = new TokenStakeLockUpdated(id(event));

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  stakeLockUpdated.by = account.id;
  stakeLockUpdated.depositId = event.params.depositId;
  stakeLockUpdated.lockedFrom = event.params.lockedFrom;
  stakeLockUpdated.lockedUntil = event.params.lockedUntil;
  stakeLockUpdated.save();
}

export function handleYieldClaimed(event: YieldClaimed): void {
  const stakeYieldClaimed = new StakeYieldClaimed(id(event));

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  stakeYieldClaimed.by = account.id;
  stakeYieldClaimed.amount = event.params.amount;
  stakeYieldClaimed.timestamp = event.block.timestamp;
  stakeYieldClaimed.save();
}

export function handlePoolWeightUpdated(event: PoolWeightUpdated): void {
  const tokenPoolWeightUpdated = new TokenPoolWeightUpdated(id(event));

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  tokenPoolWeightUpdated.by = account.id;
  tokenPoolWeightUpdated.fromVal = event.params._fromVal;
  tokenPoolWeightUpdated.toVal = event.params._toVal;
  tokenPoolWeightUpdated.save();
}

// make template for multiple chains
// make a subgraph for rinkeby to deploy it to
// then add SDK functionality to read it and feed to dApp
