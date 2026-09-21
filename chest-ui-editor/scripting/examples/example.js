import { world, ItemStack, system } from "@minecraft/server";

const items = {
    "minecraft:oak_planks": "s",
    "minecraft:dirt": "d",
};

const recipes = {
    "sd": { result: "minecraft:oak_wood", amount: 1 },
    "ssss": { result: "minecraft:crafting_table", amount: 1 },
    "sss": { result: "minecraft:stick", amount: 4 },
    "ss": { result: "minecraft:paper", amount: 64 },
};

const recipeSlots = [0, 1, 2, 3];
const resultSlot = 4;
const crafting_entity_type = "minecraft:chest_minecart";

const inventoryCache = new Map();
const lastResultStates = new Map(); const craftedItems = new Map(); const craftedRecipes = new Map(); const dimensions = ["overworld", "nether", "the_end"].map(name => world.getDimension(name));

function countIngredients(pattern) {
    const counts = {};
    for (const char of pattern) {
        if (char !== " ") {
            counts[char] = (counts[char] || 0) + 1;
        }
    }
    return counts;
}

function checkRecipe(inventory) {
    let recipePattern = "";
    const slotItems = {};
    for (const slot of recipeSlots) {
        const item = inventory.getItem(slot);
        if (item) {
            const symbol = items[item.typeId];
            if (symbol) {
                recipePattern += symbol;

                if (!slotItems[symbol]) {
                    slotItems[symbol] = [];
                }
                slotItems[symbol].push({ slot, amount: item.amount });
            } else {
                recipePattern += " ";
            }
        } else {
            recipePattern += " ";
        }
    }

    const recipeKey = recipePattern.trim();

    const recipe = recipes[recipeKey];

    if (recipe) {

        const requiredIngredients = countIngredients(recipeKey);

        for (const symbol in requiredIngredients) {
            const required = requiredIngredients[symbol];
            const availableSlots = slotItems[symbol] || [];

            const totalAvailable = availableSlots.reduce((sum, item) => sum + item.amount, 0);

            if (totalAvailable < required) {
                return null;
            }
        }

        return {
            recipe,
            slotItems,
            requiredIngredients
        };
    }

    return null;
}

function craftItem(inventory, recipeInfo, entityId) {
    if (!inventory.getItem(resultSlot)) {
        const { recipe, slotItems, requiredIngredients } = recipeInfo;

        const resultItem = new ItemStack(recipe.result, recipe.amount);
        inventory.setItem(resultSlot, resultItem);

        craftedItems.set(entityId, true);
        craftedRecipes.set(entityId, {
            recipe,
            pattern: requiredIngredients,
            slotMapping: slotItems
        });

    }
}

function consumeIngredients(inventory, entityId, amountTaken) {
    const recipeInfo = craftedRecipes.get(entityId);
    if (!recipeInfo) return;

    const { recipe, pattern, slotMapping } = recipeInfo;

    const fraction = amountTaken / recipe.amount;
    if (fraction <= 0) return;

    for (const symbol in pattern) {
        const symbolTotal = pattern[symbol];
        const amountToConsume = Math.ceil(symbolTotal * fraction);
        let remainingToConsume = amountToConsume;

        const slots = slotMapping[symbol] || [];

        for (const slotInfo of slots) {
            if (remainingToConsume <= 0) break;

            const item = inventory.getItem(slotInfo.slot);
            if (!item) continue;

            const amountInSlot = item.amount;
            const amountToTake = Math.min(amountInSlot, remainingToConsume);

            if (amountToTake >= amountInSlot) {
                inventory.setItem(slotInfo.slot, null);
            } else {
                item.amount -= amountToTake;
                inventory.setItem(slotInfo.slot, item);
            }

            remainingToConsume -= amountToTake;
        }
    }

    if (fraction >= 1) {
        craftedRecipes.delete(entityId);
    }
}

function isEntityValid(entity) {
    try {
        return entity && typeof entity === 'object' && entity.id !== undefined;
    } catch (e) {
        return false;
    }
}

