import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Menu } from "lucide-react";

type NavItem = Readonly<{ label: string; href: string }>;

type Props = {
  logoHref?: string;
  logoAlt?: string;
  logoSrc?: string;
  items?: readonly NavItem[];
};

const DEFAULT_ITEMS: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "README", href: "/readme" },
  { label: "Docs", href: "/docs" },
];

export default function SimpleHeader({
  logoHref = "/",
  logoAlt = "Uifity Logo",
  logoSrc,
  items = DEFAULT_ITEMS,
}: Props) {
  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
        <a
          href={logoHref}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <LogoMark src={logoSrc} alt={logoAlt} />
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {items.map((it) => (
            <Button key={it.href} asChild variant="ghost" className="px-3">
              <a href={it.href}>{it.label}</a>
            </Button>
          ))}
        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <MobileNav
                items={items}
                logo={<LogoMark src={logoSrc} alt={logoAlt} />}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileNav({
  items,
  logo,
}: {
  items: readonly NavItem[];
  logo: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-4">
        <span className="shrink-0">{logo}</span>
      </div>
      <Separator />
      <nav className="grid gap-1 p-2">
        {items.map((it) => (
          <SheetClose asChild key={it.href}>
            <Button asChild variant="ghost" className="justify-start">
              <a href={it.href}>{it.label}</a>
            </Button>
          </SheetClose>
        ))}
      </nav>
    </div>
  );
}

function LogoMark({ src, alt }: { src?: string; alt?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? ""}
        loading="lazy"
        width={28}
        height={28}
        className="h-15 w-20 shrink-0"
      />
    );
  }
  return (
    <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
      <span className="text-sm">U</span>
    </span>
  );
}
