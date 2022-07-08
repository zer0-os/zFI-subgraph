import {
  Staked,
  Unstaked,
  YieldClaimed,
  StakeLockUpdated,
  PoolWeightUpdated,
  zStakeCorePool,
} from "../generated/WildTokenPool/zStakeCorePool";
import { Deposit, Reward, Account, Pool } from "../generated/schema";
import {
  Address,
  BigInt,
  ethereum,
  log,
} from "@graphprotocol/graph-ts";

function resolveAccount(address: string): Account {
  let account = Account.load(address);
  if (!account) {
    return new Account(address);
  }
  return account as Account;
}

function resolvePool(address: string): Pool {
  let pool = Pool.load(address);
  if (!pool) {
    return new Pool(address);
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
  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  const from: Account = resolveAccount(event.params._from.toHexString());
  from.save();

  const contractUser = Address.fromString(from.id);
  const stakingPool = zStakeCorePool.bind(event.address);

  const depositLength: BigInt = stakingPool.getDepositsLength(contractUser);

  const depositId: BigInt = depositLength.minus(BigInt.fromString("1"));
  const callResult = stakingPool.try_getDeposit(contractUser, depositId);

  if (callResult.reverted) {
    log.error(
      "Could not call to get deposit for account {} with depositLength {} using index {}",
      [from.id, depositLength.toString(), depositId.toString()]
    );
  } else {
    // "from" is always staker address while "by" is sometimes the contract
    // staking on behalf of the staker. Because of this, always use "from"
    let entityId = pool.id + from.id + depositId.toString()
    const deposit: Deposit = new Deposit(entityId);
    // user account, pool address, deposit id

    deposit.by = from.id;
    deposit.depositId = depositId // string as ID but number in index below?
    deposit.tokenAmount = event.params.amount;
    deposit.lockedFrom = callResult.value.lockedFrom;
    deposit.lockedUntil = callResult.value.lockedUntil;
    deposit.pool = pool.id;
    deposit.timestamp = event.block.timestamp;
    deposit.save();
  }
}

export function handleStakeLockUpdated(event: StakeLockUpdated): void {
  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  
  const by: Account = resolveAccount(event.params._by.toHexString());
  by.save();

  const contractUser = Address.fromString(by.id);

  const stakingPool = zStakeCorePool.bind(event.address);

  const depositLength: BigInt = stakingPool.getDepositsLength(contractUser);

  const depositId: BigInt = depositLength.minus(BigInt.fromString("1"));

  let entityId = pool.id + by.id + depositId.toString()

  // same thing from above that combines user address, pool address, length-1
  // in this case, event params depositId
  const deposit: Deposit | null = Deposit.load("");

  if (deposit) {
    deposit.lockedUntil = event.params.lockedUntil;
    deposit.save();
  } else {
    log.error("Unable to load deposit with ID {} from user {}", [
      entityId,
      account.id,
    ]);
  }
}

export function handleYieldClaimed(event: YieldClaimed): void {
  const reward = new Reward(id(event));

  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  const account = resolveAccount(event.params._by.toHexString());
  account.save();

  reward.for = account.id;
  reward.tokenAmount = event.params.amount;
  reward.pool = pool.id;
  reward.timestamp = event.block.timestamp;
  reward.save();
}

export function handlePoolWeightUpdated(event: PoolWeightUpdated): void {
  const pool: Pool = resolvePool(event.address.toHexString());
  pool.weight = event.params._toVal;
  pool.save();
}
