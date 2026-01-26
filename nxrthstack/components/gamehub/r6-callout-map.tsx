"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import {
  R6Map,
  Callout,
  r6Maps,
  getCalloutsByFloor,
  searchCallouts,
} from "@/lib/r6/callout-maps-data";

const calloutTypeColors: Record<Callout["type"], string> = {
  room: "bg-blue-500 border-blue-400",
  hallway: "bg-yellow-500 border-yellow-400",
  stairway: "bg-green-500 border-green-400",
  outside: "bg-gray-500 border-gray-400",
  objective: "bg-red-500 border-red-400",
};

const calloutTypeLabels: Record<Callout["type"], string> = {
  room: "Room",
  hallway: "Hallway",
  stairway: "Stairs",
  outside: "Outside",
  objective: "Objective",
};

export function R6CalloutMap() {
  const [selectedMap, setSelectedMap] = useState<R6Map>(r6Maps[0]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [hoveredCallout, setHoveredCallout] = useState<Callout | null>(null);
  const [selectedCallout, setSelectedCallout] = useState<Callout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLabels, setShowLabels] = useState(true);
  const [filterType, setFilterType] = useState<Callout["type"] | "all">("all");

  const currentFloorCallouts = useMemo(() => {
    let callouts = getCalloutsByFloor(selectedMap, selectedFloor);
    if (filterType !== "all") {
      callouts = callouts.filter((c) => c.type === filterType);
    }
    return callouts;
  }, [selectedMap, selectedFloor, filterType]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchCallouts(searchQuery);
  }, [searchQuery]);

  const handleMapChange = (map: R6Map) => {
    setSelectedMap(map);
    setSelectedFloor(map.floors > 1 ? 1 : 0);
    setSelectedCallout(null);
  };

  const handleSearchResultClick = (map: R6Map, callout: Callout) => {
    setSelectedMap(map);
    setSelectedFloor(callout.floor);
    setSelectedCallout(callout);
    setSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Map Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Map</label>
          <select
            value={selectedMap.id}
            onChange={(e) => {
              const map = r6Maps.find((m) => m.id === e.target.value);
              if (map) handleMapChange(map);
            }}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            {r6Maps.map((map) => (
              <option key={map.id} value={map.id}>
                {map.name}
              </option>
            ))}
          </select>
        </div>

        {/* Floor Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Floor</label>
          <div className="flex gap-1">
            {selectedMap.floorNames.map((name, index) => (
              <button
                key={index}
                onClick={() => setSelectedFloor(index)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-2 text-xs font-medium transition-all border",
                  selectedFloor === index
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:bg-accent"
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="space-y-2 relative">
          <label className="text-sm font-medium text-muted-foreground">Search Callouts</label>
          <div className="relative">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all maps..."
              className="w-full rounded-lg border border-border bg-card pl-10 pr-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-card shadow-lg"
              >
                {searchResults.slice(0, 10).map(({ map, callout }) => (
                  <button
                    key={`${map.id}-${callout.id}`}
                    onClick={() => handleSearchResultClick(map, callout)}
                    className="w-full px-4 py-2 text-left hover:bg-accent transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-foreground">{callout.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {map.name} - {map.floorNames[callout.floor]}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        calloutTypeColors[callout.type]
                      )}
                    >
                      {calloutTypeLabels[callout.type]}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Options</label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all border flex items-center justify-center gap-1",
                showLabels
                  ? "bg-primary/20 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:bg-accent"
              )}
            >
              <Icons.Eye className="w-3.5 h-3.5" />
              Labels
            </button>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as Callout["type"] | "all")}
              className="flex-1 rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="objective">Objectives</option>
              <option value="room">Rooms</option>
              <option value="hallway">Hallways</option>
              <option value="stairway">Stairs</option>
              <option value="outside">Outside</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-muted-foreground">Legend:</span>
        {(Object.keys(calloutTypeColors) as Callout["type"][]).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded-full border", calloutTypeColors[type])} />
            <span className="text-muted-foreground text-xs">{calloutTypeLabels[type]}</span>
          </div>
        ))}
      </div>

      {/* Map Display */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Interactive Map Area */}
        <div className="lg:col-span-2">
          <div className="relative bg-card rounded-2xl border border-border overflow-hidden">
            {/* Map Header */}
            <div className="absolute top-4 left-4 z-20 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
              <h3 className="font-bold text-foreground">{selectedMap.name}</h3>
              <p className="text-xs text-muted-foreground">
                {selectedMap.floorNames[selectedFloor]}
              </p>
            </div>

            {/* Map Grid */}
            <div
              className="relative w-full aspect-[4/3] bg-gradient-to-br from-zinc-900 to-zinc-950"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: "10% 10%",
              }}
            >
              {/* Floor Plan Outline - Simplified representation */}
              <div className="absolute inset-8 border-2 border-dashed border-border/30 rounded-lg" />

              {/* Callout Points */}
              {currentFloorCallouts.map((callout) => (
                <motion.div
                  key={callout.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    left: `${callout.x}%`,
                    top: `${callout.y}%`,
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <button
                    onMouseEnter={() => setHoveredCallout(callout)}
                    onMouseLeave={() => setHoveredCallout(null)}
                    onClick={() => setSelectedCallout(callout)}
                    className={cn(
                      "relative group",
                      selectedCallout?.id === callout.id && "z-20"
                    )}
                  >
                    {/* Callout Dot */}
                    <motion.div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 transition-all",
                        calloutTypeColors[callout.type],
                        selectedCallout?.id === callout.id && "ring-2 ring-white ring-offset-2 ring-offset-background"
                      )}
                      whileHover={{ scale: 1.5 }}
                      animate={
                        selectedCallout?.id === callout.id
                          ? { scale: [1, 1.2, 1] }
                          : {}
                      }
                      transition={
                        selectedCallout?.id === callout.id
                          ? { repeat: Infinity, duration: 1 }
                          : {}
                      }
                    />

                    {/* Label */}
                    {showLabels && (
                      <span
                        className={cn(
                          "absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-all",
                          "bg-background/90 text-foreground border border-border",
                          hoveredCallout?.id === callout.id || selectedCallout?.id === callout.id
                            ? "opacity-100"
                            : "opacity-70"
                        )}
                      >
                        {callout.shortName || callout.name}
                      </span>
                    )}

                    {/* Hover Tooltip */}
                    <AnimatePresence>
                      {hoveredCallout?.id === callout.id && !showLabels && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-lg bg-background border border-border shadow-lg z-30 whitespace-nowrap"
                        >
                          <p className="font-medium text-sm text-foreground">{callout.name}</p>
                          <p className="text-xs text-muted-foreground">{calloutTypeLabels[callout.type]}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Stats Badge */}
            <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border">
              <p className="text-xs text-muted-foreground">
                {currentFloorCallouts.length} callouts on this floor
              </p>
            </div>
          </div>
        </div>

        {/* Callout List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Callouts</h3>
            <span className="text-xs text-muted-foreground">
              {currentFloorCallouts.length} total
            </span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {currentFloorCallouts.map((callout) => (
              <motion.button
                key={callout.id}
                onClick={() => setSelectedCallout(callout)}
                onMouseEnter={() => setHoveredCallout(callout)}
                onMouseLeave={() => setHoveredCallout(null)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  selectedCallout?.id === callout.id
                    ? "bg-primary/10 border-primary/30"
                    : hoveredCallout?.id === callout.id
                      ? "bg-accent border-border"
                      : "bg-card border-border hover:bg-accent"
                )}
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full border",
                        calloutTypeColors[callout.type]
                      )}
                    />
                    <div>
                      <p className="font-medium text-foreground text-sm">{callout.name}</p>
                      {callout.shortName && callout.shortName !== callout.name && (
                        <p className="text-xs text-muted-foreground">"{callout.shortName}"</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {calloutTypeLabels[callout.type]}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Selected Callout Details */}
          <AnimatePresence>
            {selectedCallout && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-foreground">{selectedCallout.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedMap.floorNames[selectedCallout.floor]}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCallout(null)}
                    className="p-1 rounded hover:bg-accent transition-colors"
                  >
                    <Icons.Close className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        calloutTypeColors[selectedCallout.type]
                      )}
                    >
                      {calloutTypeLabels[selectedCallout.type]}
                    </span>
                  </div>
                  {selectedCallout.shortName && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Short call:</span>
                      <span className="font-medium text-foreground">"{selectedCallout.shortName}"</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Position:</span>
                    <span className="font-mono text-xs text-foreground">
                      X: {selectedCallout.x}% Y: {selectedCallout.y}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* All Maps Quick View */}
      <div className="pt-6 border-t border-border">
        <h3 className="font-semibold text-foreground mb-4">Quick Map Selection</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {r6Maps.map((map) => (
            <button
              key={map.id}
              onClick={() => handleMapChange(map)}
              className={cn(
                "p-3 rounded-lg border text-center transition-all",
                selectedMap.id === map.id
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:bg-accent"
              )}
            >
              <p className="font-medium text-sm text-foreground truncate">{map.name}</p>
              <p className="text-xs text-muted-foreground">{map.callouts.length} callouts</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
