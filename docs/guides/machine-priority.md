---
title: Machine Priority
---

# Machine Priority

> [!note]
> Remember to update the machine's networks using if any tags change. The simplest way to manually trigger a network update is with the [MachineNetwork.updateWithBlock](https://fluffyalien1422.github.io/bedrock-energistics-core/api/classes/API.MachineNetwork.html#updateWithBlock) function.

## Low Priority Consumer

The `fluffyalien_energisticscore:low_priority_consumer` block tag tells Bedrock Energistics Core to **not** give this machine an equal split of the storage types it consumes during allocation.

The machine will be given a split of the remaining budget (if applicable) after the machines in the normal priority have recieved their share.

This is intended to be used for containers like batteries or tanks. See [Storage Type Containers](storage-type-containers.md).

