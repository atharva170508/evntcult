import { AtSignIcon, CommandIcon, EclipseIcon, ZapIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/default/ui/accordion";

const items = [
  {
    content:
      "coss ui focuses on developer experience and performance. Built with TypeScript, it offers excellent type safety, follows accessibility standards, and provides comprehensive documentation with regular updates.",
    icon: CommandIcon,
    id: "1",
    title: "What makes coss ui different?",
  },
  {
    content:
      "Use our CSS variables for global styling, or className and style props for component-specific changes. We support CSS modules, Tailwind, and dark mode out of the box.",
    icon: EclipseIcon,
    id: "2",
    title: "How can I customize the components?",
  },
  {
    content:
      "Yes, with tree-shaking, code splitting, and minimal runtime overhead. Most components are under 5KB gzipped.",
    icon: ZapIcon,
    id: "3",
    title: "Is coss ui optimized for performance?",
  },
  {
    content:
      "All components follow WAI-ARIA standards, featuring proper ARIA attributes, keyboard navigation, and screen reader support. Regular testing ensures compatibility with NVDA, VoiceOver, and JAWS.",
    icon: AtSignIcon,
    id: "4",
    title: "How accessible are the components?",
  },
];

export default function Component() {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-xl">W/ icon and chevron</h2>
      <Accordion className="w-full" collapsible defaultValue="3" type="single">
        {items.map((item) => (
          <AccordionItem className="py-2" key={item.id} value={item.id}>
            <AccordionTrigger className="py-2 text-[15px] leading-6 hover:no-underline">
              <span className="flex items-center gap-3">
                <item.icon
                  aria-hidden="true"
                  className="shrink-0 opacity-60"
                  size={16}
                />
                <span>{item.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="ps-7 pb-2 text-muted-foreground">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
