export type SkeletonVariant = "block" | "text" | "title" | "chip" | "input" | "circle" | "avatar";

export type SkeletonSize = "sm" | "md" | "lg" | "xl";

type SkeletonVariantConfig = {
  base: string;
  sizes: Partial<Record<SkeletonSize, string>>;
};

export const skeletonBaseClass = "bg-primary/10 motion-safe:animate-pulse";

export const skeletonVariantConfig: Record<SkeletonVariant, SkeletonVariantConfig> = {
  block: {
    base: "rounded-md",
    sizes: {
      sm: "min-h-[1.5rem]",
      md: "min-h-[2rem]",
      lg: "min-h-[3rem]",
      xl: "min-h-[4rem]",
    },
  },
  text: {
    base: "rounded-sm",
    sizes: {
      sm: "h-3",
      md: "h-4",
      lg: "h-5",
      xl: "h-6",
    },
  },
  title: {
    base: "rounded-sm",
    sizes: {
      sm: "h-5",
      md: "h-6",
      lg: "h-7",
      xl: "h-8",
    },
  },
  chip: {
    base: "rounded-full px-3",
    sizes: {
      sm: "h-5",
      md: "h-6",
      lg: "h-7",
    },
  },
  input: {
    base: "rounded-md w-full",
    sizes: {
      sm: "h-9",
      md: "h-10",
      lg: "h-12",
      xl: "h-14",
    },
  },
  circle: {
    base: "rounded-full aspect-square",
    sizes: {
      sm: "h-6 w-6",
      md: "h-8 w-8",
      lg: "h-10 w-10",
      xl: "h-12 w-12",
    },
  },
  avatar: {
    base: "rounded-full aspect-square",
    sizes: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    },
  },
};

export const defaultVariant: SkeletonVariant = "block";
export const defaultSize: SkeletonSize = "md";
