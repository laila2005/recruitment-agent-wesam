import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import {
  Sparkles, Upload, Users, Rocket, Clock, Gauge, Search, ChevronDown, CalendarPlus,
  FileText, Copy, ShieldCheck, Quote, AlertTriangle, X, FileUp, Check, Mail, MailX, Zap, Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CANDIDATES, JOBS, type Candidate, type Tier } from "@/lib/candidates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentScout AI — Candidate Triage Dashboard" },
      { name: "description", content: "AI-powered recruitment triage by Lili: rank, score and fast-track candidates with bias-free screening." },
      { property: "og:title", content: "TalentScout AI — Powered by Lili" },
      { property: "og:description", content: "Rank, score and fast-track candidates with bias-free AI screening." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const scoreTone = (s: number) => (s >= 85 ? "success" : s >= 70 ? "warning" : "danger");
const toneText = { success: "text-success", warning: "text-warning", danger: "text-danger" } as const;
const toneBg = { success: "bg-success", warning: "bg-warning", danger: "bg-danger" } as const;
const tierMeta: Record<Tier, { label: string; cls: string }> = {
  1: { label: "Fast-Track", cls: "text-success bg-success/10 border-success/25" },
  2: { label: "Bench / Review", cls: "text-warning bg-warning/10 border-warning/25" },
  3: { label: "Does Not Meet Bar", cls: "text-danger bg-danger/10 border-danger/25" },
};

function Dashboard() {
  const [job, setJob] = useState(JOBS[1]);
  const [anon, setAnon] = useState(false);
  const [filter, setFilter] = useState<"all" | Tier>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Candidate | null>(null);
  const [tab, setTab] = useState("scorecard");
  const [upload, setUpload] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, "invite" | "feedback">>({});
  const [dispatch, setDispatch] = useState<{ kind: "invite" | "feedback"; ids: string[] } | null>(null);

  const list = useMemo(() => {
    const t = q.toLowerCase();
    return CANDIDATES.filter((c) => (filter === "all" || c.tier === filter))
      .filter((c) => !t || [c.name, c.takeaway, ...c.matched].join(" ").toLowerCase().includes(t))
      .sort((a, b) => b.score - a.score);
  }, [filter, q]);

  const nameOf = (c: Candidate) => (anon ? c.anonId : c.name);
  const openCand = (c: Candidate, t = "scorecard") => { setTab(t); setOpen(c); };

  const toggle = (id: string, v: boolean) =>
    setSelected((s) => { const n = new Set(s); v ? n.add(id) : n.delete(id); return n; });
  const allChecked = list.length > 0 && list.every((c) => selected.has(c.id));
  const someChecked = !allChecked && list.some((c) => selected.has(c.id));
  const toggleAll = (v: boolean) =>
    setSelected(v ? new Set(list.map((c) => c.id)) : new Set());
  const selectedCands = CANDIDATES.filter((c) => selected.has(c.id));

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="bottom-right" />
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="font-semibold tracking-tight">TalentScout AI</span>
            <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" /> Lili Agent Active
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-2 flex items-center gap-2 rounded-md border bg-secondary px-3 py-1.5 text-sm hover:bg-accent">
              {job} <ChevronDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {JOBS.map((j) => (
                <DropdownMenuItem key={j} onClick={() => setJob(j)}>
                  {j === job ? <Check className="size-3.5" /> : <span className="w-3.5" />} {j}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="ml-auto flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className={cn("size-4", anon && "text-primary")} />
              Bias-Free Anonymize Mode
              <Switch checked={anon} onCheckedChange={setAnon} />
            </label>
            <button onClick={() => setUpload(true)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              <Upload className="size-4" /> Upload Resumes
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidate Triage</h1>
          <p className="text-sm text-muted-foreground">{job} · Screened by Lili 2 minutes ago</p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Total Applicants Screened", value: "48", sub: "candidates" },
            { icon: Rocket, label: "Tier 1 Fast-Track", value: "4", sub: "Top 8%" },
            { icon: Clock, label: "Time Saved This Round", value: "14.5h", sub: "85% reduction" },
            { icon: Gauge, label: "Average Fit Score", value: "76.4", sub: "/ 100" },
          ].map((k, i) => (
            <div key={k.label} className="surface animate-in fade-in slide-in-from-bottom-2 rounded-xl p-5" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {k.label} <k.icon className="size-4" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tracking-tight">{k.value}</span>
                <span className="text-xs text-primary">{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="surface overflow-hidden rounded-xl">
          <div className="flex flex-wrap items-center gap-3 border-b p-3">
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
              {([
                ["all", "All", 48], [1, "🟢 Tier 1: Fast-Track", 4], [2, "🟡 Tier 2: Bench", 12], [3, "🔴 Tier 3: Archive", 32],
              ] as const).map(([v, l, n]) => (
                <button key={String(v)} onClick={() => setFilter(v)}
                  className={cn("rounded-md px-3 py-1 transition", filter === v ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                  {l} <span className="ml-1 font-mono text-xs opacity-60">{n}</span>
                </button>
              ))}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by skill or keyword…"
                className="w-full rounded-md border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b">
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={allChecked ? true : someChecked ? "indeterminate" : false}
                      onCheckedChange={(v) => toggleAll(!!v)}
                      aria-label="Select all candidates"
                    />
                  </th>
                  {["Candidate", "Fit Score", "Status", "Core Stack Match", "Exp.", "Executive Takeaway", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => {
                  const tone = scoreTone(c.score);
                  return (
                    <tr key={c.id} onClick={() => openCand(c)} className={cn("cursor-pointer border-b transition hover:bg-accent/50 last:border-0", selected.has(c.id) && "bg-primary/5")}>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(c.id)}
                          onCheckedChange={(v) => toggle(c.id, !!v)}
                          aria-label={`Select ${nameOf(c)}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                          <div>
                            <div className="font-medium">{nameOf(c)}</div>
                            {!anon && <div className="text-xs text-muted-foreground">{c.location}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><ScoreRing score={c.score} /></td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn("w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-xs", tierMeta[c.tier].cls)}>{tierMeta[c.tier].label}</span>
                          {statuses[c.id] === "invite" && (
                            <span className="flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-xs text-success">
                              <Mail className="size-3" /> Invite Sent
                            </span>
                          )}
                          {statuses[c.id] === "feedback" && (
                            <span className="flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 text-xs text-danger">
                              <MailX className="size-3" /> Feedback Sent
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[220px] px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {c.matched.map((s) => <span key={s} className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">{s}</span>)}
                          {c.missing.map((s) => <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground line-through">{s}</span>)}
                        </div>
                      </td>
                      <td className={cn("whitespace-nowrap px-4 py-4 font-mono", toneText[tone])}>{c.years} yrs</td>
                      <td className="max-w-xs px-4 py-4 text-muted-foreground">{c.takeaway}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openCand(c)} className="flex items-center gap-1 whitespace-nowrap rounded-md border px-2 py-1 text-xs hover:bg-accent">
                            <FileText className="size-3.5" /> Scorecard
                          </button>
                          <button onClick={() => toast.success(`Interview request sent to ${nameOf(c)}`)} className="flex items-center gap-1 whitespace-nowrap rounded-md bg-secondary px-2 py-1 text-xs hover:bg-accent">
                            <CalendarPlus className="size-3.5" /> Schedule
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!list.length && <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No candidates match.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Drawer */}
      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-4">
                  <ScoreRing score={open.score} size={56} />
                  <div>
                    <SheetTitle>{nameOf(open)}</SheetTitle>
                    <SheetDescription>
                      {anon ? "Identifying details hidden" : `${open.university} · ${open.location}`} · {open.years} yrs
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <Tabs value={tab} onValueChange={setTab} className="px-4 pb-6">
                <TabsList className="w-full">
                  <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
                  <TabsTrigger value="guide">Screening Guide</TabsTrigger>
                  <TabsTrigger value="email">Outreach Email</TabsTrigger>
                </TabsList>

                <TabsContent value="scorecard" className="space-y-6 pt-4">
                  <section className="space-y-3">
                    {open.breakdown.map((b) => (
                      <div key={b.label}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{b.label} <span className="text-muted-foreground">({b.weight}%)</span></span>
                          <span className={cn("font-mono", toneText[scoreTone(b.score)])}>{b.score}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className={cn("h-full rounded-full transition-all duration-700", toneBg[scoreTone(b.score)])} style={{ width: `${b.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </section>
                  <section>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence-Referenced Strengths</h3>
                    <ul className="space-y-3">
                      {open.strengths.map((s) => (
                        <li key={s.point} className="rounded-lg border p-3">
                          <div className="text-sm font-medium">{s.point}</div>
                          <div className="mt-1.5 flex gap-2 text-xs italic text-muted-foreground">
                            <Quote className="size-3.5 shrink-0 text-primary" /> "{s.quote}"
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Gaps & Verification Flags</h3>
                    <ul className="space-y-2">
                      {open.gaps.map((g) => (
                        <li key={g.flag} className="flex items-start gap-2 text-sm">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1">{g.flag}</span>
                          <span className={cn("rounded border px-1.5 text-[11px]",
                            g.severity === "High" ? tierMeta[3].cls : g.severity === "Medium" ? tierMeta[2].cls : "border-border text-muted-foreground")}>{g.severity}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </TabsContent>

                <TabsContent value="guide" className="space-y-4 pt-4">
                  {open.questions.map((qq, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="text-[11px] uppercase tracking-wide text-primary">Q{i + 1} · {qq.type}</div>
                      <p className="mt-1 text-sm font-medium">{qq.q}</p>
                      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <div className="rounded-md border border-success/25 bg-success/5 p-2"><b className="text-success">Strong (4)</b> — {qq.strong}</div>
                        <div className="rounded-md border border-danger/25 bg-danger/5 p-2"><b className="text-danger">Weak (1)</b> — {qq.weak}</div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="email" className="space-y-3 pt-4">
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 font-sans text-sm leading-relaxed">{open.email}</pre>
                  <button onClick={() => { navigator.clipboard?.writeText(open.email); toast.success("Email copied to clipboard"); }}
                    className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                    <Copy className="size-4" /> Copy to Clipboard
                  </button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      <UploadModal open={upload} onOpenChange={setUpload} />

      {/* Floating batch action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 animate-in slide-in-from-bottom-4 fade-in flex-wrap items-center gap-2 rounded-2xl border bg-card/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur duration-300">
          <span className="mr-1 text-sm font-medium">
            <span className="font-mono text-primary">{selected.size}</span> candidate{selected.size > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => setDispatch({ kind: "invite", ids: [...selected] })}
            className="flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-sm font-medium text-success-foreground transition hover:opacity-90">
            <Mail className="size-4" /> Accept & Send Interview Invites
          </button>
          <button
            onClick={() => setDispatch({ kind: "feedback", ids: [...selected] })}
            className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90">
            <MailX className="size-4" /> Reject & Send Feedback Emails
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground">
            Deselect All
          </button>
        </div>
      )}

      {dispatch && (
        <DispatchModal
          kind={dispatch.kind}
          candidates={CANDIDATES.filter((c) => dispatch.ids.includes(c.id))}
          nameOf={nameOf}
          onClose={() => setDispatch(null)}
          onDone={() => {
            setStatuses((s) => {
              const n = { ...s };
              dispatch.ids.forEach((id) => { n[id] = dispatch.kind; });
              return n;
            });
            setSelected(new Set());
            setDispatch(null);
            toast.success(
              dispatch.kind === "invite"
                ? `${dispatch.ids.length} interview invite(s) dispatched by Lili`
                : `${dispatch.ids.length} feedback email(s) dispatched by Lili`
            );
          }}
        />
      )}
    </div>
  );
}

const DISPATCH_STEPS = [
  "Generating personalized email referencing resume achievements...",
  "Attaching 30-minute screening calendar link...",
  "Dispatched to candidate inbox via Lili Agent!",
];

function DispatchModal({ kind, candidates, nameOf, onClose, onDone }: {
  kind: "invite" | "feedback";
  candidates: Candidate[];
  nameOf: (c: Candidate) => string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(-1); // -1 = idle, 0..2 = running steps, 3 = done
  const running = step >= 0 && step < DISPATCH_STEPS.length;
  const done = step >= DISPATCH_STEPS.length;

  const start = () => {
    setStep(0);
    DISPATCH_STEPS.forEach((_, i) => {
      setTimeout(() => setStep(i + 1), 900 * (i + 1));
    });
    setTimeout(onDone, 900 * DISPATCH_STEPS.length + 700);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !running && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" /> Autonomous Email Dispatch Engine
          </DialogTitle>
          <DialogDescription>
            {kind === "invite"
              ? "Lili has drafted personalized interview invites for the selected candidates."
              : "Lili has drafted constructive feedback emails for the selected candidates."}
          </DialogDescription>
        </DialogHeader>

        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {candidates.map((c) => (
            <li key={c.id} className="rounded-lg border p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium">{nameOf(c)}</span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[11px]",
                  kind === "invite" ? "border-success/25 bg-success/10 text-success" : "border-danger/25 bg-danger/10 text-danger")}>
                  {kind === "invite" ? "Interview Invite" : "Feedback"}
                </span>
              </div>
              <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{c.email}</p>
            </li>
          ))}
        </ul>

        {step >= 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            {DISPATCH_STEPS.map((s, i) => (
              <div key={s} className={cn("flex items-center gap-2 text-sm transition-opacity", i > step && "opacity-30")}>
                {i < step ? (
                  <Check className="size-4 text-success" />
                ) : i === step && !done ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <span className="size-4" />
                )}
                <span className={i < step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={start}
          disabled={step >= 0}
          className={cn(
            "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:opacity-50",
            kind === "invite" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
          )}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
          {done ? "Dispatched!" : running ? "Dispatching…" : `Confirm & Dispatch All (${candidates.length})`}
        </button>
      </DialogContent>
    </Dialog>
  );
}

function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r, tone = scoreTone(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="3.5" className="fill-none stroke-muted" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          className={cn("fill-none transition-all duration-700", tone === "success" ? "stroke-success" : tone === "warning" ? "stroke-warning" : "stroke-danger")} />
      </svg>
      <span className={cn("absolute inset-0 grid place-items-center font-mono text-xs font-semibold", toneText[tone])}>{score}</span>
    </div>
  );
}

function UploadModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [drag, setDrag] = useState(false);
  const add = (l: FileList | null) => l && setFiles((f) => [...f, ...Array.from(l)]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Resumes</DialogTitle>
          <DialogDescription>Batch upload PDF or DOCX files. Lili will screen them against the active role.</DialogDescription>
        </DialogHeader>
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
          className={cn("flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition", drag ? "border-primary bg-primary/5" : "hover:bg-accent/40")}>
          <FileUp className="size-8 text-primary" />
          <span className="text-sm font-medium">Drop files here or click to browse</span>
          <span className="text-xs text-muted-foreground">PDF, DOCX · up to 100 files</span>
          <input type="file" multiple accept=".pdf,.docx" className="hidden" onChange={(e) => add(e.target.files)} />
        </label>
        {files.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md border px-2 py-1">
                <FileText className="size-4 text-muted-foreground" /><span className="flex-1 truncate">{f.name}</span>
                <button onClick={() => setFiles((x) => x.filter((_, j) => j !== i))}><X className="size-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
        <button disabled={!files.length}
          onClick={() => { toast.success(`Lili is screening ${files.length} resume(s)…`); setFiles([]); onOpenChange(false); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">
          Start Screening
        </button>
      </DialogContent>
    </Dialog>
  );
}
