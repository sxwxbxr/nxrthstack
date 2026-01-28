"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import {
  ENCHANTMENTS,
  ITEM_TYPES,
  type ItemType,
  type Enchantment,
  getAvailableEnchantments,
  checkIncompatibility,
  calculateAnvilCost,
} from "@/lib/gamehub/minecraft-enchantments";

interface SelectedEnchantment {
  id: string;
  level: number;
}

interface SavedPlan {
  id: string;
  name: string;
  itemType: ItemType;
  enchantments: SelectedEnchantment[];
  createdAt: string;
}

const STORAGE_KEY = "minecraft-enchantment-plans";

export function EnchantmentPlannerClient() {
  const [itemType, setItemType] = useState<ItemType>("sword");
  const [selectedEnchantments, setSelectedEnchantments] = useState<SelectedEnchantment[]>([]);
  const [priorWorkPenalty, setPriorWorkPenalty] = useState(0);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [planName, setPlanName] = useState("My Enchantment Plan");
  const [showSavedPlans, setShowSavedPlans] = useState(false);

  // Load saved plans
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedPlans(JSON.parse(stored));
      } catch {
        console.error("Failed to load saved plans");
      }
    }
  }, []);

  const availableEnchantments = getAvailableEnchantments(itemType);

  const toggleEnchantment = (enchantmentId: string) => {
    const existing = selectedEnchantments.find((e) => e.id === enchantmentId);

    if (existing) {
      setSelectedEnchantments(selectedEnchantments.filter((e) => e.id !== enchantmentId));
    } else {
      const enchantment = ENCHANTMENTS.find((e) => e.id === enchantmentId);
      if (enchantment) {
        setSelectedEnchantments([
          ...selectedEnchantments,
          { id: enchantmentId, level: enchantment.maxLevel },
        ]);
      }
    }
  };

  const setEnchantmentLevel = (enchantmentId: string, level: number) => {
    setSelectedEnchantments(
      selectedEnchantments.map((e) =>
        e.id === enchantmentId ? { ...e, level } : e
      )
    );
  };

  const getConflicts = (enchantmentId: string): string[] => {
    const otherIds = selectedEnchantments
      .filter((e) => e.id !== enchantmentId)
      .map((e) => e.id);
    return checkIncompatibility(otherIds, enchantmentId);
  };

  const isSelected = (enchantmentId: string) =>
    selectedEnchantments.some((e) => e.id === enchantmentId);

  const hasConflict = (enchantmentId: string) => {
    if (!isSelected(enchantmentId)) {
      const currentIds = selectedEnchantments.map((e) => e.id);
      return checkIncompatibility(currentIds, enchantmentId).length > 0;
    }
    return false;
  };

  const totalCost = calculateAnvilCost(selectedEnchantments, priorWorkPenalty);
  const isTooExpensive = totalCost > 39;

  const clearSelection = () => {
    setSelectedEnchantments([]);
    setPriorWorkPenalty(0);
  };

  const savePlan = () => {
    const newPlan: SavedPlan = {
      id: Date.now().toString(),
      name: planName,
      itemType,
      enchantments: selectedEnchantments,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedPlans, newPlan];
    setSavedPlans(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadPlan = (plan: SavedPlan) => {
    setItemType(plan.itemType);
    setSelectedEnchantments(plan.enchantments);
    setPlanName(plan.name);
    setShowSavedPlans(false);
  };

  const deletePlan = (planId: string) => {
    const updated = savedPlans.filter((p) => p.id !== planId);
    setSavedPlans(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Reset enchantments when item type changes
  useEffect(() => {
    setSelectedEnchantments([]);
  }, [itemType]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="text-lg font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none px-1"
        />
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setShowSavedPlans(!showSavedPlans)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <Icons.FolderOpen className="h-4 w-4" />
            Saved ({savedPlans.length})
          </button>
          <button
            onClick={savePlan}
            disabled={selectedEnchantments.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Icons.Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={clearSelection}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <Icons.Trash className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Saved Plans */}
      {showSavedPlans && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold mb-3">Saved Plans</h3>
          {savedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved plans yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ITEM_TYPES.find((t) => t.id === plan.itemType)?.name} - {plan.enchantments.length} enchants
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadPlan(plan)}
                      className="p-1.5 rounded hover:bg-primary/20 text-primary"
                    >
                      <Icons.Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-1.5 rounded hover:bg-destructive/20 text-destructive"
                    >
                      <Icons.Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Type Selection */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">Select Item Type</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {ITEM_TYPES.map((item) => (
            <button
              key={item.id}
              onClick={() => setItemType(item.id)}
              className={`p-3 rounded-lg text-center transition-all ${
                itemType === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Enchantments Grid */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-4">
          Available Enchantments for {ITEM_TYPES.find((t) => t.id === itemType)?.name}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {availableEnchantments.map((enchantment) => {
            const selected = isSelected(enchantment.id);
            const conflicts = hasConflict(enchantment.id);
            const selectedData = selectedEnchantments.find((e) => e.id === enchantment.id);

            return (
              <div
                key={enchantment.id}
                className={`relative p-4 rounded-lg border transition-all ${
                  selected
                    ? "border-primary bg-primary/10"
                    : conflicts
                    ? "border-destructive/50 bg-destructive/5 opacity-50"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleEnchantment(enchantment.id)}
                      disabled={conflicts && !selected}
                      className="rounded"
                    />
                    <span className="font-medium">{enchantment.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {enchantment.isTreasure && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/20 text-yellow-600">
                        Treasure
                      </span>
                    )}
                    {enchantment.isCurse && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-500">
                        Curse
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {enchantment.description}
                </p>

                {selected && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Level:</span>
                    <select
                      value={selectedData?.level || 1}
                      onChange={(e) =>
                        setEnchantmentLevel(enchantment.id, parseInt(e.target.value))
                      }
                      className="px-2 py-1 text-xs rounded bg-muted border-0"
                    >
                      {Array.from({ length: enchantment.maxLevel }, (_, i) => i + 1).map(
                        (level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}

                {conflicts && !selected && (
                  <p className="text-xs text-destructive mt-2">
                    Conflicts with: {getConflicts(enchantment.id).join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary & Cost */}
      {selectedEnchantments.length > 0 && (
        <div className="rounded-xl border border-primary/50 bg-primary/5 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Icons.Sparkles className="h-5 w-5 text-primary" />
            Enchantment Summary
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Selected Enchantments */}
            <div>
              <h4 className="text-sm font-medium mb-3">Selected Enchantments</h4>
              <div className="space-y-2">
                {selectedEnchantments.map((selected) => {
                  const enchantment = ENCHANTMENTS.find((e) => e.id === selected.id);
                  if (!enchantment) return null;

                  const romanNumerals = ["I", "II", "III", "IV", "V"];
                  const levelDisplay =
                    enchantment.maxLevel > 1
                      ? ` ${romanNumerals[selected.level - 1] || selected.level}`
                      : "";

                  return (
                    <div
                      key={selected.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <span className="text-sm">
                        {enchantment.name}
                        {levelDisplay}
                      </span>
                      <button
                        onClick={() => toggleEnchantment(selected.id)}
                        className="p-1 rounded hover:bg-destructive/20 text-destructive"
                      >
                        <Icons.Close className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Calculation */}
            <div>
              <h4 className="text-sm font-medium mb-3">Anvil Cost</h4>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Prior work penalty:</span>
                  <select
                    value={priorWorkPenalty}
                    onChange={(e) => setPriorWorkPenalty(parseInt(e.target.value))}
                    className="px-2 py-1 text-sm rounded bg-muted border-0"
                  >
                    <option value={0}>0 (New item)</option>
                    <option value={1}>1 (1 prior operation)</option>
                    <option value={2}>2 (2 prior operations)</option>
                    <option value={3}>3 (3 prior operations)</option>
                    <option value={4}>4 (4 prior operations)</option>
                    <option value={5}>5 (5 prior operations)</option>
                  </select>
                </div>

                <div
                  className={`p-4 rounded-lg ${
                    isTooExpensive ? "bg-destructive/20" : "bg-green-500/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total XP Levels:</span>
                    <span
                      className={`text-2xl font-bold ${
                        isTooExpensive ? "text-destructive" : "text-green-500"
                      }`}
                    >
                      {totalCost}
                    </span>
                  </div>
                  {isTooExpensive && (
                    <p className="text-xs text-destructive mt-2">
                      Too expensive! Maximum anvil cost is 39 levels.
                    </p>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Note: Actual costs may vary based on enchantment order and source (book vs item).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Icons.HelpCircle className="h-4 w-4 text-primary" />
          Tips
        </h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>- Combine enchanted books first to minimize prior work penalty</li>
          <li>- Treasure enchantments can only be found, not enchanted directly</li>
          <li>- Some enchantments are mutually exclusive (highlighted conflicts)</li>
          <li>- Mending and Infinity cannot be combined on bows</li>
        </ul>
      </div>
    </div>
  );
}