function updateInventoryCache() {
    const craftingEntities = dimensions.flatMap(dim => dim.getEntities({ type: crafting_entity_type }));

    for (const entity of craftingEntities) {
        try {
            const inventoryComponent = entity.getComponent("minecraft:inventory");
            if (inventoryComponent?.container) {
                const entityId = entity.id;
                inventoryCache.set(entityId, {
                    entity: entity,
                    container: inventoryComponent.container
                });

                if (!lastResultStates.has(entityId)) {
                    const resultItem = inventoryComponent.container.getItem(resultSlot);
                    lastResultStates.set(entityId, {
                        hasItem: !!resultItem,
                        amount: resultItem ? resultItem.amount : 0,
                        typeId: resultItem ? resultItem.typeId : null
                    });

                    if (resultItem) {
                        craftedItems.set(entityId, false);
                    }
                }
            }
        } catch (e) {
            continue;
        }
    }
}

function processCrafting() {
    for (const entityId of inventoryCache.keys()) {
        const cachedData = inventoryCache.get(entityId);
        if (!cachedData) continue;

        const { entity, container: inventory } = cachedData;

        try {
            if (!isEntityValid(entity)) {
                inventoryCache.delete(entityId);
                lastResultStates.delete(entityId);
                craftedItems.delete(entityId);
                craftedRecipes.delete(entityId);
                continue;
            }

            if (!inventory) continue;

            const currentResultItem = inventory.getItem(resultSlot);
            const currentResultState = {
                hasItem: !!currentResultItem,
                amount: currentResultItem ? currentResultItem.amount : 0,
                typeId: currentResultItem ? currentResultItem.typeId : null
            };

            const previousResultState = lastResultStates.get(entityId);
            const resultWasCrafted = craftedItems.get(entityId);

            if (previousResultState.hasItem && currentResultState.hasItem) {
                if (previousResultState.typeId === currentResultState.typeId &&
                    previousResultState.amount !== currentResultState.amount) {

                    if (resultWasCrafted === true && currentResultState.amount < previousResultState.amount) {
                        const amountTaken = previousResultState.amount - currentResultState.amount;
                        consumeIngredients(inventory, entityId, amountTaken);
                    }
                    else if (currentResultState.amount > previousResultState.amount) {
                        if (resultWasCrafted === true) {
                            const recipeInfo = craftedRecipes.get(entityId);
                            if (recipeInfo) {
                                craftedItems.set(entityId, {
                                    craftedAmount: recipeInfo.recipe.amount,
                                    totalAmount: currentResultState.amount
                                });
                            } else {
                                craftedItems.set(entityId, false);
                            }
                        }
                    }
                }
                else if (previousResultState.typeId !== currentResultState.typeId) {
                    craftedItems.set(entityId, false);
                    craftedRecipes.delete(entityId);
                }
            }
            else if (previousResultState.hasItem && !currentResultState.hasItem) {
                if (resultWasCrafted) {
                    if (typeof resultWasCrafted === 'object' && resultWasCrafted.craftedAmount) {
                        consumeIngredients(inventory, entityId, resultWasCrafted.craftedAmount);
                    }
                    else if (resultWasCrafted === true) {
                        consumeIngredients(inventory, entityId, previousResultState.amount);
                    }
                }
                craftedItems.set(entityId, false);
            }
            else if (!previousResultState.hasItem && currentResultState.hasItem) {
                craftedItems.set(entityId, false);
            }

            lastResultStates.set(entityId, currentResultState);

            const recipeInfo = checkRecipe(inventory);

            if (!currentResultState.hasItem) {
                if (recipeInfo) {
                    craftItem(inventory, recipeInfo, entityId);

                    const newResultItem = inventory.getItem(resultSlot);
                    if (newResultItem) {
                        lastResultStates.set(entityId, {
                            hasItem: true,
                            amount: newResultItem.amount,
                            typeId: newResultItem.typeId
                        });
                    }
                }
            }
            else if (resultWasCrafted === true) {
                const currentRecipeInfo = checkRecipe(inventory);

                if (!currentRecipeInfo || currentResultItem.typeId !== currentRecipeInfo.recipe.result) {
                    inventory.setItem(resultSlot, null);
                    craftedItems.set(entityId, false);
                    craftedRecipes.delete(entityId);

                    lastResultStates.set(entityId, {
                        hasItem: false,
                        amount: 0,
                        typeId: null
                    });
                }
            }
        } catch (error) {
            inventoryCache.delete(entityId);
            lastResultStates.delete(entityId);
            craftedItems.delete(entityId);
            craftedRecipes.delete(entityId);
        }
    }
}
system.runInterval(() => {
    updateInventoryCache();
    processCrafting();
}, 5);