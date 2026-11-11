"use client";

import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Menu } from "@/components/ui/Menu";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Table } from "@/components/ui/Table";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { Ticket } from "@/components/ui/Ticket";

const rows = [
  { id: "1", name: "Aarav Shah", pass: "EVC-7Q2K", paid: "Paid", at: "18:04", amount: "100.00" },
  { id: "2", name: "Diya Rao", pass: "EVC-4M9T", paid: "Cash to collect", at: "—", amount: "100.00" },
];

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-6">
      <p className="eyebrow">{n}</p>
      <h2 className="mt-1 text-heading">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Inner() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [tab, setTab] = useState<"a" | "b">("a");
  const [loading, setLoading] = useState(false);
  return (
    <main className="mx-auto flex max-w-app flex-col gap-12 px-4 py-12 sm:px-8">
      <header>
        <p className="eyebrow">EvntCult</p>
        <h1 className="title-xl mt-1">Design system</h1>
        <p className="mt-3 max-w-[65ch] text-body text-ink-muted">Every building block in every state. Tokens live in one file; nothing here animates unless you cause it.</p>
      </header>

      <Section n="01" title="Type">
        <div className="flex flex-col gap-2">
          <p className="text-display">Display 32–40</p>
          <p className="text-heading">Heading 24</p>
          <p className="text-title">Title 20</p>
          <p className="text-body">Body 14 — the default size for reading.</p>
          <p className="text-body-sm">Body small 13 — dense UI and table cells.</p>
          <p className="text-label">Label 12</p>
          <p className="font-mono text-caption">CAPTION 11 · 18:00 · ₹100.00 · EVC-7Q2K</p>
        </div>
      </Section>

      <Section n="02" title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Publish</Button>
          <Button>Save draft</Button>
          <Button size="sm">Duplicate</Button>
          <Button variant="secondary">Preview</Button>
          <Button variant="ghost">Cancel</Button>
          <Button disabled>Disabled</Button>
          <Button loading={loading} onClick={() => setLoading((l) => !l)}>
            {loading ? "Saving" : "Click to load"}
          </Button>
          <LinkButton href="#" variant="secondary" size="sm">
            Link button
          </LinkButton>
          <span className="ml-6">
            <Button variant="danger">Cancel event</Button>
          </span>
        </div>
      </Section>

      <Section n="03" title="Inputs">
        <div className="grid max-w-[720px] gap-6 sm:grid-cols-2">
          <Input label="Event name" placeholder="e.g. Garba Night" helper="evntcult.app/e/garba-night" validate={(v) => (v.trim() ? null : "required")} />
          <Input label="Capacity" type="number" inputMode="numeric" defaultValue={100} helper="Leave empty for unlimited" />
          <Input label="Server error" defaultValue="garba" error="That link is taken. Try garba-night-2026." />
          <Input label="Disabled" defaultValue="Asia/Kolkata" disabled />
          <Textarea label="About" placeholder="What happens, who it's for." className="sm:col-span-2" />
        </div>
      </Section>

      <Section n="04" title="Menu, tabs, toast, modal">
        <div className="flex flex-wrap items-start gap-6">
          <Menu label="Actions" items={[{ label: "Edit", href: "#" }, { label: "Duplicate", onSelect: () => toast({ message: "Duplicated. Draft created.", action: { label: "Undo", run: () => toast({ message: "Undone." }) } }) }, { label: "Unpublish" }, { label: "Cancel event", danger: true }]} />
          <Menu label="Venue (search)" items={["Auditorium", "Amphitheatre", "Basketball court", "Canteen lawn", "Library hall", "Main ground", "Old gym", "Quad", "Seminar room 1", "Seminar room 2", "Student centre"].map((label) => ({ label }))} />
          <Button variant="secondary" onClick={() => toast({ message: "Saved 2s ago." })}>
            Show toast
          </Button>
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
        </div>
        <div className="mt-8 max-w-[720px]">
          <Tabs label="Example tabs" tabs={[["a", "All photos"], ["b", "AI face search"]] as const} value={tab} onChange={setTab}>
            <p className="text-body text-ink-muted">{tab === "a" ? "Panel for all photos." : "Panel for face search."}</p>
          </Tabs>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Publish Garba Night?">
          <p className="text-body text-ink-muted">Students can see it and register once it is published. You can unpublish later.</p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModal(false)}>
              Not yet
            </Button>
            <Button onClick={() => setModal(false)}>Publish</Button>
          </div>
        </Modal>
      </Section>

      <Section n="05" title="Card, chips, table">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="01" title="This week" action={{ label: "See all", href: "#" }}>
            <div className="flex flex-wrap gap-2">
              <Chip>Draft</Chip>
              <Chip tone="live" pulse>
                Live
              </Chip>
              <Chip tone="warn">Payment pending</Chip>
              <Chip tone="danger">Failed</Chip>
              <Chip tone="dark">Paid</Chip>
            </div>
          </Card>
          <Card title="Guests">
            <Table
              caption="Guests"
              rows={rows}
              rowKey={(r) => r.id}
              empty={{ sentence: "No one has registered yet." }}
              columns={[
                { key: "n", header: "Name", cell: (r) => r.name },
                { key: "p", header: "Pass", cell: (r) => <span className="font-mono">{r.pass}</span> },
                { key: "s", header: "Payment", cell: (r) => <Chip tone={r.paid === "Paid" ? "live" : "warn"}>{r.paid}</Chip> },
                { key: "a", header: "Amount", numeric: true, cell: (r) => `₹${r.amount}` },
              ]}
            />
          </Card>
          <Card title="Empty table">
            <Table caption="Empty" rows={[] as typeof rows} rowKey={(r) => r.id} columns={[]} empty={{ sentence: "No one has registered yet.", action: <Button size="sm" variant="secondary">Share the link</Button> }} />
          </Card>
        </div>
      </Section>

      <Section n="06" title="Ticket">
        <Ticket category="Culture" title="Garba Night" dateLabel="Sat 14 Nov" time="18:00" venue="Main ground" tagline="Dandiya provided" qrValue="https://example.test/p/EVC-7Q2K" passCode="EVC-7Q2K" priceLabel="₹100" seatsLabel="99 / 100" />
      </Section>
    </main>
  );
}

export function Gallery() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  );
}
