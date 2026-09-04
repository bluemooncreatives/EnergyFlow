"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}) {
  const _values = React.useMemo(() =>
    Array.isArray(value)
      ? value
      : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max], [value, defaultValue, min, max])

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none py-2 data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col data-vertical:py-0 data-vertical:px-2",
        className
      )}
      {...props}>
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative grow overflow-hidden rounded-full bg-foreground/12 data-horizontal:h-[3px] data-horizontal:w-full data-vertical:h-full data-vertical:w-[3px]">
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute bg-[var(--dark-red)] select-none data-horizontal:h-full data-vertical:w-full" />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="relative block size-6 shrink-0 rounded-full bg-transparent ring-[var(--dark-red)]/20 transition-[box-shadow] select-none before:absolute before:top-1/2 before:left-1/2 before:size-[18px] before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border before:border-[var(--dark-red)] before:bg-white before:shadow-[0_1px_4px_rgba(0,0,0,0.18)] before:content-[''] hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50" />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider }
