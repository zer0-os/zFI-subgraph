import {
  Staked,
  Unstaked
} from "../generated/zStakeCorePool/zStakeCorePool"
import { TokenStaked, TokenUnstaked } from "../generated/schema"

export function handleStaked(event: Staked): void {
  // Consider also adding tx hash (but not in place of log index)
  let staked = new TokenStaked(event.block.number.toString().concat("-").concat(event.logIndex.toString()));

  staked.by = event.params._by;
  staked.from = event.params._from;
  staked.amount = event.params.amount;

  staked.save();
}

export function handleUnstaked(event: Unstaked): void {
  let unstaked = new TokenUnstaked(event.block.number.toString().concat("-").concat(event.logIndex.toString()));

  unstaked.by = event.params._by;
  unstaked.to = event.params._to;
  unstaked.amount = event.params.amount;

  unstaked.save();
}
