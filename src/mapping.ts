import {
  Staked,
  Unstaked,
  YieldClaimed,
  StakeLockUpdated,
  PoolWeightUpdated,
} from "../generated/zStakeCorePool/zStakeCorePool";
import {
  Account,
  TokenStaked,
  TokenStakeLockUpdated,
  TokenUnstaked,
  StakeYieldClaimed,
  TokenPoolWeightUpdated,
} from "../generated/schema";
import { ethereum } from "@graphprotocol/graph-ts";

enum Events {
  Staked,
  Unstaked,
  YieldClaimed,
  StakeLockUpdated,
  PoolWeightUpdated
}

function resolveAccount(address: string) {
  let account = Account.load(address);
  if (!account) {
    account = new Account(address);
  }
  return account;
}

function id(event: ethereum.Event) {
  const id = (event.block.number
    .toString()
    .concat("-")
    .concat(event.logIndex.toString()));
  return id;
}

export function handleStaked(event: Staked): void {
  const staked: TokenStaked = new TokenStaked(id(event));

  const account = resolveAccount(event.params._from.toHexString());
  account.save();

  staked.by = account.id;
  staked.amount = event.params.amount;
  staked.save();
}

export function handleUnstaked(event: Unstaked): void {
  // Consider also adding tx hash (but not in place of log index)
  const unstaked = new TokenUnstaked(id(event));

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  unstaked.by = account.id;
  unstaked.amount = event.params.amount;
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
