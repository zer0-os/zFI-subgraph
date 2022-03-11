# zFI-subgraph

zFI is a staking platform that has two pools. One for staking $WILD and one for staking the ETH/WILD LP token received from providing liquidity to the pool on Uniswap.

While there are two pools, there is only one subgraph codebase because they are both based off the same contracts and will be identical. There are two subgraph instances however, one for each pool. Prior, this would require two individual deployments, one for each pool. But in the `subgraph.yaml` file two `dataSources` are specified that are identical. One named `WILD Staking Pool` and the other `LP Token Staking Pool`. This way we have only one subgraph instance for two pools.

To generate and deploy your code simply run

```
yarn codegen

graph deploy --product hosted-service JamesEarle/zfi
```

**Note** The GitHub alias is currently under `JamesEarle` but will be changed to `zero-os` when the subgraphs are moved internally.
