---
title: Machine Block Tags
---

# Machine Block Tags

Note: remember to update the machine's networks using [updateMachineNetworks](https://fluffyalien1422.github.io/bedrock-energistics-core/functions/API.updateMachineNetworks.html) if any tags change.

## Required Tags

- `fluffyalien_energisticscore:machine`

## I/O

The `fluffyalien_energisticscore:io.<StorageTypeCategory>` block tag defines the storage type categories for this machine. You can define as many categories as necessary.

Note: this tag expects a storage type category, not an ID. For example, a storage type with ID `water` may have the category `fluid`. See [Storage Types](storage-types.md) for more information.

Tag examples: `fluffyalien_energisticscore:io.energy`, `fluffyalien_energisticscore:io.fluid`

## Consumer

The `fluffyalien_energisticscore:consumer.<StorageType>` tells Bedrock Energistics Core to send storage of a specific type to this machine. Must be used with an I/O tag.

For example, `fluffyalien_energisticscore:consumer.energy` must have `fluffyalien_energisticscore:io.energy` as well because the category of `energy` is `energy`. See [Storage Types](storage-types.md) for more information.

Tag examples: `fluffyalien_energisticscore:consumer.energy`, `fluffyalien_energisticscore:consumer.water`
