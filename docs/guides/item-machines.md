---
title: Item Machines
---

# Item Machines

Item machines are a standardized system for storing storage types inside machines. Register an item machine with the [registerItemMachine](https://fluffyalien1422.github.io/bedrock-energistics-core/api/functions/API.registerItemMachine.html) function.

```js
// Register an item machine that can store energy.
registerItemMachine({
  description: {
    // There must be an item with this ID.
    id: "example:my_item_machine",
    defaultIo: {
      categories: ["energy"],
    },
  },
});
```

Interface with item machines via the [ItemMachine](https://fluffyalien1422.github.io/bedrock-energistics-core/api/classes/API.ItemMachine.html) class.

```js
// The following code assumes that `player` is holding an item machine.
const inventory = player.getComponent("inventory");
const itemMachine = new ItemMachine(inventory, player.selectedSlotIndex);

// Add 1 `energy`.
const storedEnergy = await itemMachine.getStorage("energy");
itemMachine.setStorage("energy", storedEnergy + 1);
```

