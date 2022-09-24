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
  Bytes,
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

// Create an entity for the Deposit which just got made
export function handleStaked(event: Staked): void {
  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  // "from" is always staker address while "by" is sometimes the contract
  // staking on behalf of the staker. Because of this, always use "from"
  const from: Account = resolveAccount(event.params._from.toHexString());
  from.save();

  const stakingPool = zStakeCorePool.bind(event.address);
  const contractUser = Address.fromString(from.id);

  const depositLength: BigInt = stakingPool.getDepositsLength(contractUser);

  // There is always at least one deposit because for this to be triggered
  // a deposit has been made
  const depositId: BigInt = depositLength.minus(BigInt.fromString("1"));
  log.info("DepositId for staked event is: {}", [depositId.toString()]);

  // Confirm the existence of that deposit on chain
  const callResult = stakingPool.try_getDeposit(contractUser, depositId);

  if (callResult.reverted) {
    log.error(
      "Could not call to get deposit for account {} with depositLength {} using index {}",
      [from.id, depositLength.toString(), depositId.toString()]
    );
  } else {
    const entityId = pool.id.concat(from.id).concat(depositId.toString());
    log.info("EntityId for staked event is: {}", [entityId.toString()]);
    const deposit: Deposit = new Deposit(entityId);

    deposit.by = from.id;
    deposit.depositId = depositId;
    deposit.tokenAmount = event.params.amount;
    deposit.lockedFrom = callResult.value.lockedFrom;
    deposit.lockedUntil = callResult.value.lockedUntil;
    deposit.pool = pool.id;
    deposit.timestamp = event.block.timestamp;
    deposit.save();
  }
}

// Update the existing deposit after it was unstaked
export function handleUnstaked(event: Unstaked): void {
  // "to" is the address to send the unstaked tokens to, usually the token holder
  const to: Account = resolveAccount(event.params._to.toHexString());
  to.save();

  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  const depositIdHexString = event.transaction.input.toHexString().slice(10, 74);
  const depositIdAsBytesArray = Bytes.fromByteArray(Bytes.fromHexString(depositIdHexString));
  const depositIdAsEthereumValue = ethereum.decode(ethereum.ValueKind.UINT.toString(), depositIdAsBytesArray);

  if (!depositIdAsEthereumValue) {
    log.error("Could not decode depositId {} for user {} in pool {}", [depositIdAsBytesArray.toHexString(), to.id, pool.id]);
    return;
  }

  const depositId = depositIdAsEthereumValue.toBigInt().toString();

  const entityId = pool.id.concat(to.id).concat(depositId);
  const deposit = Deposit.load(entityId);

  if (deposit) {
    // The contract verifies this amount must be equal to or less than the deposit
    // So it is safe to assume this will never be a negative value.
    deposit.tokenAmount = deposit.tokenAmount.minus(event.params.amount);
    deposit.save();
  } else {
    log.error(
      "No deposit found with id {} for user with address {} in pool {}",
      [depositId, to.id, pool.id]
    );
  }
}

export function handleStakeLockUpdated(event: StakeLockUpdated): void {
  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  const by: Account = resolveAccount(event.params._by.toHexString());
  by.save();

  // also has to be updated
  const depositId = event.params.depositId;

  // form entityId to be unique for both pools per user
  const entityId = pool.id.concat(by.id).concat(depositId.toString());

  // same thing from above that combines user address, pool address, length-1
  // in this case, event params depositId
  const deposit: Deposit | null = Deposit.load(entityId);

  if (deposit) {
    deposit.lockedUntil = event.params.lockedUntil;
    deposit.save();
  } else {
    log.error("Unable to load deposit with ID {} from user {}", [
      entityId,
      by.id,
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
