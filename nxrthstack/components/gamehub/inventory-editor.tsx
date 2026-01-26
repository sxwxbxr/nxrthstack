"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { type SaveData, ITEM_NAMES } from "@/lib/pokemon/save-detector";

interface InventoryEditorProps {
  saveData: Uint8Array;
  parsedSave: SaveData;
  onDataChange: (newData: Uint8Array) => void;
}

type InventoryTab = "items" | "keyItems" | "pokeballs" | "tmHm";

export function InventoryEditor({
  saveData,
  parsedSave,
  onDataChange,
}: InventoryEditorProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>("items");

  const { inventory } = parsedSave;

  const tabs: { id: InventoryTab; label: string; count: number }[] = [
    { id: "items", label: "Items", count: inventory.items.length },
    { id: "keyItems", label: "Key Items", count: inventory.keyItems.length },
    { id: "pokeballs", label: "Poke Balls", count: inventory.pokeballs.length },
    { id: "tmHm", label: "TMs & HMs", count: inventory.tmHm.length },
  ];

  const currentItems = inventory[activeTab];

  return (
    <div className="space-y-6">
      {/* Inventory Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      {currentItems.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="grid gap-px bg-border">
            {currentItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-card px-4 py-3 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icons.Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {item.itemId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground">
                    x{item.quantity}
                  </span>
                  <button
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Edit item (coming soon)"
                    disabled
                  >
                    <Icons.Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Icons.Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No {tabs.find((t) => t.id === activeTab)?.label}
          </h3>
          <p className="mt-2 text-muted-foreground">
            This pocket is empty or couldn&apos;t be parsed.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Icons.Zap className="h-5 w-5 text-primary" />
          Quick Actions
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
            disabled
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Icons.Plus className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Add Rare Candy</p>
              <p className="text-xs text-muted-foreground">x99</p>
            </div>
          </button>
          <button
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
            disabled
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Icons.Plus className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Add Master Ball</p>
              <p className="text-xs text-muted-foreground">x99</p>
            </div>
          </button>
          <button
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
            disabled
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Icons.Plus className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Add Max Revive</p>
              <p className="text-xs text-muted-foreground">x99</p>
            </div>
          </button>
          <button
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
            disabled
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Icons.Plus className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="font-medium text-foreground">Add PP Max</p>
              <p className="text-xs text-muted-foreground">x99</p>
            </div>
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          <Icons.Info className="inline h-3 w-3 mr-1" />
          Quick actions for inventory editing coming soon
        </p>
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold text-foreground">
            {inventory.items.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Key Items</p>
          <p className="text-2xl font-bold text-foreground">
            {inventory.keyItems.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Poke Balls</p>
          <p className="text-2xl font-bold text-foreground">
            {inventory.pokeballs.reduce((sum, item) => sum + item.quantity, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">TMs & HMs</p>
          <p className="text-2xl font-bold text-foreground">
            {inventory.tmHm.length}
          </p>
        </div>
      </div>
    </div>
  );
}
