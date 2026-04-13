import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSchools,
  getListSchoolsQueryKey,
  useCreateSchool,
  useUpdateSchool,
  useDeleteSchool,
} from "@workspace/api-client-react";
import type { School } from "@workspace/api-client-react";

type SchoolType = "university" | "high_school";

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
  const qc = useQueryClient();
  const [form, setForm] = useState<SchoolFormData>({
    name: school?.name ?? "",
    type: (school?.type as SchoolType) ?? "university",
    location: school?.location ?? "",
    county: school?.county ?? "",
  });

  const createMutation = useCreateSchool({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSchoolsQueryKey() });
        onClose();
      },
    },
  });

  const updateMutation = useUpdateSchool({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSchoolsQueryKey() });
        onClose();
      },
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (school) {
      updateMutation.mutate({ id: school.id, data: form });
    } else {
      createMutation.mutate({ data: form });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-foreground">{school ? "Edit School" : "Add School"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-school">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">School Name</label>
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
              onChange={(e) => setForm({ ...form, type: e.target.value as SchoolType })}
              data-testid="select-school-type"
              className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="university">University</option>
              <option value="high_school">Senior High School</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Location / City</label>
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
              disabled={isPending}
              data-testid="button-save-school"
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Saving..." : school ? "Save Changes" : "Add School"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SchoolsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [modalSchool, setModalSchool] = useState<School | null | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    ...(search ? { search } : {}),
    ...(typeFilter ? { type: typeFilter as "university" | "high_school" } : {}),
  };

  const schoolsQuery = useListSchools(params, {
    query: { queryKey: getListSchoolsQueryKey(params) },
  });

  const deleteMutation = useDeleteSchool({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListSchoolsQueryKey() });
        setDeleteId(null);
      },
    },
  });

  const schools = schoolsQuery.data ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Schools</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage Liberian institutions on the platform</p>
        </div>
        <button
          onClick={() => setModalSchool(null)}
          data-testid="button-add-school"
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add School
        </button>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
        {schoolsQuery.isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading schools...</div>
        ) : schools.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-muted-foreground">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">No schools found</p>
            <p className="text-xs text-muted-foreground mt-1">Add a Liberian institution to get started</p>
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
                <tr key={school.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-school-${school.id}`}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-foreground">{school.name}</p>
                    <p className="text-xs text-muted-foreground">{school.location}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      school.type === "university"
                        ? "bg-primary/10 text-primary"
                        : "bg-chart-2/10 text-chart-2"
                    }`}>
                      {school.type === "university" ? "University" : "Senior High"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{school.county}</td>
                  <td className="px-5 py-3.5 text-sm text-foreground font-medium">{school.userCount ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setModalSchool(school)}
                        data-testid={`button-edit-school-${school.id}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteId(school.id)}
                        data-testid={`button-delete-school-${school.id}`}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
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

      {/* Modal */}
      {modalSchool !== undefined && (
        <SchoolModal school={modalSchool ?? undefined} onClose={() => setModalSchool(undefined)} />
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-foreground mb-2">Delete School</h2>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. The school will be permanently removed from the platform.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: deleteId })}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
