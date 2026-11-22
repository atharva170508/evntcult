import { BoxIcon, HouseIcon, PanelsTopLeftIcon } from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs";

export default function Component() {
  return (
    <Tabs
      className="w-full flex-row"
      defaultValue="tab-1"
      orientation="vertical"
    >
      <TabsList className="flex-col gap-1 rounded-none bg-transparent px-1 py-0 text-foreground">
        <TabsTrigger
          className="after:-ms-1 relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:w-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
          value="tab-1"
        >
          <HouseIcon
            aria-hidden="true"
            className="-ms-0.5 me-1.5 opacity-60"
            size={16}
          />
          Overview
        </TabsTrigger>
        <TabsTrigger
          className="after:-ms-1 relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:w-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
          value="tab-2"
        >
          <PanelsTopLeftIcon
            aria-hidden="true"
            className="-ms-0.5 me-1.5 opacity-60"
            size={16}
          />
          Projects
        </TabsTrigger>
        <TabsTrigger
          className="after:-ms-1 relative w-full justify-start after:absolute after:inset-y-0 after:start-0 after:w-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:hover:bg-accent data-[state=active]:after:bg-primary"
          value="tab-3"
        >
          <BoxIcon
            aria-hidden="true"
            className="-ms-0.5 me-1.5 opacity-60"
            size={16}
          />
          Packages
        </TabsTrigger>
      </TabsList>
      <div className="grow rounded-md border text-start">
        <TabsContent value="tab-1">
          <p className="px-4 py-3 text-muted-foreground text-xs">
            Content for Tab 1
          </p>
        </TabsContent>
        <TabsContent value="tab-2">
          <p className="px-4 py-3 text-muted-foreground text-xs">
            Content for Tab 2
          </p>
        </TabsContent>
        <TabsContent value="tab-3">
          <p className="px-4 py-3 text-muted-foreground text-xs">
            Content for Tab 3
          </p>
        </TabsContent>
      </div>
    </Tabs>
  );
}
