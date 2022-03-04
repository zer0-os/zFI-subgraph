# zFI-subgraph

zFI is a staking platform that has two pools. One for staking $WILD and one for staking the ETH/WILD LP token received from providing liquidity to the pool on Uniswap.

While there are two pools, there is only one subgraph codebase because they are both based off the same contracts and will be identical. There are two subgraph instances however, one for each pool, so this necessitates doing two deployments each time changes are made.

```
graph deploy --product hosted-service JamesEarle/zfiwildpool

graph deploy --product hosted-service JamesEarle/zfilptokenpool
```

**Note** The GitHub alias is currently under `JamesEarle` but will be changed to `zero-os` when the subgraphs are moved internally.
