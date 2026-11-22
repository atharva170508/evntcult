"use client";

import {
  checkboxesFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";

import { Checkbox } from "@/registry/default/ui/checkbox";
import { Tree, TreeItem, TreeItemLabel } from "@/registry/default/ui/tree";

interface Item {
  name: string;
  children?: string[];
}

const items: Record<string, Item> = {
  apis: { name: "APIs" },
  backend: { children: ["apis", "infrastructure"], name: "Backend" },
  company: {
    children: ["engineering", "marketing", "operations"],
    name: "Company",
  },
  components: { name: "Components" },
  content: { name: "Content" },
  "design-system": {
    children: ["components", "tokens", "guidelines"],
    name: "Design System",
  },
  engineering: {
    children: ["frontend", "backend", "platform-team"],
    name: "Engineering",
  },
  finance: { name: "Finance" },
  frontend: { children: ["design-system", "web-platform"], name: "Frontend" },
  guidelines: { name: "Guidelines" },
  hr: { name: "HR" },
  infrastructure: { name: "Infrastructure" },
  marketing: { children: ["content", "seo"], name: "Marketing" },
  operations: { children: ["hr", "finance"], name: "Operations" },
  "platform-team": { name: "Platform Team" },
  seo: { name: "SEO" },
  tokens: { name: "Tokens" },
  "web-platform": { name: "Web Platform" },
};

const indent = 20;

export default function Component() {
  const tree = useTree<Item>({
    dataLoader: {
      getChildren: (itemId) => items[itemId].children ?? [],
      getItem: (itemId) => items[itemId],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      checkboxesFeature,
      hotkeysCoreFeature,
    ],
    getItemName: (item) => item.getItemData().name,
    indent,
    initialState: {
      checkedItems: ["components", "tokens"],
      expandedItems: ["engineering", "frontend", "design-system"],
    },
    isItemFolder: (item) => (item.getItemData()?.children?.length ?? 0) > 0,
    rootItemId: "company",
  });

  return (
    <div className="flex h-full flex-col gap-2 *:first:grow">
      <Tree indent={indent} tree={tree}>
        {tree.getItems().map((item) => {
          return (
            <div
              className="flex items-center gap-1.5 not-last:pb-0.5"
              key={item.getId()}
            >
              <Checkbox
                checked={
                  {
                    checked: true,
                    indeterminate: "indeterminate" as const,
                    unchecked: false,
                  }[item.getCheckedState()]
                }
                onCheckedChange={(checked) => {
                  const checkboxProps = item.getCheckboxProps();
                  checkboxProps.onChange?.({ target: { checked } });
                }}
              />
              <TreeItem className="flex-1 not-last:pb-0" item={item}>
                <TreeItemLabel />
              </TreeItem>
            </div>
          );
        })}
      </Tree>

      <div className="space-y-2">
        <p
          aria-live="polite"
          className="mt-2 text-muted-foreground text-xs"
          role="region"
        >
          Tree with checkboxes on the left ∙{" "}
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
    </div>
  );
}
