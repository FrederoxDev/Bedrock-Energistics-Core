---
title: Machine Block Tags
---

# Machine Block Tags

## Required Tags

- `fluffyalien_energisticscore:machine`

## I/O

The `fluffyalien_energisticscore:io.<StorageType>` block tag defines the I/O storage types for this machine. You can define as many I/O storage types as necessary.

Example: `fluffyalien_energisticscore:io.energy`

## Consumer

The `fluffyalien_energisticscore:consumer.<StorageType>` tells Bedrock Energistics Core to send storage of a specific type to this machine. Must be used with an I/O tag (eg. `fluffyalien_energisticscore:consumer.energy` must have `fluffyalien_energisticscore:io.energy` as well).

Example: `fluffyalien_energisticscore:consumer.energy`
