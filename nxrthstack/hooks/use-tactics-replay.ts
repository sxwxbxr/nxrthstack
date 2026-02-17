"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { BattleEvent } from "@/lib/gamehub/tactics/types";

export interface ReplayState {
  currentTick: number;
  maxTick: number;
  isPlaying: boolean;
  speed: number;
  events: BattleEvent[];
  currentEvents: BattleEvent[];
}

export function useTacticsReplay(events: BattleEvent[], maxTick: number) {
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const tickAccumulatorRef = useRef(0);

  const TICK_RATE = 10; // ticks per second at 1x speed

  // Events up to current tick
  const currentEvents = events.filter((e) => e.tick <= currentTick);

  // Events at exactly current tick (for animations)
  const tickEvents = events.filter((e) => e.tick === currentTick);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev && currentTick >= maxTick) {
        // Restart if at end
        setCurrentTick(0);
      }
      return !prev;
    });
  }, [currentTick, maxTick]);

  const seekToTick = useCallback((tick: number) => {
    setCurrentTick(Math.max(0, Math.min(tick, maxTick)));
  }, [maxTick]);

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();
    tickAccumulatorRef.current = 0;

    function animate(time: number) {
      const delta = (time - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = time;

      tickAccumulatorRef.current += delta * TICK_RATE * speed;

      while (tickAccumulatorRef.current >= 1) {
        tickAccumulatorRef.current -= 1;
        setCurrentTick((prev) => {
          if (prev >= maxTick) {
            setIsPlaying(false);
            return maxTick;
          }
          return prev + 1;
        });
      }

      animFrameRef.current = requestAnimationFrame(animate);
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, speed, maxTick]);

  return {
    currentTick,
    maxTick,
    isPlaying,
    speed,
    events,
    currentEvents,
    tickEvents,
    play,
    pause,
    togglePlay,
    seekToTick,
    changeSpeed,
  };
}
