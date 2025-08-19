import * as React from "react";

export type BreakpointName = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

const BP = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
} as const;

function useMedia(query: string): boolean {
  const get = (): boolean =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;

  const [matches, setMatches] = React.useState<boolean>(get);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent): void => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export type BreakpointState = {
  current: BreakpointName;
  isMobile: boolean; // < 768
  isTablet: boolean; // 768–1023
  isDesktop: boolean; // >= 1024
  up: { sm: boolean; md: boolean; lg: boolean; xl: boolean; xxl: boolean };
  down: { sm: boolean; md: boolean; lg: boolean; xl: boolean; xxl: boolean };
};

export function useBreakpointTW(): BreakpointState {
  const upSm = useMedia(`(min-width:${BP.sm}px)`);
  const upMd = useMedia(`(min-width:${BP.md}px)`);
  const upLg = useMedia(`(min-width:${BP.lg}px)`);
  const upXl = useMedia(`(min-width:${BP.xl}px)`);
  const upXxl = useMedia(`(min-width:${BP.xxl}px)`);

  const downSm = useMedia(`(max-width:${BP.sm - 1}px)`);
  const downMd = useMedia(`(max-width:${BP.md - 1}px)`);
  const downLg = useMedia(`(max-width:${BP.lg - 1}px)`);
  const downXl = useMedia(`(max-width:${BP.xl - 1}px)`);
  const downXxl = useMedia(`(max-width:${BP.xxl - 1}px)`);

  const current: BreakpointName = upXxl
    ? "xxl"
    : upXl
      ? "xl"
      : upLg
        ? "lg"
        : upMd
          ? "md"
          : upSm
            ? "sm"
            : "xs";

  const isDesktop = upLg; // >= 1024
  const isMobile = !upMd; // < 768
  const isTablet = !isMobile && !isDesktop; // 768–1023

  return {
    current,
    isMobile,
    isTablet,
    isDesktop,
    up: { sm: upSm, md: upMd, lg: upLg, xl: upXl, xxl: upXxl },
    down: { sm: downSm, md: downMd, lg: downLg, xl: downXl, xxl: downXxl },
  };
}
