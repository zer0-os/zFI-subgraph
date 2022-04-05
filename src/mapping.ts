import {
  Staked,
  Unstaked,
  YieldClaimed,
  StakeLockUpdated,
  PoolWeightUpdated,
} from "../generated/WildTokenPool/zStakeCorePool";
import {
  Deposit,
  UnstakedDeposit,
  Reward,
  Account,
  TokenStakeLockUpdated,
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
  const id = event.block.number
    .toString()
    .concat("-")
    .concat(event.logIndex.toString());
  return id;
}

export function handleStaked(event: Staked): void {
  // No "index" or "lockTime" on event
  const deposit: Deposit = new Deposit(id(event));

  // "from" is always staker address while "by" is sometimes the contract
  // staking on behalf of the staker. Because of this, always use "from"
  const from = resolveAccount(event.params._from.toHexString());
  from.save();

  deposit.by = from.id;
  deposit.amount = event.params.amount;
  deposit.pool = event.address.toHexString();
  deposit.txHash = event.transaction.hash;
  deposit.timestamp = event.block.timestamp;
  deposit.save();
}

export function handleUnstaked(event: Unstaked): void {
  const unstaked = new UnstakedDeposit(id(event));

  // "to" is always staker address and so is "by", because nobody
  // calls to unstake other than the staker, but use "to" for consistency
  // with the above use of "from"
  const to = resolveAccount(event.params._to.toHexString());
  to.save();

  unstaked.by = to.id;
  unstaked.amount = event.params.amount;
  unstaked.pool = event.address.toHexString();
  unstaked.txHash = event.transaction.hash;
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
  stakeLockUpdated.pool = event.address.toHexString();
  stakeLockUpdated.txHash = event.transaction.hash;
  stakeLockUpdated.timestamp = event.block.timestamp;
  stakeLockUpdated.save();
}

// Fired on staking for the second or more time, unstaking
// also ofc processRewards
export function handleYieldClaimed(event: YieldClaimed): void {
  const reward = new Reward(id(event));

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  reward.for = account.id;
  reward.amount = event.params.amount;
  reward.pool = event.address.toHexString();
  reward.txHash = event.transaction.hash;
  reward.timestamp = event.block.timestamp;
  reward.save();
}

export function handlePoolWeightUpdated(event: PoolWeightUpdated): void { // no
  const tokenPoolWeightUpdated = new TokenPoolWeightUpdated(id(event));

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  tokenPoolWeightUpdated.by = account.id;
  tokenPoolWeightUpdated.fromVal = event.params._fromVal;
  tokenPoolWeightUpdated.toVal = event.params._toVal;
  tokenPoolWeightUpdated.pool = event.address.toHexString();
  tokenPoolWeightUpdated.txHash = event.transaction.hash;
  tokenPoolWeightUpdated.timestamp = event.block.timestamp;
  tokenPoolWeightUpdated.save();
}
