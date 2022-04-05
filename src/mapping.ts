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
  Pool,
} from "../generated/schema";
import { ethereum, log } from "@graphprotocol/graph-ts";

function resolveAccount(address: string): Account {
  let account = Account.load(address);
  if (!account) {
    return new Account(address);
  }
  return account as Account;
}

function resolvePool(address: string): Pool {
  let pool = Pool.load(address);
  if(!pool) {
    return new Pool(address)
  }
  return pool as Pool;
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

  const pool: Pool = resolvePool(event.address.toHexString())
  pool.save();

  // "from" is always staker address while "by" is sometimes the contract
  // staking on behalf of the staker. Because of this, always use "from"
  const from = resolveAccount(event.params._from.toHexString());
  from.save();

  deposit.by = from.id;
  deposit.amount = event.params.amount;
  deposit.pool = pool.id;
  deposit.txHash = event.transaction.hash;
  deposit.timestamp = event.block.timestamp;
  deposit.save();
}

export function handleUnstaked(event: Unstaked): void {
  const unstaked = new UnstakedDeposit(id(event));

  const pool: Pool = resolvePool(event.address.toHexString())
  pool.save();

  // "to" is always staker address and so is "by", because nobody
  // calls to unstake other than the staker, but use "to" for consistency
  // with the above use of "from"
  const to = resolveAccount(event.params._to.toHexString());
  to.save();

  unstaked.by = to.id;
  unstaked.amount = event.params.amount;
  unstaked.pool = pool.id;
  unstaked.txHash = event.transaction.hash;
  unstaked.timestamp = event.block.timestamp;
  unstaked.save();
}

export function handleStakeLockUpdate(event: StakeLockUpdated): void {
  const stakeLockUpdated = new TokenStakeLockUpdated(id(event));

  const pool: Pool = resolvePool(event.address.toHexString())
  pool.save();

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  stakeLockUpdated.by = account.id;
  stakeLockUpdated.depositId = event.params.depositId;
  stakeLockUpdated.lockedFrom = event.params.lockedFrom;
  stakeLockUpdated.lockedUntil = event.params.lockedUntil;
  stakeLockUpdated.pool = pool.id;
  stakeLockUpdated.txHash = event.transaction.hash;
  stakeLockUpdated.timestamp = event.block.timestamp;
  stakeLockUpdated.save();
}

export function handleYieldClaimed(event: YieldClaimed): void {
  const reward = new Reward(id(event));

  const pool: Pool = resolvePool(event.address.toHexString())
  pool.save();

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  reward.for = account.id;
  reward.amount = event.params.amount;
  reward.pool = pool.id;
  reward.txHash = event.transaction.hash;
  reward.timestamp = event.block.timestamp;
  reward.save();
}

export function handlePoolWeightUpdated(event: PoolWeightUpdated): void { // no
  const tokenPoolWeightUpdated = new TokenPoolWeightUpdated(id(event));

  const pool: Pool = resolvePool(event.address.toHexString())
  pool.save();

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  tokenPoolWeightUpdated.by = account.id;
  tokenPoolWeightUpdated.fromVal = event.params._fromVal;
  tokenPoolWeightUpdated.toVal = event.params._toVal;
  tokenPoolWeightUpdated.pool = pool.id;
  tokenPoolWeightUpdated.txHash = event.transaction.hash;
  tokenPoolWeightUpdated.timestamp = event.block.timestamp;
  tokenPoolWeightUpdated.save();
}
