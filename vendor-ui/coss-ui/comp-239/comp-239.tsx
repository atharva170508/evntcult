"use client";

import {
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Separator,
} from "react-aria-components";

import { Label } from "@/registry/default/ui/label";

export default function Component() {
  return (
    <div className="*:not-first:mt-2">
      <Label>Listbox with option groups</Label>
      <div className="overflow-hidden rounded-md border border-input">
        <ListBox
          aria-label="Select some foods"
          className="max-h-72 min-h-20 space-y-2 overflow-auto bg-background p-1 text-sm shadow-xs transition-[color,box-shadow]"
          defaultSelectedKeys={["lettuce", "tuna"]}
          selectionMode="multiple"
        >
          <ListBoxSection className="space-y-1">
            <Header className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
              Veggies
            </Header>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="lettuce"
            >
              Lettuce
            </ListBoxItem>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="tomato"
            >
              Tomato
            </ListBoxItem>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="onion"
            >
              Onion
            </ListBoxItem>
          </ListBoxSection>
          <Separator className="-mx-1 my-2 h-px bg-border" />
          <ListBoxSection className="space-y-1">
            <Header className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
              Protein
            </Header>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="ham"
            >
              Ham
            </ListBoxItem>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="tuna"
            >
              Tuna
            </ListBoxItem>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="tofu"
            >
              Tofu
            </ListBoxItem>
          </ListBoxSection>
          <Separator className="-mx-1 my-2 h-px bg-border" />
          <ListBoxSection className="space-y-1">
            <Header className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
              Condiments
            </Header>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="mayo"
            >
              Mayonaise
            </ListBoxItem>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="mustard"
            >
              Mustard
            </ListBoxItem>
            <ListBoxItem
              className="relative rounded px-2 py-1.5 outline-none data-disabled:cursor-not-allowed data-focus-visible:border-ring data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-disabled:opacity-50 data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50"
              id="ranch"
            >
              Ranch
            </ListBoxItem>
          </ListBoxSection>
        </ListBox>
      </div>
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://react-spectrum.adobe.com/react-aria/ListBox.html"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React Aria
        </a>
      </p>
    </div>
  );
}
