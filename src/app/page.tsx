"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  Check,
  Grid2X2,
  Layers,
  LogOut,
  Plus,
  Shirt,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  supabase,
  authCallback,
  categories,
  labels,
  preparePhoto,
  type Category,
  type Clothing,
  type Outfit,
} from "@/lib/supabase";

import { createCutout } from "@/lib/clothing-cutout";

const piecePrompts: Record<Category, string> = {
  top: "upper",
  bottom: "pants",
  jacket: "upper",
  shoes: "shoes",
};

type View = "wardrobe" | "studio" | "add";
type Selection = Partial<Record<Category, string>>;
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : (error as { message?: string })?.message ||
      "Something went wrong. Please try again.";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [callbackError, setCallbackError] = useState("");
  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    setRecovery(authCallback.recovery && !authCallback.error);
    if (authCallback.error) {
      setCallbackError(
        `This email link could not be used: ${authCallback.error}. Request a new link and try again.`,
      );
      window.history.replaceState(null, "", "/");
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  if (!supabase) return <Setup />;
  if (!ready) return <div className="loading">Opening your wardrobe…</div>;
  return (
    <>
      {callbackError && (
        <div className="notice error" role="alert">
          {callbackError}
          <button
            className="icon-button"
            aria-label="Dismiss link error"
            onClick={() => setCallbackError("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {!user || recovery ? (
        <Auth
          recovery={recovery && !!user}
          onRecovered={() => {
            window.history.replaceState(null, "", "/");
            setRecovery(false);
          }}
        />
      ) : (
        <Wardrobe key={user.id} user={user} />
      )}
    </>
  );
}

function Setup() {
  return (
    <div className="auth-shell">
      <div className="auth-story">
        <span className="eyebrow">THE EDIT / PERSONAL WARDROBE</span>
        <h1>
          Less searching.
          <br />
          More you.
        </h1>
        <p>A little space for everything you love to wear.</p>
        <Shirt size={100} strokeWidth={0.7} />
      </div>
      <div className="auth-panel">
        <div className="setup-card">
          <span className="eyebrow">LET’S MAKE ROOM</span>
          <h2>Your wardrobe starts here.</h2>
          <p>
            Connect your private backend to start collecting pieces and creating
            outfits.
          </p>
          <ol className="setup-steps">
            <li>Create a Supabase project.</li>
            <li>
              Run <code>supabase/schema.sql</code> in its SQL Editor.
            </li>
            <li>
              Copy <code>.env.example</code> to <code>.env.local</code> and add
              your project URL and publishable key.
            </li>
            <li>
              Configure authentication URLs using the README, then restart the
              app.
            </li>
          </ol>
          <p className="subtitle">
            Your personal wardrobe. Your style, collected.
          </p>
        </div>
      </div>
    </div>
  );
}

function Auth({
  recovery,
  onRecovered,
}: {
  recovery: boolean;
  onRecovered: () => void;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const client = supabase!;
      if (recovery) {
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;
        onRecovered();
      } else if (mode === "login") {
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === "signup") {
        const { error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setNotice(
          "Check your email to confirm your account, then come back to sign in.",
        );
      } else {
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/?recovery=1`,
        });
        if (error) throw error;
        setNotice(
          "If an account exists for that email, a password reset link is on its way.",
        );
      }
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-story">
        <span className="eyebrow">THE EDIT / PERSONAL WARDROBE</span>
        <h1>
          Good style.
          <br />
          Already yours.
        </h1>
        <p>
          Rediscover what you own. Make a little room for everyday inspiration.
        </p>
        <div className="outfit-board" aria-hidden="true">
          {[Shirt, Layers, Grid2X2, Check].map((Icon, i) => (
            <div className="outfit-slot" key={i}>
              <Icon size={64} strokeWidth={0.8} />
            </div>
          ))}
        </div>
        <span className="subtitle">CURATED BY YOU. WORN BY YOU.</span>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-logo">
            <Shirt /> THE EDIT
          </div>
          <span className="eyebrow">YOUR PRIVATE STYLE SPACE</span>
          <h2>
            {recovery
              ? "A fresh start."
              : mode === "signup"
                ? "Make yourself at home."
                : mode === "reset"
                  ? "Forgot your password?"
                  : "Welcome back."}
          </h2>
          <p className="subtitle">
            {recovery
              ? "Choose a new password for your account."
              : mode === "reset"
                ? "We’ll email you a link to reset it."
                : "Your wardrobe, thoughtfully brought together."}
          </p>
          <form className="form-stack" onSubmit={submit}>
            {!recovery && (
              <label className="field">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            )}
            {(recovery || mode !== "reset") && (
              <label className="field">
                Password
                <input
                  type="password"
                  autoComplete={
                    mode === "login" && !recovery
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={mode === "login" && !recovery ? undefined : 8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>
            )}
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="notice success" role="status">
                {notice}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy
                ? "Please wait…"
                : recovery
                  ? "Update password"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "reset"
                      ? "Send reset link"
                      : "Step inside"}
              <ArrowRight size={18} />
            </button>
          </form>
          {!recovery && (
            <div className="auth-footer">
              {mode === "login" && (
                <button
                  className="inline-link"
                  onClick={() => {
                    setMode("reset");
                    setError("");
                    setNotice("");
                  }}
                >
                  Forgot password?
                </button>
              )}
              <p>
                {mode === "login" ? "New here? " : "Already have an account? "}
                <button
                  className="inline-link"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setError("");
                    setNotice("");
                  }}
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Wardrobe({ user }: { user: User }) {
  const [view, setView] = useState<View>("wardrobe");
  const [items, setItems] = useState<Clothing[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Clothing | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [slot, setSlot] = useState<Category>("top");
  const [outfitName, setOutfitName] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletion, setDeletion] = useState<{
    type: "item" | "outfit";
    id: string;
    name: string;
  } | null>(null);
  const reload = useCallback(async () => {
    const client = supabase!;
    const [clothes, looks] = await Promise.all([
      client
        .from("clothing_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      client
        .from("outfits")
        .select("id,name,created_at,outfit_items(clothing_item_id,slot)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (clothes.error) throw clothes.error;
    if (looks.error) throw looks.error;
    const rows = clothes.data as Clothing[];
    if (rows.length) {
      const signed = await client.storage.from("clothing").createSignedUrls(
        rows.map((item) => item.image_path),
        3600,
      );
      if (signed.error) throw signed.error;
      rows.forEach((item, index) => {
        item.url = signed.data[index]?.signedUrl ?? undefined;
      });
    }
    setItems(rows);
    setOutfits(looks.data as Outfit[]);
    setSelection((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([slot, id]) =>
          rows.some((item) => item.id === id && item.category === slot),
        ),
      ),
    );
  }, [user.id]);
  useEffect(() => {
    reload()
      .catch((e) => setError(message(e)))
      .finally(() => setLoading(false));
    const timer = setInterval(
      () => {
        reload().catch((e) => setError(message(e)));
      },
      45 * 60 * 1000,
    );
    return () => clearInterval(timer);
  }, [reload]);
  function navigate(next: View) {
    setView(next);
    setEditing(null);
    setNotice("");
    setError("");
  }
  async function saveOutfit(event: FormEvent) {
    event.preventDefault();
    if (!Object.values(selection).some(Boolean)) {
      setError("Choose at least one piece for your outfit.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { error } = await supabase!.rpc("save_outfit", {
        p_name: outfitName.trim() || "Untitled outfit",
        p_items: Object.fromEntries(
          Object.entries(selection).filter(([, id]) => id),
        ),
      });
      if (error) throw error;
      setNotice("Outfit saved. A good look, ready when you are.");
      setOutfitName("");
      setSelection({});
      await reload().catch(() =>
        setError(
          "Your outfit was saved, but the list could not refresh. Reload the page to see it; do not save it again.",
        ),
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function confirmDelete() {
    if (!deletion) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const item = items.find((i) => i.id === deletion.id);
      const result = await supabase!
        .from(deletion.type === "item" ? "clothing_items" : "outfits")
        .delete()
        .eq("id", deletion.id);
      if (result.error) throw result.error;
      if (deletion.type === "item" && item) {
        setSelection((prev) =>
          Object.fromEntries(
            Object.entries(prev).filter(([, id]) => id !== item.id),
          ),
        );
        const removed = await supabase!.storage
          .from("clothing")
          .remove([item.image_path]);
        if (removed.error)
          setError(
            "The item was deleted, but its stored image could not be removed. Contact your project administrator to clean it up.",
          );
      }
      setDeletion(null);
      await reload();
      setNotice("Deleted successfully.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const nav = [
    { id: "wardrobe" as View, label: "My wardrobe", Icon: Grid2X2 },
    { id: "studio" as View, label: "Outfit studio", Icon: Layers },
    { id: "add" as View, label: "Add clothing", Icon: Plus },
  ];
  const visible = items
    .filter(
      (i) =>
        (filter === "all" || i.category === filter) &&
        `${i.name} ${i.color || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "oldest"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at),
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="The Edit home">
          <Shirt className="brand-mark" /> THE EDIT
        </a>
        <p className="eyebrow">A WARDROBE, WELL LOVED.</p>
        <nav aria-label="Main navigation">
          {nav.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-link ${view === id ? "active" : ""}`}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <p className="account-email">{user.email}</p>
          <button
            className="nav-link"
            onClick={async () => {
              const { error } = await supabase!.auth.signOut();
              if (error) setError(error.message);
            }}
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">YOUR STYLE, YOUR SPACE</span>
            <h1>
              {view === "wardrobe"
                ? "My wardrobe"
                : view === "studio"
                  ? "The outfit studio"
                  : editing
                    ? "A little refresh"
                    : "Something to add"}
            </h1>
            <p className="subtitle">
              {view === "wardrobe"
                ? `${items.length} pieces. Endless possibilities.`
                : view === "studio"
                  ? "Bring your favorites together. Make it yours."
                  : "Give a favorite piece its own place."}
            </p>
          </div>
          <div className="header-actions">
            {view === "wardrobe" && (
              <button
                className="button primary"
                onClick={() => navigate("add")}
              >
                <Plus size={18} /> Add a piece
              </button>
            )}
            <button
              className="icon-button mobile-signout"
              aria-label="Sign out"
              onClick={async () => {
                const { error } = await supabase!.auth.signOut();
                if (error) setError(error.message);
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div className="notice success" role="status">
            {notice}
          </div>
        )}
        {loading ? (
          <div className="loading">Gathering your favorites…</div>
        ) : view === "wardrobe" ? (
          <>
            <div className="wardrobe-toolbar">
              <div className="filters" aria-label="Filter by category">
                {(["all", ...categories] as const).map((category) => (
                  <button
                    key={category}
                    className={`filter ${filter === category ? "active" : ""}`}
                    aria-pressed={filter === category}
                    onClick={() => setFilter(category)}
                  >
                    {category === "all" ? "All pieces" : labels[category]}
                  </button>
                ))}
              </div>
              <div className="form-row">
                <input
                  className="search-input"
                  aria-label="Search clothing"
                  placeholder="Find a favorite…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="sort-select"
                  aria-label="Sort clothing"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>
            {visible.length ? (
              <div className="clothing-grid">
                {visible.map((item) => (
                  <article className="clothing-card" key={item.id}>
                    <button
                      className="photo-frame"
                      onClick={() => {
                        setEditing(item);
                        setView("add");
                      }}
                      aria-label={`Edit ${item.name}`}
                    >
                      <img src={item.url} alt={item.name} loading="lazy" />
                    </button>
                    <div className="card-body">
                      <h3 className="card-title">{item.name}</h3>
                      <p className="card-meta">
                        {labels[item.category]}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                      <div className="card-actions">
                        <button
                          className="inline-link"
                          onClick={() => {
                            setEditing(item);
                            setView("add");
                          }}
                        >
                          Edit piece
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${item.name}`}
                          onClick={() =>
                            setDeletion({
                              type: "item",
                              id: item.id,
                              name: item.name,
                            })
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Shirt size={48} strokeWidth={1} />
                <h2>
                  {items.length
                    ? "Nothing here just yet."
                    : "Meet your new wardrobe."}
                </h2>
                <p>
                  {items.length
                    ? "Try a different filter or search."
                    : "Start with a favorite shirt, your go-to jeans, or the shoes you wear everywhere."}
                </p>
                <button
                  className="button primary"
                  onClick={() => navigate("add")}
                >
                  <Plus size={18} /> Add your first pieces
                </button>
              </div>
            )}
          </>
        ) : view === "add" ? (
          <Editor
            key={editing?.id || "new"}
            user={user}
            item={editing}
            onCancel={() => navigate("wardrobe")}
            onSaved={async (warning) => {
              setEditing(null);
              setView("wardrobe");
              setNotice("Your piece was saved.");
              if (warning) setError(warning);
              await reload().catch(() =>
                setError(
                  "Your piece was saved, but the list could not refresh. Reload the page to see it; do not upload it again.",
                ),
              );
            }}
          />
        ) : (
          <>
            <div className="studio-layout">
              <section>
                <div className="outfit-board">
                  {categories.map((category) => {
                    const item = items.find(
                      (i) => i.id === selection[category],
                    );
                    return (
                      <div
                        className={`outfit-slot ${item ? "filled" : ""}`}
                        key={category}
                      >
                        <button
                          className="slot-choice"
                          aria-pressed={slot === category}
                          onClick={() => setSlot(category)}
                        >
                          <span className="slot-label">{labels[category]}</span>
                          {item ? (
                            <img
                              className="slot-image"
                              src={item.url}
                              alt={item.name}
                            />
                          ) : (
                            <>
                              <Plus size={26} />
                              <span>
                                Choose{" "}
                                {category === "shoes"
                                  ? "shoes"
                                  : `a ${category}`}
                              </span>
                            </>
                          )}
                        </button>
                        {item && (
                          <button
                            className="slot-remove icon-button"
                            aria-label={`Remove ${item.name} from outfit`}
                            onClick={() =>
                              setSelection((prev) => ({
                                ...prev,
                                [category]: undefined,
                              }))
                            }
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <form className="form-stack" onSubmit={saveOutfit}>
                  <label className="field">
                    Give this look a name
                    <input
                      maxLength={100}
                      placeholder="Sunday slow mornings"
                      value={outfitName}
                      onChange={(e) => setOutfitName(e.target.value)}
                    />
                  </label>
                  <div className="form-row">
                    <button
                      className="button primary"
                      disabled={busy || !Object.values(selection).some(Boolean)}
                    >
                      {busy ? "Saving…" : "Save outfit"}
                      <Check size={18} />
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      onClick={() => {
                        setSelection({});
                        setOutfitName("");
                      }}
                    >
                      Start fresh
                    </button>
                  </div>
                </form>
              </section>
              <section className="studio-panel">
                <span className="eyebrow">THE FINISHING TOUCHES</span>
                <h2>Pick your {labels[slot].toLowerCase()}</h2>
                <div className="filters">
                  {categories.map((category) => (
                    <button
                      className={`filter ${slot === category ? "active" : ""}`}
                      aria-pressed={slot === category}
                      key={category}
                      onClick={() => setSlot(category)}
                    >
                      {labels[category]}
                    </button>
                  ))}
                </div>
                <div className="picker-grid">
                  {items
                    .filter((i) => i.category === slot)
                    .map((item) => (
                      <button
                        className={`picker-item ${selection[slot] === item.id ? "selected" : ""}`}
                        key={item.id}
                        aria-pressed={selection[slot] === item.id}
                        onClick={() =>
                          setSelection((prev) => ({ ...prev, [slot]: item.id }))
                        }
                      >
                        <img src={item.url} alt={item.name} loading="lazy" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                </div>
                {!items.some((i) => i.category === slot) && (
                  <div className="empty-state">
                    <p>No {labels[slot].toLowerCase()} yet.</p>
                    <button
                      className="inline-link"
                      onClick={() => navigate("add")}
                    >
                      Add a piece to get started
                    </button>
                  </div>
                )}
              </section>
            </div>
            <section className="saved-section">
              <span className="eyebrow">READY FOR ANOTHER DAY</span>
              <h2>
                Saved outfits <span className="pill">{outfits.length}</span>
              </h2>
              {!outfits.length ? (
                <p className="subtitle">
                  Your favorite combinations will live here.
                </p>
              ) : (
                <div className="saved-grid">
                  {outfits.map((outfit) => (
                    <article className="saved-card" key={outfit.id}>
                      <button
                        className="saved-preview"
                        aria-label={`Open ${outfit.name}`}
                        onClick={() => {
                          setSelection(
                            Object.fromEntries(
                              outfit.outfit_items.map((i) => [
                                i.slot,
                                i.clothing_item_id,
                              ]),
                            ),
                          );
                          setOutfitName(`${outfit.name} — copy`.slice(0, 100));
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        {categories.map((category) => {
                          const link = outfit.outfit_items.find(
                            (i) => i.slot === category,
                          );
                          const item = items.find(
                            (i) => i.id === link?.clothing_item_id,
                          );
                          return (
                            <div key={category}>
                              {item ? (
                                <img
                                  src={item.url}
                                  alt={item.name}
                                  loading="lazy"
                                />
                              ) : (
                                <span>{labels[category]}</span>
                              )}
                            </div>
                          );
                        })}
                      </button>
                      <div className="card-body">
                        <h3 className="saved-name">{outfit.name}</h3>
                        <div className="card-actions">
                          <span className="card-meta">
                            {outfit.outfit_items.length} pieces
                          </span>
                          <button
                            className="icon-button"
                            aria-label={`Delete outfit ${outfit.name}`}
                            onClick={() =>
                              setDeletion({
                                type: "outfit",
                                id: outfit.id,
                                name: outfit.name,
                              })
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-link ${view === id ? "active" : ""}`}
            aria-current={view === id ? "page" : undefined}
            onClick={() => navigate(id)}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {deletion && (
        <DeleteDialog
          name={deletion.name}
          isItem={deletion.type === "item"}
          busy={busy}
          onCancel={() => setDeletion(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function Editor({
  user,
  item,
  onSaved,
  onCancel,
}: {
  user: User;
  item: Clothing | null;
  onSaved: (warning?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState<Category>(item?.category || "top");
  const [color, setColor] = useState(item?.color || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(item?.url || "");
  const [photoType, setPhotoType] = useState("worn");
  const [piece, setPiece] = useState(piecePrompts[item?.category || "top"]);
  const [cutout, setCutout] = useState<Blob | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("");
  useEffect(() => {
    const source = showOriginal ? file : cutout || file;
    if (!source) return;
    const url = URL.createObjectURL(source);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, cutout, showOriginal]);
  function resetCutouts() {
    setCutout(null);
    setShowOriginal(false);
  }
  async function extract() {
    if (!file || busy) return;
    setBusy(true);
    setError("");
    resetCutouts();
    try {
      setPhase("Preparing photo…");
      const photo = await preparePhoto(file);
      const { data, error } = await supabase!.auth.getSession();
      if (error || !data.session)
        throw new Error("Please sign in again before extracting clothing.");
      setPhase("Finding your clothing…");
      const response = await fetch(
        `/api/extract-clothing?mode=${photoType}&piece=${piece}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "image/webp",
          },
          body: photo,
          signal: AbortSignal.timeout(195_000),
        },
      );
      const result = await response.json().catch(() => ({
        error: "The clothing service is unavailable. Please try again later.",
      }));
      if (!response.ok)
        throw new Error(
          result.error || "Could not extract this piece. Please try again.",
        );
      setPhase("Making your cutout…");
      setCutout(await createCutout(photo, result.masks[0]));
    } catch (error) {
      setError(
        error instanceof Error && error.name === "TimeoutError"
          ? "Extraction took too long. Please try again later."
          : message(error),
      );
    } finally {
      setBusy(false);
      setPhase("");
    }
  }
  function choose(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choose a JPEG, PNG, or WebP image smaller than 10 MB.");
      return;
    }
    setFile(file);
    resetCutouts();
    setError("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!file && !item) {
      setError("Choose a photo first.");
      return;
    }
    if (file && !cutout) {
      setError("Extract and preview your clothing before saving.");
      return;
    }
    setBusy(true);
    setError("");
    let uploaded: string | null = null;
    let persisted = false;
    try {
      let path = item?.image_path;
      if (file) {
        const photo = cutout!;
        path = `${user.id}/${crypto.randomUUID()}.webp`;
        setPhase("Uploading photo…");
        const { error } = await supabase!.storage
          .from("clothing")
          .upload(path, photo, { contentType: "image/webp", upsert: false });
        if (error) throw error;
        uploaded = path;
      }
      setPhase("Saving piece…");
      const values = {
        name: name.trim() || `My ${category}`,
        category,
        color: color.trim() || null,
        image_path: path!,
        user_id: user.id,
      };
      // Category changes cascade to saved outfit slots through the database FK.
      // A conflicting occupied slot is rejected, leaving the original item intact.
      const result = item
        ? await supabase!
            .from("clothing_items")
            .update(values)
            .eq("id", item.id)
            .select("id")
            .single()
        : await supabase!
            .from("clothing_items")
            .insert(values)
            .select("id")
            .single();
      if (result.error) throw result.error;
      persisted = true;
      let warning: string | undefined;
      if (uploaded && item) {
        const cleanup = await supabase!.storage
          .from("clothing")
          .remove([item.image_path]);
        if (cleanup.error)
          warning =
            "Photo replaced, but the old stored file could not be removed. Ask your project administrator to clean it up.";
      }
      await onSaved(warning);
    } catch (e) {
      if (uploaded && !persisted)
        await supabase!.storage.from("clothing").remove([uploaded]);
      setError(
        persisted
          ? "Your piece was saved, but the wardrobe could not refresh. Return to your wardrobe or reload the page."
          : message(e),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="editor-layout" onSubmit={save}>
      <div className="editor-preview">
        <label
          className="upload-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!busy) choose(e.dataTransfer.files[0]);
          }}
        >
          {preview ? (
            <img
              className={`upload-preview${cutout && !showOriginal ? " cutout-preview" : ""}`}
              src={preview}
              alt={
                cutout && !showOriginal
                  ? "Extracted clothing on a transparent background"
                  : "Original clothing photo"
              }
            />
          ) : (
            <>
              <Upload size={40} strokeWidth={1} />
              <h2>A new favorite?</h2>
              <p>
                Tap to choose a photo
                <br />
                or drop one here.
              </p>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={
              item ? "Replace clothing photo" : "Choose clothing photo"
            }
            disabled={busy}
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <span className="button secondary">
            {preview ? "Choose another photo" : "Choose photo"}
          </span>
        </label>
        <p className="subtitle">
          JPEG, PNG or WebP · Up to 10 MB
          <br />
          Works with clothing worn by someone or photographed on its own.
        </p>
        {file && (
          <div className="cutout-controls form-stack">
            <label className="field">
              Photo type
              <select
                value={photoType}
                disabled={busy}
                onChange={(e) => {
                  setPhotoType(e.target.value);
                  resetCutouts();
                }}
              >
                <option value="worn">Someone wearing the clothing</option>
                <option value="standalone">Clothing on its own</option>
              </select>
            </label>
            {photoType === "worn" && (
              <label className="field">
                Piece to extract
                <select
                  value={piece}
                  disabled={busy}
                  onChange={(e) => {
                    setPiece(e.target.value);
                    resetCutouts();
                  }}
                >
                  {(category === "top" || category === "jacket") && (
                    <option value="upper">Top / outer layer</option>
                  )}
                  {category === "bottom" && (
                    <>
                      <option value="pants">Trousers / shorts</option>
                      <option value="skirt">Skirt</option>
                    </>
                  )}
                  {category === "shoes" && (
                    <option value="shoes">Shoes (both)</option>
                  )}
                </select>
              </label>
            )}
            <p className="subtitle">
              {photoType === "worn"
                ? "Use a photo of one person. Tops and jackets may be extracted together when layered."
                : "Use a photo of one clothing item or a pair of shoes, without a person."}{" "}
              Extraction runs on the computer hosting this app, with no AI
              credits. Only the cutout is saved to your wardrobe.
            </p>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={extract}
            >
              {busy ? phase : cutout ? "Extract again" : "Extract clothing"}
            </button>
            {cutout && (
              <>
                <p className="subtitle" role="status">
                  Check the edges before saving. Parts hidden by arms, hair, or
                  other clothing cannot be recovered.
                </p>

                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={() => setShowOriginal(!showOriginal)}
                >
                  {showOriginal ? "Show cutout" : "Compare with original"}
                </button>
              </>
            )}
            {busy && (
              <p className="subtitle" role="status" aria-live="polite">
                {phase}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="editor-form form-stack">
        <span className="eyebrow">THE DETAILS</span>
        <h2>
          {item ? "Same favorite. Fresh details." : "Every piece has a place."}
        </h2>
        <label className="field">
          Name <span className="subtitle">(optional)</span>
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="The perfect linen shirt"
            disabled={busy}
          />
        </label>
        <label className="field">
          Category
          <select
            value={category}
            onChange={(e) => {
              const next = e.target.value as Category;
              setCategory(next);
              setPiece(piecePrompts[next]);
              resetCutouts();
            }}
            disabled={busy}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {labels[category]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Color <span className="subtitle">(optional)</span>
          <input
            value={color}
            maxLength={50}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Cream, olive, midnight blue…"
            disabled={busy}
          />
        </label>
        {item && (
          <p className="subtitle">
            Replacing the photo updates it in your saved outfits too. A category
            change may be blocked if it conflicts with a saved outfit.
          </p>
        )}
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <div className="form-row">
          <button
            className="button primary"
            disabled={busy || (!!file && !cutout)}
          >
            <Check size={18} />
            {busy ? phase : item ? "Save changes" : "Add to wardrobe"}
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

function DeleteDialog({
  name,
  isItem,
  busy,
  onCancel,
  onConfirm,
}: {
  name: string;
  isItem: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="delete-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <div className="modal-header">
        <h2 id="delete-title">Remove “{name}”?</h2>
      </div>
      <p>
        {isItem
          ? "This piece and its photo will be deleted. It will also be removed from your saved outfits."
          : "This saved outfit will be deleted. Your clothing will stay in your wardrobe."}{" "}
        This cannot be undone.
      </p>
      <div className="modal-actions">
        <button
          className="button secondary"
          autoFocus
          disabled={busy}
          onClick={onCancel}
        >
          Keep it
        </button>
        <button className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? "Deleting…" : "Yes, delete"}
        </button>
      </div>
    </dialog>
  );
}
