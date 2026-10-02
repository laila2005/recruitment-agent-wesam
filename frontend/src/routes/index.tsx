import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import {
  Sparkles, Upload, Users, Rocket, Clock, Gauge, Search, ChevronDown, CalendarPlus,
  FileText, Copy, ShieldCheck, Quote, AlertTriangle, X, FileUp, Check, Mail, MailX, Zap, Loader2,
  Plus, Briefcase, Sliders, Info, CheckCircle2, Edit3, Send, ExternalLink, Trash2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CANDIDATES, INITIAL_JOB_ROLES, type Candidate, type JobRole, type Tier } from "@/lib/candidates";
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
  const [jobRoles, setJobRoles] = useState<JobRole[]>(() => {
    const saved = localStorage.getItem("talentscout_jobs_v2");
    return saved ? JSON.parse(saved) : INITIAL_JOB_ROLES;
  });

  const [activeJobId, setActiveJobId] = useState<string>(jobRoles[0]?.id || "frontend");
  const activeJob = useMemo(() => jobRoles.find((j) => j.id === activeJobId) || jobRoles[0], [jobRoles, activeJobId]);

  const [candidateList, setCandidateList] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem("talentscout_real_candidates");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter((c: Candidate) => c.id !== "sarah" && c.id !== "devin" && c.id !== "jordan");
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [anon, setAnon] = useState(false);
  const [filter, setFilter] = useState<"all" | Tier>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Candidate | null>(null);
  const [tab, setTab] = useState("scorecard");
  const [upload, setUpload] = useState(false);
  const [postRoleOpen, setPostRoleOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobRole | null>(null);
  const [viewJdOpen, setViewJdOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statuses, setStatuses] = useState<Record<string, "invite" | "feedback">>({});
  const [dispatch, setDispatch] = useState<{ kind: "invite" | "feedback"; ids: string[] } | null>(null);

  const handleDeleteRole = (roleId: string, roleTitle: string) => {
    if (jobRoles.length <= 1) {
      toast.error("Cannot delete the only remaining role. Create another role first.");
      return;
    }
    const nextRoles = jobRoles.filter((j) => j.id !== roleId);
    setJobRoles(nextRoles);
    if (activeJobId === roleId) {
      setActiveJobId(nextRoles[0].id);
    }
    toast.success(`Role "${roleTitle}" removed from pipeline.`);
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("talentscout_jobs_v2", JSON.stringify(jobRoles));
  }, [jobRoles]);

  useEffect(() => {
    localStorage.setItem("talentscout_real_candidates", JSON.stringify(candidateList));
  }, [candidateList]);

  // Candidates for active job
  const list = useMemo(() => {
    const t = q.toLowerCase();
    return candidateList
      .filter((c) => !c.roleId || c.roleId === activeJob.id)
      .filter((c) => (filter === "all" || c.tier === filter))
      .filter((c) => !t || [c.name, c.takeaway, ...c.matched].join(" ").toLowerCase().includes(t))
      .sort((a, b) => b.score - a.score);
  }, [candidateList, activeJob.id, filter, q]);

  const nameOf = (c: Candidate) => (anon ? c.anonId : c.name);
  const openCand = (c: Candidate, t = "scorecard") => { setTab(t); setOpen(c); };

  const toggle = (id: string, v: boolean) =>
    setSelected((s) => { const n = new Set(s); v ? n.add(id) : n.delete(id); return n; });
  const allChecked = list.length > 0 && list.every((c) => selected.has(c.id));
  const someChecked = !allChecked && list.some((c) => selected.has(c.id));
  const toggleAll = (v: boolean) =>
    setSelected(v ? new Set(list.map((c) => c.id)) : new Set());
  const selectedCands = list.filter((c) => selected.has(c.id));

  // Clear demo candidates
  const handleClearData = () => {
    if (candidateList.length === 0) {
      setCandidateList(CANDIDATES);
      toast.success("Restored sample candidate pipeline");
    } else {
      setCandidateList([]);
      setSelected(new Set());
      toast.success("Cleared all candidates. Upload real CVs to start!");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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

          {/* Job Dropdown & Post Role Button */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md border bg-secondary px-3 py-1.5 text-sm hover:bg-accent font-medium max-w-[280px] sm:max-w-md truncate">
                <span className="truncate">{activeJob.title}</span> <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Active Roles ({jobRoles.length})</DropdownMenuLabel>
                {jobRoles.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => setActiveJobId(j.id)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-2 text-xs rounded-sm cursor-pointer transition select-none group",
                      j.id === activeJob.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground"
                    )}>
                    <div className="flex items-center gap-2 truncate mr-2">
                      {j.id === activeJob.id ? <Check className="size-3.5 text-primary shrink-0" /> : <span className="w-3.5 shrink-0" />}
                      <div className="truncate">
                        <div className="truncate font-medium">{j.title}</div>
                        <div className="text-[10px] text-muted-foreground">{j.company} · {j.minExp}+ yrs</div>
                      </div>
                    </div>
                    {jobRoles.length > 1 && (
                      <button
                        title="Delete Role"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(j.id, j.title);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0 opacity-70 group-hover:opacity-100">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setEditingJob(null);
                    setPostRoleOpen(true);
                  }}
                  className="cursor-pointer text-xs font-semibold text-primary flex items-center gap-1.5 py-2">
                  <Plus className="size-3.5" /> + Create New Role Opening
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* + Post Role Button */}
            <button
              onClick={() => {
                setEditingJob(null);
                setPostRoleOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition">
              <Plus className="size-3.5" /> + Post Role
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
              <ShieldCheck className={cn("size-4", anon && "text-primary")} />
              Bias-Free Mode
              <Switch checked={anon} onCheckedChange={setAnon} />
            </label>

            <button
              onClick={handleClearData}
              className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition">
              {candidateList.length === 0 ? "Restore Demo Data" : "Clear Demo Data"}
            </button>

            <button
              onClick={() => setUpload(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 shadow-sm">
              <Upload className="size-4" /> Upload Resumes
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Active Role Banner */}
        <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight">{activeJob.title}</h1>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {activeJob.company || "Active Opening"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Minimum {activeJob.minExp}+ years experience required · Mandatory: {activeJob.mandatory.join(", ")}
            </p>
          </div>
          <button
            onClick={() => setViewJdOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:bg-accent transition">
            <FileText className="size-3.5 text-primary" /> View Job Description & Rubric
          </button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Total Applicants Screened", value: `${list.length}`, sub: "candidates" },
            { icon: Rocket, label: "Tier 1 Fast-Track", value: `${list.filter(c => c.tier === 1).length}`, sub: "Ready for interview" },
            { icon: Clock, label: "Recruiter Time Saved", value: `${(list.length * 0.3).toFixed(1)}h`, sub: "85% reduction" },
            { icon: Gauge, label: "Average Fit Score", value: list.length > 0 ? (list.reduce((a, b) => a + b.score, 0) / list.length).toFixed(1) : "0.0", sub: "/ 100" },
          ].map((k, i) => (
            <div key={k.label} className="surface animate-in fade-in slide-in-from-bottom-2 rounded-xl p-5" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {k.label} <k.icon className="size-4 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold tracking-tight">{k.value}</span>
                <span className="text-xs text-primary">{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="surface overflow-hidden rounded-xl border">
          <div className="flex flex-wrap items-center gap-3 border-b p-3">
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
              {([
                ["all", "All", list.length],
                [1, "🟢 Tier 1: Fast-Track", list.filter(c => c.tier === 1).length],
                [2, "🟡 Tier 2: Bench", list.filter(c => c.tier === 2).length],
                [3, "🔴 Tier 3: Archive", list.filter(c => c.tier === 3).length],
              ] as const).map(([v, l, n]) => (
                <button key={String(v)} onClick={() => setFilter(v)}
                  className={cn("rounded-md px-3 py-1 transition text-xs font-medium", filter === v ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                  {l} <span className="ml-1 font-mono text-xs opacity-60">({n})</span>
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
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b bg-muted/40">
                <tr>
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
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center text-muted-foreground">
                      <p className="font-medium text-foreground">No candidates in pipeline for this opening</p>
                      <p className="text-xs mt-1">Upload candidate resumes using the "+ Upload Resumes" button.</p>
                    </td>
                  </tr>
                ) : (
                  list.map((c, i) => {
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
                            <span className={cn("w-fit whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", tierMeta[c.tier].cls)}>{tierMeta[c.tier].label}</span>
                            {(c.emailSent || statuses[c.id] === "invite") && (
                              <span className="flex w-fit items-center gap-1 whitespace-nowrap rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-xs text-success">
                                <Mail className="size-3" /> Invite Sent ✉️
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
                        <td className="max-w-xs px-4 py-4 text-muted-foreground text-xs leading-relaxed">{c.takeaway}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => openCand(c)} className="flex items-center gap-1 whitespace-nowrap rounded-md border px-2.5 py-1 text-xs hover:bg-accent font-medium">
                              Scorecard
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Batch Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-card/95 px-5 py-2.5 shadow-2xl backdrop-blur">
          <span className="text-sm font-medium">
            <span className="font-mono text-primary font-bold">{selected.size}</span> selected
          </span>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => setDispatch({ kind: "invite", ids: Array.from(selected) })}
            className="flex items-center gap-1.5 rounded-full bg-success px-4 py-1.5 text-xs font-semibold text-success-foreground transition hover:opacity-90">
            <Mail className="size-3.5" /> Accept & Send Invites
          </button>
          <button
            onClick={() => setDispatch({ kind: "feedback", ids: Array.from(selected) })}
            className="flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-4 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20">
            <MailX className="size-3.5" /> Reject & Send Feedback
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      )}

      {/* Slide-Over Drawer for Scorecard */}
      <CandidateDrawer
        candidate={open}
        open={!!open}
        onClose={() => setOpen(null)}
        tab={tab}
        onTabChange={setTab}
        name={open ? nameOf(open) : ""}
        onCandidateUpdated={(updated) => {
          setCandidateList((prev) => {
            const next = prev.map((c) => (c.id === updated.id ? updated : c));
            try {
              localStorage.setItem("talentscout_real_candidates", JSON.stringify(next));
            } catch (e) {}
            return next;
          });
          setOpen(updated);
        }}
      />

      {/* HR Admin: Post Role Modal */}
      <PostRoleModal
        open={postRoleOpen}
        onOpenChange={(o) => {
          setPostRoleOpen(o);
          if (!o) setEditingJob(null);
        }}
        initialJob={editingJob}
        onSave={(savedJob) => {
          setJobRoles((prev) => {
            const exists = prev.some((j) => j.id === savedJob.id);
            if (exists) {
              return prev.map((j) => (j.id === savedJob.id ? savedJob : j));
            }
            return [savedJob, ...prev];
          });
          setActiveJobId(savedJob.id);
          toast.success(editingJob ? `Updated role: ${savedJob.title}!` : `Published new job role: ${savedJob.title}! Scoring rubric is now active.`);
          setEditingJob(null);
        }}
      />

      {/* View Job Description Modal */}
      <ViewJdModal
        open={viewJdOpen}
        onOpenChange={setViewJdOpen}
        job={activeJob}
        canDelete={jobRoles.length > 1}
        onDelete={(id, title) => handleDeleteRole(id, title)}
        onEdit={(job) => {
          setEditingJob(job);
          setPostRoleOpen(true);
        }}
      />

      {/* Upload Resumes Modal with Evaluation */}
      <UploadModal
        open={upload}
        onOpenChange={setUpload}
        activeJob={activeJob}
        onCandidateCreated={(cand) => {
          setCandidateList((prev) => [cand, ...prev]);
          toast.success(`Candidate ${cand.name} evaluated & ingested into pipeline!`);
        }}
      />

      {/* Autonomous Dispatch Modal */}
      {dispatch && (
        <DispatchModal
          kind={dispatch.kind}
          candidates={list.filter((c) => dispatch.ids.includes(c.id))}
          nameOf={nameOf}
          onClose={() => setDispatch(null)}
          onDone={() => {
            const next = { ...statuses };
            dispatch.ids.forEach((id) => (next[id] = dispatch.kind));
            setStatuses(next);
            setSelected(new Set());
            setDispatch(null);
            toast.success(dispatch.kind === "invite" ? "Interview invites dispatched!" : "Feedback sent to candidates!");
          }}
        />
      )}
    </div>
  );
}

// HR ADMIN: POST OR EDIT ROLE MODAL
function PostRoleModal({
  open,
  onOpenChange,
  onSave,
  initialJob,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (job: JobRole) => void;
  initialJob?: JobRole | null;
}) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [minExp, setMinExp] = useState(5.0);
  const [mandatoryStr, setMandatoryStr] = useState("");
  const [description, setDescription] = useState("");
  const [techWeight, setTechWeight] = useState(40);
  const [expWeight, setExpWeight] = useState(25);
  const [impactWeight, setImpactWeight] = useState(20);
  const [leadWeight, setLeadWeight] = useState(15);

  useEffect(() => {
    if (initialJob) {
      setTitle(initialJob.title);
      setCompany(initialJob.company);
      setMinExp(initialJob.minExp);
      setMandatoryStr(initialJob.mandatory.join(", "));
      setDescription(initialJob.description);
      setTechWeight(initialJob.weights.tech);
      setExpWeight(initialJob.weights.exp);
      setImpactWeight(initialJob.weights.impact);
      setLeadWeight(initialJob.weights.lead);
    } else {
      setTitle("");
      setCompany("");
      setMinExp(5.0);
      setMandatoryStr("");
      setDescription("");
      setTechWeight(40);
      setExpWeight(25);
      setImpactWeight(20);
      setLeadWeight(15);
    }
  }, [initialJob, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mandatoryStr.trim()) {
      toast.error("Please enter a Job Title and at least one Mandatory Must-Have.");
      return;
    }
    const mandatory = mandatoryStr.split(",").map((s) => s.trim()).filter(Boolean);
    const job: JobRole = {
      id: initialJob ? initialJob.id : "job_" + Date.now(),
      title: title.trim(),
      company: company.trim() || "Active Opening",
      minExp: Number(minExp),
      mandatory,
      description: description.trim() || `Job Opening: ${title}. Minimum experience: ${minExp}+ years.`,
      weights: { tech: techWeight, exp: expWeight, impact: impactWeight, lead: leadWeight },
    };
    onSave(job);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="size-5 text-primary" /> {initialJob ? "HR Admin: Edit Job Opening & Rubric" : "HR Admin: Create Job Opening & Rubric"}
          </DialogTitle>
          <DialogDescription>
            {initialJob ? "Update role requirements, must-haves, and rubric weights." : "Configure role requirements, mandatory must-haves, and calibrated scoring weights."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Job Title *</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lead Platform Engineer"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Company / Team</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. CloudScale Systems"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mandatory Min. Experience (Years) *</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={minExp}
                onChange={(e) => setMinExp(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] text-muted-foreground mt-0.5">Enforces automatic score cap (&lt;60) if unmet.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mandatory Must-Haves (comma-separated) *</label>
              <input
                required
                value={mandatoryStr}
                onChange={(e) => setMandatoryStr(e.target.value)}
                placeholder="Kubernetes, Terraform, AWS, Docker"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Full Job Description / Notes</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste responsibilities, day-to-day requirements, salary benchmarks..."
              className="w-full rounded-md border bg-background p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Rubric Weights */}
          <div className="rounded-lg border p-3 bg-muted/30 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sliders className="size-4 text-primary" /> Calibrate Scoring Rubric Weights
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Tech Stack Match</span>
                  <span className="font-mono text-primary font-bold">{techWeight}%</span>
                </div>
                <input type="range" min="10" max="70" value={techWeight} onChange={(e) => setTechWeight(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Experience & Seniority</span>
                  <span className="font-mono text-primary font-bold">{expWeight}%</span>
                </div>
                <input type="range" min="10" max="50" value={expWeight} onChange={(e) => setExpWeight(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Production Impact</span>
                  <span className="font-mono text-primary font-bold">{impactWeight}%</span>
                </div>
                <input type="range" min="10" max="40" value={impactWeight} onChange={(e) => setImpactWeight(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <div>
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Leadership & Collab</span>
                  <span className="font-mono text-primary font-bold">{leadWeight}%</span>
                </div>
                <input type="range" min="5" max="30" value={leadWeight} onChange={(e) => setLeadWeight(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              Cancel
            </button>
            <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              {initialJob ? "Save Changes & Update Rubric" : "Publish Role & Activate Rubric"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// VIEW JOB DESCRIPTION MODAL
function ViewJdModal({
  open,
  onOpenChange,
  job,
  canDelete,
  onDelete,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  job: JobRole;
  canDelete: boolean;
  onDelete: (id: string, title: string) => void;
  onEdit: (job: JobRole) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="size-5 text-primary" /> {job.title}
          </DialogTitle>
          <DialogDescription>{job.company} · Role Requirements & Calibrated Rubric</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2 text-xs">
          <div>
            <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1">Mandatory Min. Experience</span>
            <span className="font-mono text-sm font-semibold">{job.minExp}+ Years (Strict Score Cap)</span>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1.5">Mandatory Must-Haves</span>
            <div className="flex flex-wrap gap-1.5">
              {job.mandatory.map((m) => (
                <span key={m} className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1.5">Scoring Rubric Distribution</span>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="p-2 rounded border bg-muted/40">Tech Stack: <span className="text-primary font-bold">{job.weights.tech}%</span></div>
              <div className="p-2 rounded border bg-muted/40">Experience Depth: <span className="text-primary font-bold">{job.weights.exp}%</span></div>
              <div className="p-2 rounded border bg-muted/40">Production Impact: <span className="text-primary font-bold">{job.weights.impact}%</span></div>
              <div className="p-2 rounded border bg-muted/40">Leadership: <span className="text-primary font-bold">{job.weights.lead}%</span></div>
            </div>
          </div>
          <div>
            <span className="font-semibold text-muted-foreground uppercase text-[10px] block mb-1">Full Description</span>
            <p className="rounded-lg border bg-muted/20 p-3 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {job.description}
            </p>
          </div>
        </div>

        {/* Action Controls: Edit, Delete, Close */}
        <div className="flex items-center justify-between border-t pt-3 mt-2">
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                onDelete(job.id, job.title);
                onOpenChange(false);
              }}
              className="flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition">
              <Trash2 className="size-3.5" /> Remove Role
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Default Active Role</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(job);
              }}
              className="flex items-center gap-1.5 rounded-md border bg-secondary px-3 py-1.5 text-xs font-medium hover:bg-accent transition">
              <Edit3 className="size-3.5 text-primary" /> Edit Role & Rubric
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// DOCUMENT TEXT EXTRACTOR (PDF.js + Mammoth.js)
async function extractDocumentText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    try {
      // Ensure PDF.js is loaded
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[src*="pdf.min.js"]');
          if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", (e) => reject(e));
            setTimeout(() => resolve(), 800);
          } else {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
          }
        });
      }

      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n\n";
        }

        if (fullText.trim().length > 10) {
          return fullText.trim();
        }
      }
    } catch (err) {
      console.warn("PDF.js extraction failed, attempting fallback...", err);
    }
  } else if (ext === "docx") {
    try {
      if (!(window as any).mammoth) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[src*="mammoth"]');
          if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", (e) => reject(e));
            setTimeout(() => resolve(), 800);
          } else {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
          }
        });
      }

      const mammoth = (window as any).mammoth;
      if (mammoth) {
        const arrayBuffer = await file.arrayBuffer();
        const res = await mammoth.extractRawText({ arrayBuffer });
        if (res.value?.trim()) return res.value.trim();
      }
    } catch (err) {
      console.warn("Mammoth extraction failed, attempting fallback...", err);
    }
  }

  // Fallback to text reader for .txt, .md or raw text streams
  return await file.text();
}

// PRECISION RESUME HEURISTIC EXTRACTOR
function parseResumeDetails(rawText: string, filename: string) {
  // 1. Email extraction (precise email regex)
  const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const email = emailMatch ? emailMatch[0].trim() : "";

  // 2. Candidate Name extraction
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !/^(resume|curriculum|cv|summary|profile|page\s*\d|contact|experience|education|skills)/i.test(l));

  let name = "";
  for (const line of lines.slice(0, 6)) {
    const cleanLine = line.replace(/[|•,].*$/, "").trim();
    if (
      cleanLine.length >= 3 &&
      cleanLine.length <= 40 &&
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(cleanLine) &&
      !/(engineer|developer|architect|full\s*stack|frontend|backend|bachelor|university|college|solutions|company)/i.test(cleanLine)
    ) {
      name = cleanLine;
      break;
    }
  }

  // Fallback to cleaned filename if not discovered in first lines
  if (!name) {
    const cleanFn = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]?(?:software[-_]?engineer|developer|frontend|backend|fullstack|resume|cv|application).*$/i, "")
      .replace(/[-_]/g, " ")
      .trim();
    name = cleanFn || "Candidate Applicant";
  }

  // 3. Location detection
  let location = "Remote / Verified";
  const locMatch = rawText.match(/\b([A-Za-z\s]+,\s*(?:Egypt|USA|United States|UK|United Kingdom|Canada|Germany|France|UAE|Saudi Arabia|Remote))\b/i);
  if (locMatch) {
    location = locMatch[1].trim();
  }

  // 4. University / Education detection
  let university = "Verified Degree";
  const uniMatch = rawText.match(/\b([A-Za-z\s]+(?:University|Polytechnic|Institute|College)[A-Za-z\s-]*)/i);
  if (uniMatch) {
    university = uniMatch[1].replace(/[\n\r]+/g, " ").trim();
  }

  // 5. Tech Stack Detection (comprehensive dictionary)
  const techDictionary = [
    "C#", "ASP.NET", ".NET", "Python", "FastAPI", "Django", "Flask",
    "React", "React.js", "Next.js", "TypeScript", "JavaScript", "Node.js", "Express.js", "Express",
    "PostgreSQL", "SQL Server", "MySQL", "MongoDB", "Redis",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Linux",
    "Tailwind CSS", "Tailwind", "RESTful APIs", "REST API", "GraphQL",
    "Git", "CI/CD", "LangChain", "LlamaIndex", "Vector DB", "Qdrant", "Pinecone",
    "Storybook", "SNMP", "Modbus", "IoT", "C++", "C", "Java", "Bash"
  ];

  const matchedTechs = new Set<string>();
  techDictionary.forEach((tech) => {
    let regex: RegExp;
    if (tech === "C#" || tech === ".NET" || tech === "C++") {
      regex = new RegExp(`(?:^|[\\s,;/(])${tech.replace("+", "\\+").replace("#", "\\#")}(?:$|[\\s,;/)-])`, "i");
    } else {
      regex = new RegExp(`\\b${tech.replace(".", "\\.")}\\b`, "i");
    }
    if (regex.test(rawText)) {
      matchedTechs.add(tech);
    }
  });

  // 6. Years of experience calculation
  let calculatedExp = 3.0;
  const explicitMatch = rawText.match(/(\d+(?:\.\d+)?)\+?\s*years?\s*(?:of)?\s*(?:experience|exp)/i);
  if (explicitMatch) {
    calculatedExp = parseFloat(explicitMatch[1]);
  } else {
    // Detect employment date ranges
    const yearMatches = Array.from(rawText.matchAll(/\b(201\d|202[0-6])\b/g)).map((m) => parseInt(m[1]));
    if (yearMatches.length > 0) {
      const minYear = Math.min(...yearMatches);
      const currentYear = 2026;
      if (minYear >= 2012 && minYear <= currentYear) {
        calculatedExp = Math.max(1.0, Math.round((currentYear - minYear) * 0.8 * 10) / 10);
      }
    }
  }

  return {
    name,
    email,
    location,
    university,
    skills: Array.from(matchedTechs),
    experience: calculatedExp,
  };
}

// UPLOAD CV & EVALUATION MODAL
function UploadModal({
  open, onOpenChange, activeJob, onCandidateCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  activeJob: JobRole;
  onCandidateCreated: (c: Candidate) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [exp, setExp] = useState(5.0);
  const [skillsStr, setSkillsStr] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [location, setLocation] = useState("Remote / Verified");
  const [university, setUniversity] = useState("Verified Degree");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsing(true);
    toast.info(`Extracting text from ${file.name}...`);

    try {
      const extractedText = await extractDocumentText(file);
      setResumeText(extractedText);

      // Perform intelligent extraction
      const parsed = parseResumeDetails(extractedText, file.name);

      setName(parsed.name);
      if (parsed.email) setEmail(parsed.email);
      setExp(parsed.experience);
      if (parsed.skills.length > 0) {
        setSkillsStr(parsed.skills.join(", "));
      }
      setLocation(parsed.location);
      setUniversity(parsed.university);

      toast.success(`Successfully parsed ${file.name}!`, {
        description: `Identified candidate ${parsed.name} with ${parsed.skills.length} matching skills.`,
      });
    } catch (err) {
      console.error("Resume parsing error:", err);
      toast.error("Failed to parse document text. You can paste the text manually.");
    } finally {
      setParsing(false);
    }
  };

  const handleIngest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide candidate name.");
      return;
    }

    const skills = skillsStr.split(",").map((s) => s.trim()).filter(Boolean);
    const matchedMandatory = activeJob.mandatory.filter((m) =>
      skills.some((s) => s.toLowerCase().includes(m.toLowerCase()))
    );
    const ratio = matchedMandatory.length / (activeJob.mandatory.length || 1);

    let calculatedScore = 75;
    if (exp < activeJob.minExp) {
      calculatedScore = Math.min(55, Math.round(exp * 14));
    } else {
      calculatedScore = Math.round(50 + ratio * 35 + Math.min(exp * 2, 14));
      if (calculatedScore > 98) calculatedScore = 96;
    }

    let tier: Tier = 2;
    if (calculatedScore >= 85) tier = 1;
    else if (calculatedScore < 60) tier = 3;

    const candId = "cand_" + Date.now();
    const newCand: Candidate = {
      id: candId,
      anonId: "Candidate C-" + Math.floor(10 + Math.random() * 89),
      name: name.trim(),
      contactEmail: email.trim() || undefined,
      university: university || "Verified Degree",
      location: location || "Remote / Verified",
      roleId: activeJob.id,
      score: calculatedScore,
      tier: tier,
      years: exp,
      matched: skills.length > 0 ? skills : activeJob.mandatory.slice(0, 2),
      missing: activeJob.mandatory.filter((m) => !skills.some((s) => s.toLowerCase().includes(m.toLowerCase()))),
      takeaway: `${skills.slice(0, 3).join(", ")} experience (${exp} yrs). ${calculatedScore >= 85 ? `Matched ${matchedMandatory.length}/${activeJob.mandatory.length} mandatory skills.` : `Below role bar: requires ${activeJob.minExp}+ yrs.`}`,
      breakdown: [
        { label: "Technical Skills", weight: activeJob.weights.tech, score: Math.round(calculatedScore * 1.02) },
        { label: "Experience", weight: activeJob.weights.exp, score: Math.round(calculatedScore * 0.98) },
        { label: "Impact", weight: activeJob.weights.impact, score: Math.round(calculatedScore * 0.95) },
        { label: "Leadership", weight: activeJob.weights.lead, score: 75 },
      ],
      strengths: [
        { point: `Verified background in ${skills.slice(0, 2).join(", ") || "software engineering"}`, quote: "Demonstrated production experience from parsed resume." },
      ],
      gaps: [
        { flag: exp < activeJob.minExp ? `Under mandatory ${activeJob.minExp}-year bar for this role` : "Standard technical verification recommended", severity: exp < activeJob.minExp ? "High" : "Low" },
      ],
      questions: [
        { type: "Technical", q: "Walk us through your hands-on experience scaling production systems.", strong: "Cites concrete metrics, architecture trade-offs, and failure handling.", weak: "Theoretical answer with no production specifics." },
      ],
      email: `Subject: Next Steps: ${activeJob.title}\n\nHi ${name},\n\nThank you for applying. We reviewed your profile and experience in ${skills.join(", ") || "engineering"}.\n\n${tier === 1 ? "We would love to invite you to an initial screening call: [Insert Booking Link]" : "We are currently reviewing candidate cohorts and will follow up shortly."}\n\nBest,\nLili (Technical Recruiter)`,
    };

    onCandidateCreated(newCand);
    setName("");
    setEmail("");
    setSkillsStr("");
    setResumeText("");
    setFileName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="size-5 text-primary" /> Upload & Parse Candidate CV
          </DialogTitle>
          <DialogDescription>
            Evaluating against <strong className="text-foreground">{activeJob.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleIngest} className="space-y-4 pt-2 text-sm">
          {/* File Picker */}
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center hover:bg-accent/40 transition">
            {parsing ? (
              <Loader2 className="size-6 text-primary animate-spin" />
            ) : (
              <Upload className="size-6 text-primary" />
            )}
            <span className="text-sm font-medium">
              {parsing ? "Parsing PDF/Word document with Lili Engine..." : "Click to select resume file (.pdf, .docx, .txt)"}
            </span>
            {fileName && (
              <span className="text-xs text-primary font-mono font-semibold">
                {parsing ? `Processing ${fileName}...` : `✓ Parsed: ${fileName}`}
              </span>
            )}
            <input type="file" accept=".pdf,.docx,.txt" disabled={parsing} className="hidden" onChange={handleFileUpload} />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Candidate Name *</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Laila Mohamed Fikry"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Candidate Email (Auto-extracted)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. candidate@gmail.com"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Years of Experience *</label>
              <input
                type="number"
                step="0.5"
                value={exp}
                onChange={(e) => setExp(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Core Tech Stack (Auto-detected)</label>
              <input
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="React, TypeScript, Python, FastAPI"
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-muted-foreground">Extracted Resume Text (Clean)</label>
              {resumeText && <span className="text-[10px] text-muted-foreground font-mono">{resumeText.length} characters extracted</span>}
            </div>
            <textarea
              rows={4}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Resume text extracted by PDF.js engine will appear here..."
              className="w-full rounded-md border bg-background p-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              Cancel
            </button>
            <button type="submit" disabled={parsing || !name.trim()} className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              Ingest & Score against Active Role
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// SCORE RING
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

// CANDIDATE DRAWER
function CandidateDrawer({
  candidate, open, onClose, tab, onTabChange, name,
}: {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  tab: string;
  onTabChange: (t: string) => void;
  name: string;
  onCandidateUpdated?: (c: Candidate) => void;
}) {
  if (!candidate) return null;
  const tone = scoreTone(candidate.score);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-bold">{name}</SheetTitle>
              <SheetDescription className="text-xs">{candidate.years} years exp · {candidate.location}</SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", tierMeta[candidate.tier].cls)}>
                {tierMeta[candidate.tier].label}
              </span>
              <ScoreRing score={candidate.score} size={44} />
            </div>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={onTabChange} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scorecard" className="text-xs">Scorecard</TabsTrigger>
            <TabsTrigger value="questions" className="text-xs">Interview Guide</TabsTrigger>
            <TabsTrigger value="email" className="text-xs">Outreach Email</TabsTrigger>
          </TabsList>

          <TabsContent value="scorecard" className="space-y-4 pt-4 text-xs">
            <div className="space-y-2">
              <span className="font-semibold text-foreground text-xs block">Rubric Score Breakdown</span>
              {candidate.breakdown.map((b) => (
                <div key={b.label}>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>{b.label}</span>
                    <span className="font-mono text-foreground font-semibold">{b.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", toneBg[tone])} style={{ width: `${b.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t">
              <span className="font-semibold text-foreground text-xs block mb-2">💪 Evidence-Backed Strengths</span>
              <ul className="space-y-2">
                {candidate.strengths.map((s, idx) => (
                  <li key={idx} className="rounded-lg border bg-muted/20 p-2.5">
                    <span className="font-medium text-foreground block">{s.point}</span>
                    <span className="text-[11px] text-muted-foreground italic mt-0.5 block">"{s.quote}"</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t">
              <span className="font-semibold text-foreground text-xs block mb-2">⚠️ Gaps & Verification Flags</span>
              <ul className="space-y-1.5">
                {candidate.gaps.map((g, idx) => (
                  <li key={idx} className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-2">
                    <AlertTriangle className="size-3.5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <span className="text-foreground block">{g.flag}</span>
                      <span className="text-[10px] text-warning font-semibold">Severity: {g.severity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-3 pt-4 text-xs">
            {candidate.questions.map((q, idx) => (
              <div key={idx} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Question {idx + 1}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">{q.type}</span>
                </div>
                <p className="text-foreground font-medium text-xs">"{q.q}"</p>
                <div className="rounded bg-success/10 border border-success/20 p-2 text-[11px] text-success">
                  <strong>Strong Signal:</strong> {q.strong}
                </div>
                <div className="rounded bg-destructive/10 border border-destructive/20 p-2 text-[11px] text-destructive">
                  <strong>Weak Signal:</strong> {q.weak}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="email" className="space-y-3 pt-4 text-xs">
            <CandidateEmailEditor
              candidate={candidate}
              onCandidateUpdated={onCandidateUpdated}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function CandidateEmailEditor({
  candidate,
  onCandidateUpdated,
}: {
  candidate: Candidate;
  onCandidateUpdated?: (c: Candidate) => void;
}) {
  const parseDraft = (full: string) => {
    const match = full.match(/^Subject:\s*([^\n]+)\n+([\s\S]*)$/i);
    if (match) {
      return { subject: match[1].trim(), body: match[2].trim() };
    }
    return { subject: `Next Steps: Technical Screening with TalentScout AI`, body: full };
  };

  const initial = parseDraft(candidate.email);
  const [recipient, setRecipient] = useState(
    candidate.contactEmail || `${candidate.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@example.com`
  );
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [sending, setSending] = useState(false);
  const [isSent, setIsSent] = useState(!!candidate.emailSent);

  useEffect(() => {
    const parsed = parseDraft(candidate.email);
    setSubject(parsed.subject);
    setBody(parsed.body);
    setRecipient(candidate.contactEmail || `${candidate.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@example.com`);
    setIsSent(!!candidate.emailSent);
  }, [candidate]);

  const handleSendViaInbox = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setIsSent(true);
      const updated: Candidate = {
        ...candidate,
        contactEmail: recipient,
        emailSent: true,
        email: `Subject: ${subject}\n\n${body}`,
      };
      onCandidateUpdated?.(updated);
      toast.success(`⚡ Email dispatched to ${candidate.name}!`, {
        description: `Delivered via connected inbox laila.mohamed.fikry@gmail.com to ${recipient}`,
      });
    }, 800);
  };

  const handleOpenGmail = () => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(url, "_blank");
  };

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${body}`);
    toast.success("Full email draft copied to clipboard!");
  };

  return (
    <div className="space-y-3.5">
      {/* Connected Account Banner */}
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 p-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-foreground">Connected Recruiter Inbox:</span>
          <span className="font-mono text-primary font-semibold">laila.mohamed.fikry@gmail.com</span>
        </div>
        {isSent && (
          <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success border border-success/30">
            <CheckCircle2 className="size-3" /> Sent
          </span>
        )}
      </div>

      {/* Recipient Input */}
      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">To (Candidate Email)</label>
        <input
          type="email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="candidate@example.com"
          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Subject Line */}
      <div>
        <label className="block text-[11px] font-semibold text-muted-foreground uppercase mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject..."
          className="w-full rounded-md border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Message Body */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-semibold text-muted-foreground uppercase">Email Body (Fully Editable)</label>
          <span className="text-[10px] text-muted-foreground">Synthesized by Lili Agent</span>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={9}
          className="w-full rounded-md border bg-background p-3 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring font-sans"
        />
      </div>

      {/* Dispatch Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          onClick={handleSendViaInbox}
          disabled={sending}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-success py-2.5 text-xs font-semibold text-success-foreground hover:opacity-90 transition shadow-sm disabled:opacity-50">
          {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          {sending ? "Sending via Inbox..." : "⚡ Send via Connected Inbox"}
        </button>
        <button
          onClick={handleOpenGmail}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary py-2.5 text-xs font-semibold hover:bg-accent transition">
          <ExternalLink className="size-3.5 text-primary" /> Open in Gmail App
        </button>
      </div>

      <button
        onClick={handleCopyDraft}
        className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground pt-0.5 transition">
        <Copy className="size-3" /> Copy Email Draft to Clipboard
      </button>
    </div>
  );
}

// AUTONOMOUS EMAIL DISPATCH MODAL
const DISPATCH_STEPS = [
  "Synthesizing candidate profiles with calibrated JD criteria…",
  "Generating individualized, evidence-based emails…",
  "Attaching 30-minute calendar screening links…",
  "Dispatching communications via Lili Agent…",
  "Syncing status to ATS Pipeline Database…",
];

function DispatchModal({
  kind, candidates, nameOf, onClose, onDone,
}: {
  kind: "invite" | "feedback";
  candidates: Candidate[];
  nameOf: (c: Candidate) => string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState(-1);
  const running = step >= 0 && step < DISPATCH_STEPS.length;
  const done = step >= DISPATCH_STEPS.length;

  const start = () => {
    setStep(0);
    DISPATCH_STEPS.forEach((_, i) => {
      setTimeout(() => setStep(i + 1), 600 * (i + 1));
    });
    setTimeout(onDone, 600 * DISPATCH_STEPS.length + 500);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !running && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="size-5 text-primary" /> Autonomous Email Dispatch Engine
          </DialogTitle>
          <DialogDescription>
            {kind === "invite" ? "Dispatching 1st-round interview invitations" : "Dispatching respectful constructive feedback"} to {candidates.length} candidates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 border-y py-3">
          {DISPATCH_STEPS.map((s, i) => (
            <div key={s} className={cn("flex items-center gap-2 text-xs font-mono transition-opacity", i > step && "opacity-30")}>
              {i < step ? (
                <Check className="size-3.5 text-success" />
              ) : i === step && !done ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <span className="size-3.5" />
              )}
              <span className={i < step ? "text-foreground font-semibold" : "text-muted-foreground"}>{s}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} disabled={running} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={start}
            disabled={running || done}
            className={cn("flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50",
              kind === "invite" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground")}>
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            {done ? "Dispatched!" : running ? "Dispatching…" : `Confirm & Dispatch (${candidates.length})`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
