import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Loader2, LogOut, Save, Trash2, User as UserIcon } from "lucide-react";
import { deleteUser } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function Settings() {
  const { profile, logout, updateProfile } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState(profile?.name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile({ name: name.trim(), bio: bio.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError((e as Error).message ?? "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    if (!profile) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "users", profile.id));
      if (auth.currentUser) await deleteUser(auth.currentUser);
      navigate("/login");
    } catch (e) {
      setError(
        (e as Error).message ??
          "Failed to delete account. You may need to log out and back in first.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4">
        <h1 className="font-bold text-lg mb-1">Settings</h1>
        <p className="text-xs text-fb-text-secondary">
          Manage your Palava Hub account. School and avatar can be changed in
          the mobile app.
        </p>
      </div>

      <section className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <UserIcon className="w-4 h-4" /> Profile
        </h2>
        <label className="block text-sm">
          <span className="block text-fb-text-secondary mb-1">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-fb-bg rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-palava-red/40"
          />
        </label>
        <label className="block text-sm">
          <span className="block text-fb-text-secondary mb-1">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            rows={3}
            className="w-full bg-fb-bg rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-palava-red/40 resize-none"
          />
          <div className="text-right text-[11px] text-fb-text-secondary">
            {bio.length}/200
          </div>
        </label>
        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
            {error}
          </div>
        )}
        {saved && (
          <div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
            Saved!
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={save}
            disabled={busy}
            className="bg-palava-red hover:bg-palava-red-dark text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </section>

      <section className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 space-y-3">
        <h2 className="font-semibold">Account</h2>
        <div className="text-sm">
          <div className="text-fb-text-secondary">Email</div>
          <div>{profile?.email ?? "—"}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void logout()}
            className="px-4 py-2 rounded-lg bg-fb-bg hover:bg-fb-hover text-sm font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete account
            </button>
          ) : (
            <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <div className="text-sm text-red-800 font-semibold">
                Permanently delete your Palava Hub account?
              </div>
              <div className="text-xs text-red-700">
                This removes your profile and posts. This cannot be undone.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={doDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1"
                >
                  {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded bg-white border border-red-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-fb-card rounded-xl shadow-sm border border-fb-border p-4 space-y-2 text-sm">
        <h2 className="font-semibold">Legal & support</h2>
        <ul className="text-fb-text-secondary space-y-1">
          <li>Community Guidelines — coming soon</li>
          <li>Privacy Policy — coming soon</li>
          <li>
            Report a problem — use{" "}
            <span className="font-mono">Settings → Report & Help</span> in the
            mobile app.
          </li>
        </ul>
      </section>
    </div>
  );
}
