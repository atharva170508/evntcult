"use client";

import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { useTree } from "@headless-tree/react";

import { Tree, TreeItem, TreeItemLabel } from "@/registry/default/ui/tree";

interface Item {
  name: string;
  href?: string;
  children?: string[];
  current?: boolean;
}

const items: Record<string, Item> = {
  advanced: { href: "#", name: "Advanced Usage" },
  api: { children: ["endpoints", "models"], name: "API Reference" },
  endpoints: { href: "#", name: "Endpoints" },
  examples: { href: "#", name: "Code Examples" },
  faq: { href: "#", name: "FAQ" },
  "getting-started": {
    children: ["installation", "setup"],
    name: "Getting Started",
  },
  guides: { children: ["getting-started", "advanced"], name: "User Guides" },
  installation: { current: true, href: "#", name: "Installation" },
  main: { children: ["guides", "api", "resources"], name: "Documentation" },
  models: { href: "#", name: "Data Models" },
  resources: { children: ["examples", "faq"], name: "Resources" },
  setup: { href: "#", name: "Configuration" },
};

const indent = 20;

// Find the path from root to the current item
function findPathToCurrent(
  items: Record<string, Item>,
  rootId: string,
): string[] {
  const path: string[] = [];

  function findPath(itemId: string): boolean {
    const item = items[itemId];
    if (!item) return false;

    // If this is the current item, we found the path
    if (item.current) {
      path.unshift(itemId);
      return true;
    }

    // If this item has children, search them
    if (item.children?.length) {
      for (const childId of item.children) {
        if (findPath(childId)) {
          // If we found the path in this branch, add this item to the path
          path.unshift(itemId);
          return true;
        }
      }
    }

    return false;
  }

  findPath(rootId);
  return path;
}

// Get all parent IDs that need to be expanded
const pathToCurrent = findPathToCurrent(items, "main");
// Remove the current item from the path if it's a leaf node
const expandedItems = pathToCurrent.filter((id) => items[id].children?.length);

export default function Component() {
  const tree = useTree<Item>({
    dataLoader: {
      getChildren: (itemId) => items[itemId].children ?? [],
      getItem: (itemId) => items[itemId],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
    getItemName: (item) => item.getItemData().name,
    indent,
    initialState: {
      expandedItems,
    },
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    rootItemId: "main",
  });

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <Tree indent={indent} tree={tree}>
        {tree.getItems().map((item) => {
          return (
            <TreeItem
              asChild={!!item.getItemData()?.href}
              item={item}
              key={item.getId()}
            >
              {item.getItemData()?.href ? (
                <a
                  data-current={item.getItemData().current}
                  href={item.getItemData().href}
                >
                  <TreeItemLabel className="in-data-[current=true]:bg-accent in-data-[current=true]:text-accent-foreground" />
                </a>
              ) : (
                <TreeItemLabel />
              )}
            </TreeItem>
          );
        })}
      </Tree>

      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Menu navigation tree ∙{" "}
        <a
          className="underline hover:text-foreground"
          href="https://headless-tree.lukasbach.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          API
        </a>
      </p>
    </div>
  );
}
