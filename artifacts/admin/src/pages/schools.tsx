import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type SchoolType = "university" | "high_school";

type School = {
  id: string;
  name: string;
  type: SchoolType;
  location: string;
  county: string;
  userCount?: number;
};

interface BulkRow {
  name: string;
  type: SchoolType;
  location: string;
  county: string;
  error?: string;
}

const CSV_TEMPLATE = `name,type,location,county
University of Liberia,university,Monrovia,Montserrado
Cuttington University,university,Suakoko,Bong
William V.S. Tubman University,university,Harper,Maryland
African Methodist Episcopal University,university,Monrovia,Montserrado
United Methodist University,university,Monrovia,Montserrado
Monrovia Consolidated School System,high_school,Monrovia,Montserrado
Ricks Institute,high_school,Virginia,Montserrado
`;

function parseCSV(text: string): BulkRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const typeIdx = headers.indexOf("type");
  const locIdx = headers.indexOf("location");
  const countyIdx = headers.indexOf("county");
  if (nameIdx === -1 || typeIdx === -1 || locIdx === -1 || countyIdx === -1) {
    return [
      {
        name: "",
        type: "university",
        location: "",
        county: "",
        error: "Invalid headers. Expected: name, type, location, county",
      },
    ];
  }
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const rawType = cols[typeIdx]?.toLowerCase() ?? "";
      const type: SchoolType =
        rawType === "high_school" || rawType === "high school"
          ? "high_school"
          : "university";
      const row: BulkRow = {
        name: cols[nameIdx] ?? "",
        type,
        location: cols[locIdx] ?? "",
        county: cols[countyIdx] ?? "",
      };
      if (!row.name) row.error = "Missing name";
      else if (!row.location) row.error = "Missing location";
      else if (!row.county) row.error = "Missing county";
      return row;
    });
}

async function createSchoolDoc(data: Omit<School, "id" | "userCount">) {
  await addDoc(collection(db, "schools"), {
    ...data,
    userCount: 0,
    createdAt: serverTimestamp(),
  });
}

function BulkUploadModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [phase, setPhase] = useState<"pick" | "preview" | "importing" | "done">("pick");
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ ok: number; fail: number }>({ ok: 0, fail: 0 });

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setPhase("preview");
    };
    reader.readAsText(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "palava_schools_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runImport() {
    const valid = rows.filter((r) => !r.error);
    if (valid.length === 0) return;
    setPhase("importing");
    setProgress(0);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        await createSchoolDoc({
          name: row.name,
          type: row.type,
          location: row.location,
          county: row.county,
        });
        ok++;
      } catch {
        fail++;
      }
      setProgress(Math.round(((i + 1) / valid.length) * 100));
    }
    setResults({ ok, fail });
    setPhase("done");
  }

  const validRows = rows.filter((r) => !r.error);
  const invalidRows = rows.filter((r) => r.error);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[88vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Bulk Upload Schools</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a CSV file to add multiple schools at once
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {phase === "pick" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-muted/50 rounded-xl border border-border">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Download CSV Template</p>
                  <p className="text-xs text-muted-foreground">Use this template as a starting point</p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Download
                </button>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                  dragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) loadFile(f);
                  }}
                />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Drop your CSV file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse · .csv files only</p>
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-muted/60">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Required CSV columns
                  </p>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        {["name", "type", "location", "county"].map((h) => (
                          <th key={h} className="pr-6 pb-2 font-mono font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-foreground">
                      <tr>
                        <td className="pr-6 py-0.5">University of Liberia</td>
                        <td className="pr-6 py-0.5 font-mono">university</td>
                        <td className="pr-6 py-0.5">Monrovia</td>
                        <td className="pr-6 py-0.5">Montserrado</td>
                      </tr>
                      <tr>
                        <td className="pr-6 py-0.5">Ricks Institute</td>
                        <td className="pr-6 py-0.5 font-mono">high_school</td>
                        <td className="pr-6 py-0.5">Virginia</td>
                        <td className="pr-6 py-0.5">Montserrado</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {phase === "preview" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {validRows.length} ready to import
                  </span>
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-red-500">
                      {invalidRows.length} will be skipped
                    </span>
                  </div>
                )}
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">County</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((row, i) => (
                        <tr key={i} className={row.error ? "bg-red-500/5" : "hover:bg-muted/20"}>
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {row.name || <span className="text-muted-foreground italic">empty</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-mono ${
                                row.type === "university"
                                  ? "bg-primary/10 text-primary"
                                  : "bg-chart-2/10 text-chart-2"
                              }`}
                            >
                              {row.type}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.location || "—"}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{row.county || "—"}</td>
                          <td className="px-4 py-2.5">
                            {row.error ? (
                              <span className="text-xs text-red-500">✗ {row.error}</span>
                            ) : (
                              <span className="text-xs text-green-600">✓ Ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => {
                  setRows([]);
                  setPhase("pick");
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                ← Upload a different file
              </button>
            </div>
          )}

          {phase === "importing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Importing schools…</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress}% complete — please don't close this window
                </p>
              </div>
              <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-green-500">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <p className="text-base font-bold text-foreground">Import Complete</p>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{results.ok}</p>
                    <p className="text-xs text-muted-foreground">Imported</p>
                  </div>
                  {results.fail > 0 && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-500">{results.fail}</p>
                      <p className="text-xs text-muted-foreground">Failed</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-3">
          {phase === "done" ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          ) : phase === "preview" ? (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={runImport}
                disabled={validRows.length === 0}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Import {validRows.length} School{validRows.length !== 1 ? "s" : ""}
              </button>
            </>
          ) : phase === "pick" ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface SchoolFormData {
  name: string;
  type: SchoolType;
  location: string;
  county: string;
}

function SchoolModal({
  school,
  onClose,
}: {
  school?: School;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SchoolFormData>({
    name: school?.name ?? "",
    type: (school?.type as SchoolType) ?? "university",
    location: school?.location ?? "",
    county: school?.county ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (school) {
        await updateDoc(doc(db, "schools", school.id), {
          name: form.name,
          type: form.type,
          location: form.location,
          county: form.county,
        });
      } else {
        await createSchoolDoc(form);
      }
      onClose();
    } catch (err) {
      console.error("Save school failed:", err);
      alert("Could not save school. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-foreground">
            {school ? "Edit School" : "Add School"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-school">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              School Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="University of Liberia"
              data-testid="input-school-name"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as SchoolType })
              }
              data-testid="select-school-type"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="university">University</option>
              <option value="high_school">Senior High School</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Location / City
            </label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
              placeholder="Monrovia"
              data-testid="input-school-location"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">County</label>
            <input
              value={form.county}
              onChange={(e) => setForm({ ...form, county: e.target.value })}
              required
              placeholder="Montserrado"
              data-testid="input-school-county"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="button-save-school"
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving..." : school ? "Save Changes" : "Add School"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [modalSchool, setModalSchool] = useState<School | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "schools"),
      (snap) => {
        setAllSchools(
          snap.docs.map((d) => {
            const data = d.data() as Omit<School, "id">;
            return { id: d.id, ...data };
          }),
        );
        setLoading(false);
      },
      (err) => {
        console.error("schools onSnapshot failed:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  const schools = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSchools.filter((s) => {
      if (typeFilter && s.type !== typeFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.county.toLowerCase().includes(q)
      );
    });
  }, [allSchools, search, typeFilter]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "schools", id));
      setDeleteId(null);
    } catch (err) {
      console.error("Delete school failed:", err);
      alert("Could not delete school. Try again.");
    }
    setDeleting(false);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Schools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage Liberian institutions on the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            data-testid="button-bulk-upload"
            className="px-4 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Bulk Upload
          </button>
          <button
            onClick={() => setModalSchool(null)}
            data-testid="button-add-school"
            className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Add School
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="search"
          placeholder="Search schools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-schools"
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          data-testid="select-filter-type"
          className="px-3.5 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Types</option>
          <option value="university">Universities</option>
          <option value="high_school">Senior High Schools</option>
        </select>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Loading schools...
          </div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-foreground">No schools found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a Liberian institution to get started — use "Bulk Upload" to
              import many at once.
            </p>
          </div>
        ) : (
          <table className="w-full" data-testid="table-schools">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">County</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Students</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schools.map((school) => (
                <tr
                  key={school.id}
                  className="hover:bg-muted/30 transition-colors"
                  data-testid={`row-school-${school.id}`}
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{school.name}</p>
                    <p className="text-xs text-muted-foreground">{school.location}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        school.type === "university"
                          ? "bg-primary/10 text-primary"
                          : "bg-chart-2/10 text-chart-2"
                      }`}
                    >
                      {school.type === "university" ? "University" : "Senior High"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {school.county}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-foreground font-medium">
                    {school.userCount ?? 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModalSchool(school)}
                        data-testid={`button-edit-school-${school.id}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(school.id)}
                        data-testid={`button-delete-school-${school.id}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showBulkUpload && (
        <BulkUploadModal onClose={() => setShowBulkUpload(false)} />
      )}

      {modalSchool !== undefined && (
        <SchoolModal
          school={modalSchool ?? undefined}
          onClose={() => setModalSchool(undefined)}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">
              Delete School
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This action cannot be undone. The school will be permanently
              removed from the platform.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                data-testid="button-confirm-delete"
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
