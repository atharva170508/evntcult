"use client";

import {
  MinusIcon,
  PlusIcon,
  Volume1Icon,
  Volume2Icon,
  VolumeIcon,
  VolumeXIcon,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [volume, setVolume] = useState(3); // Initialize volume state (0-9)

  const decreaseVolume = () => setVolume((prev) => Math.max(0, prev - 1));
  const increaseVolume = () => setVolume((prev) => Math.min(6, prev + 1));

  // Optimized volume icon selection
  const Icon =
    volume === 0
      ? VolumeXIcon
      : volume < 3
        ? VolumeIcon
        : volume < 5
          ? Volume1Icon
          : Volume2Icon;

  return (
    <div
      aria-labelledby="volume-control"
      className="inline-flex items-center"
      role="group"
    >
      <span className="sr-only" id="volume-control">
        Volume Control
      </span>
      <Button
        aria-label="Decrease volume"
        className="rounded-full"
        disabled={volume === 0}
        onClick={decreaseVolume}
        size="icon"
        variant="outline"
      >
        <MinusIcon aria-hidden="true" size={16} />
      </Button>
      <div
        aria-live="polite"
        className="flex items-center px-3 font-medium text-sm tabular-nums"
      >
        <Icon aria-hidden="true" className="opacity-60" size={16} />
        <span aria-label={`Current volume is ${volume}`} className="ms-2">
          {volume}
        </span>
      </div>
      <Button
        aria-label="Increase volume"
        className="rounded-full"
        disabled={volume === 6}
        onClick={increaseVolume}
        size="icon"
        variant="outline"
      >
        <PlusIcon aria-hidden="true" size={16} />
      </Button>
    </div>
  );
}
