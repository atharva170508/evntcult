import {
  BellIcon,
  ChevronDownIcon,
  LifeBuoyIcon,
  Link2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/registry/default/ui/accordion";

const items = [
  {
    content:
      "Connect your accounts from Google, GitHub, or Microsoft to enable single sign-on and streamline your workflow. Connected accounts can be used for quick login and importing your preferences across platforms. You can revoke access to any connected account at any time.",
    icon: Link2Icon,
    id: "1",
    sub: "Manage your linked social and work accounts",
    title: "Connected accounts",
  },
  {
    content:
      "Choose which updates you want to receive. You can get notifications for: security alerts, billing updates, newsletter and product announcements, usage reports, and scheduled maintenance. Notifications can be delivered via email, SMS, or push notifications on your devices.",
    icon: BellIcon,
    id: "2",
    sub: "Customize your notification preferences",
    title: "Notifications",
  },
  {
    content:
      "Protect your account with two-factor authentication. You can use authenticator apps like Google Authenticator or Authy, receive SMS codes, or use security keys like YubiKey. We recommend using an authenticator app for the most secure experience.",
    icon: ShieldCheckIcon,
    id: "3",
    sub: "Add an extra layer of security to your account",
    title: "2-step verification",
  },
  {
    content:
      "Our support team is available around the ClockIcon to assist you. For billing inquiries, technical issues, or general questions, you can reach us through live chat, email at support@example.com, or schedule a call with our technical team. Premium support is available for enterprise customers.",
    icon: LifeBuoyIcon,
    id: "4",
    sub: "We're here to help 24/7",
    title: "Contact support",
  },
];

export default function Component() {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-xl">W/ icon, sub-header, and chevron</h2>
      <Accordion className="w-full" collapsible defaultValue="3" type="single">
        {items.map((item) => (
          <AccordionItem className="py-2" key={item.id} value={item.id}>
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between rounded-md py-2 text-left font-semibold text-[15px] leading-6 outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [&[data-state=open]>svg]:rotate-180">
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border"
                  >
                    <item.icon className="opacity-60" size={16} />
                  </span>
                  <span className="flex flex-col space-y-1">
                    <span>{item.title}</span>
                    {item.sub && (
                      <span className="font-normal text-sm">{item.sub}</span>
                    )}
                  </span>
                </span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className="pointer-events-none shrink-0 opacity-60 transition-transform duration-200"
                  size={16}
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionContent className="ms-3 ps-10 pb-2 text-muted-foreground">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
