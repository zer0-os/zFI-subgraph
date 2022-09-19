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
// 0x9e2c8a5b00000000000000000000000000000000000000000000000000000000000000070
// 0x9e2c8a5b000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000029a2241af62c0000
// ethabi cargo crate does not expect function signature, but instead expects a tuple offset.
function getTxData(event: ethereum.Event): Bytes {
  //take away function signature
  const inputDataHexString = event.transaction.input.toHexString().slice(10);

  // prepend tuple offset
  // const hexStringToDecode = '0x0000000000000000000000000000000000000000000000000000000000000020' + inputDataHexString;
  return Bytes.fromByteArray(Bytes.fromHexString(inputDataHexString));
}

// 0x9e2c8a5b000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000029a2241af62c0000
function getUnstakeDepositId(event: ethereum.Event): ethereum.Value { // number or string
  const depositIdHexString = event.transaction.input.toHexString().slice(10, 74);
  const depositIdAsBytesArray = Bytes.fromByteArray(Bytes.fromHexString(depositIdHexString));
  const depositId = ethereum.decode(ethereum.ValueKind.UINT.toString(), depositIdAsBytesArray);
  // log.debug("depositId for unstaked event at {} is: {}", [event.transaction.hash.toString(), depositId!.toString()]);
  return depositId!
}

function getUnstakeAmount(event: ethereum.Event): ethereum.Value {
  const amountHexString = event.transaction.input.toHexString().slice(74);
  const amountAsBytesArray = Bytes.fromByteArray(Bytes.fromHexString(amountHexString));
  const amount = ethereum.decode(ethereum.ValueKind.UINT.toString(), amountAsBytesArray);
  // log.debug("amount for unstaked event at {}: {}", [event.transaction.hash.toString(), amount!.toString()]);
  return amount!
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
    const entityId = pool.id + from.id + depositId.toString();
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

// A) get tx hash from event if you can, then etherscan provider to get event data on chain
// B) get etherscan provider and find most recent unstaked event, get that event's data
// c) Get contract, get all of that user's deposits and iterate until there is a matching timestamp

// Update the existing deposit after it was unstaked
export function handleUnstaked(event: Unstaked): void {
  // "to" is the address to send the unstaked tokens to, usually the token holder
  const to: Account = resolveAccount(event.params._to.toHexString());
  to.save();

  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  // input bytes need to be "massaged" before reading
  // https://medium.com/@r2d2_68242/indexing-transaction-input-data-in-a-subgraph-6ff5c55abf20
  const depositId = getUnstakeDepositId(event);
  log.info("deposit id kind: {}", [depositId.kind.toString()]);
  log.info("deposit id data: {}", [depositId.data.toString()]);

  const amount = getUnstakeAmount(event);

  // // const decodedInput: ethereum.Value | null = ethereum.decode(ethereum.ValueKind.UINT.toString(), txInput);
  // // if (!decodedInput) {
  // //   log.error("Could not decode input for transaction {}", [event.transaction.hash.toHexString()])
  // //   return;
  // // }
  // log.info("Decoded input kind: {}", [decodedInput.kind.toString()]);
  // log.info("Decoded input data: {}", [decodedInput.data.toString()]);
  // log.info("Decoded input as BigInt: {}", [decodedInput.toBigInt().toString()]);
  // log.info("Decoded input as int32: {}", [decodedInput.toBigIntArray().toString()]);
  // log.info('First decoded field: {}', [decodedInput.toTuple()[0].toString()]);
  // log.info('Second decoded field: {}', [decodedInput.toTuple()[1].toString()]);

  // const depositId = txInput.at(0).toString()
  // log.debug("DepositId for unstaked event is: {}", [depositId]);
  const entityId = pool.id + to.id + depositId.data.toString();
  // // log.debug("EntityId for unstaked event is: {}", [entityId]);

  const deposit = Deposit.load(entityId);

  if (!deposit) {
    log.error(
      "No deposit with id {} found for user with address {} in pool address {}",
      [depositId.toString(), to.id, pool.id]
    );
  } else {
    deposit.tokenAmount = deposit.tokenAmount.minus(BigInt.fromU64(amount.data));
    deposit.save();
  }
}

export function handleStakeLockUpdated(event: StakeLockUpdated): void {
  const pool: Pool = resolvePool(event.address.toHexString());
  pool.save();

  const by: Account = resolveAccount(event.params._by.toHexString());
  by.save();

  const stakingPool = zStakeCorePool.bind(event.address);
  const contractUser = Address.fromString(by.id);

  const depositLength: BigInt = stakingPool.getDepositsLength(contractUser);

  const depositId: BigInt = depositLength.minus(BigInt.fromString("1"));

  // form entityId to be unique for both pools per user
  const entityId = pool.id + by.id + depositId.toString()

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
