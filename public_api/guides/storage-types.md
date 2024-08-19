---
title: Storage Types
---

# Storage Types

A storage type is something that a machine can consume or generate. All storage types have a category. For example, a storage type with ID `water` may have the category `fluid`.

Energy is registered by default. It's ID is `energy` and it's category is `energy`.

To register a new storage type, use [registerStorageType](#).

## Conventions

We recommend avoiding namespaces in storage type IDs and categories unless you need the storage type to be specific to your add-on. This is so other add-ons using the same thing will be compatible with each other.

For example, if add-on A defines `addon_a:water` and add-on B defines `addon_b:water`, then the two water types will not be compatible with each other. However, if add-on A defines `water` and add-on B defines `water`, then the two water types will be compatible because they have the same ID (this also applies to categories).

Following are some common storage type categories and some storage types that they should contain.

- Energy: `energy`
  - Energy: `energy` - Note: `energy` is defined by default in Bedrock Energistics Core but it can be overriden if necessary.
- Liquid: `fluid`
  - Lava: `lava`
  - Liquid Ammonia: `liquid_ammonia`
  - Petroleum: `oil`
  - Water: `water`
- Gas: `gas`
  - Ammonia: `ammonia`
  - Carbon Dioxide: `carbon`
  - Carbon Monoxide: `carbon_monoxide`
  - Hydrogen: `hydrogen`
  - Nitrogen: `nitrogen`
  - Oxygen: `oxygen`
  - Propane: `propane`
  - Water Vapor: `steam`
