"use client";

import { Fragment, useId } from "react";

import { Checkbox } from "@/registry/default/ui/checkbox";
import { CheckboxTree } from "@/registry/default/ui/checkbox-tree";
import { Label } from "@/registry/default/ui/label";

interface TreeNode {
  id: string;
  label: string;
  defaultChecked?: boolean;
  children?: TreeNode[];
}

const initialTree: TreeNode = {
  children: [
    { defaultChecked: true, id: "2", label: "Mountains" },
    {
      children: [
        { id: "4", label: "Niagara Falls" },
        { defaultChecked: true, id: "5", label: "Angel Falls" },
      ],
      id: "3",
      label: "Waterfalls",
    },
    { id: "6", label: "Grand Canyon" },
  ],
  id: "1",
  label: "Natural Wonders",
};

export default function Component() {
  const id = useId();
  return (
    <div className="space-y-3">
      <CheckboxTree
        renderNode={({ node, isChecked, onCheckedChange, children }) => (
          <Fragment key={`${id}-${node.id}`}>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isChecked}
                id={`${id}-${node.id}`}
                onCheckedChange={onCheckedChange}
              />
              <Label htmlFor={`${id}-${node.id}`}>{node.label}</Label>
            </div>
            {children && <div className="ms-6 space-y-3">{children}</div>}
          </Fragment>
        )}
        tree={initialTree}
      />
    </div>
  );
}
