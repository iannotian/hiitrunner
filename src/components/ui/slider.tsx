"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [value, setValue] = React.useState<{ left: number; right: number }>({
    left: props.defaultValue?.[0] || 170,
    right: props.defaultValue?.[1] || 180,
  });

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center pt-7",
        className
      )}
      onValueChange={(value) => {
        setValue({ left: value[0], right: value[1] });
      }}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <p className="bg-yellow-400 text-yellow-900 font-semibold text-sm px-1 absolute bottom-7 -translate-x-1/4">
          {value.left}
        </p>
      </SliderPrimitive.Thumb>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
        <p className="bg-yellow-400 text-yellow-900 font-semibold text-sm px-1 absolute bottom-7 -translate-x-1/4">
          {value.right}
        </p>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
