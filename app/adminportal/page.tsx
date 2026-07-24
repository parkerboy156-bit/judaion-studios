"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface AssetEntry {
  id: string;
  title: string;
  url: string; // full-quality master (the only file the designer creates)
  thumb?: string; // auto-generated ≤1600px WebP — browsing surfaces use this
  // Upload metadata — shown in the focus view's per-asset metadata rows.
  size?: number; // bytes (of the MASTER)
  mime?: string;
  added?: string; // ISO date
  width?: number; // master pixel dimensions (measured at upload)
  height?: number;
}

interface FolderEntry {
  id: string;
  title: string;
  description?: string; // per-folder copy (shown in the focus view left pane)
  assets: AssetEntry[];
}

interface ArchiveItem {
  id: number;
  title: string;
  subtitle?: string;
  author?: string;
  category: string;
  resource_type: string;
  content: string;
  file_url: string[];
  folders?: FolderEntry[];
  instagram_url?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at?: string;
}

interface MetaOption {
  id: number;
  name: string;
}

// Form-side draft of an asset — `file` is a pending upload, `url` is an
// already-uploaded/existing asset. Exactly one is set at submit time.
interface AssetDraft {
  id: string;
  title: string;
  url?: string;
  file?: File;
  // Metadata passthrough for already-uploaded assets (set on upload).
  thumb?: string;
  size?: number;
  mime?: string;
  added?: string;
  width?: number;
  height?: number;
}

interface FolderDraft {
  id: string;
  title: string;
  description: string;
  assets: AssetDraft[];
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const blankAsset = (): AssetDraft => ({ id: uid(), title: "" });
const blankFolder = (): FolderDraft => ({
  id: uid(),
  title: "",
  description: "",
  assets: [blankAsset()],
});

const VIDEO_EXTS = ["mp4", "webm", "ogg"];
const extOf = (s: string) => s.split(".").pop()?.toLowerCase() || "";

// ── Auto-thumbnail: downscale an image to ≤1600px long edge and encode WebP
// in the browser (canvas). The master is untouched — the designer never makes
// a separate thumbnail version. Returns the master's pixel dims either way;
// blob is null for non-images or when encoding fails (archive falls back to
// the master gracefully).
const THUMB_MAX = 1600;
const THUMB_QUALITY = 0.85;
async function makeThumb(
  file: File,
): Promise<{ blob: Blob | null; width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bmp = await createImageBitmap(file);
    const { width, height } = bmp;
    const scale = Math.min(1, THUMB_MAX / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: null, width, height };
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/webp", THUMB_QUALITY),
    );
    return { blob, width, height };
  } catch {
    return null;
  }
}

// Render a PDF's first page to a WebP thumbnail — the same browsing-surface role
// makeThumb plays for images, so the archive shows the first page as a cover
// instead of a generic document card. pdfjs is imported lazily (no bundle cost
// unless a PDF is actually uploaded). Returns the rendered raster dims.
async function makePdfThumb(
  file: File,
): Promise<{ blob: Blob | null; width: number; height: number } | null> {
  try {
    const mod: any = await import("pdfjs-dist");
    const pdfjs = mod?.getDocument ? mod : mod?.default ?? mod;
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const page = await doc.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = THUMB_MAX / Math.max(base.width, base.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d");
    const dims = { width: canvas.width, height: canvas.height };
    if (!ctx) {
      doc.destroy?.();
      return { blob: null, ...dims };
    }
    // White paper background — PDF pages can be transparent.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/webp", THUMB_QUALITY),
    );
    doc.destroy?.();
    return { blob, ...dims };
  } catch {
    return null;
  }
}

// Thumbnail for a draft asset — handles both a pending File (object URL,
// revoked on unmount) and an already-uploaded URL.
function AssetThumb({ asset }: { asset: AssetDraft }) {
  const [objUrl, setObjUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (asset.file) {
      const u = URL.createObjectURL(asset.file);
      setObjUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setObjUrl(null);
  }, [asset.file]);

  const src = objUrl || asset.url || "";
  const name = asset.file?.name || asset.url || "";
  const ext = extOf(name);
  const isVideo = VIDEO_EXTS.includes(ext);
  const isPdf = ext === "pdf";

  if (isPdf)
    return (
      <div className="w-full h-full flex items-center justify-center bg-white">
        <span className="text-red-700 font-black text-[10px]">PDF</span>
      </div>
    );
  if (isVideo)
    return (
      <video src={src} muted className="w-full h-full object-cover" />
    );
  if (src)
    return <img src={src} className="w-full h-full object-cover" alt="" />;
  return (
    <div className="w-full h-full flex items-center justify-center bg-black/40">
      <span className="text-[18px] text-white/30 font-black">+</span>
    </div>
  );
}

export default function AdminPortal() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<MetaOption[]>([]);
  const [resourceTypes, setResourceTypes] = useState<MetaOption[]>([]);
  const [archive, setArchive] = useState<ArchiveItem[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({ name: "", type: "category" });
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    resource_type: "",
    content: "",
    instagram_url: "",
    linkedin_url: "",
    website_url: "",
  });
  const [folders, setFolders] = useState<FolderDraft[]>([blankFolder()]);

  // ── Folder/asset draft mutators ──
  const addFolder = () => setFolders((f) => [...f, blankFolder()]);
  const removeFolder = (fid: string) =>
    setFolders((f) => (f.length > 1 ? f.filter((x) => x.id !== fid) : f));
  const setFolderTitle = (fid: string, title: string) =>
    setFolders((f) => f.map((x) => (x.id === fid ? { ...x, title } : x)));
  const setFolderDescription = (fid: string, description: string) =>
    setFolders((f) =>
      f.map((x) => (x.id === fid ? { ...x, description } : x)),
    );
  const addAsset = (fid: string) =>
    setFolders((f) =>
      f.map((x) =>
        x.id === fid ? { ...x, assets: [...x.assets, blankAsset()] } : x,
      ),
    );
  const removeAsset = (fid: string, aid: string) =>
    setFolders((f) =>
      f.map((x) =>
        x.id === fid
          ? {
              ...x,
              assets:
                x.assets.length > 1
                  ? x.assets.filter((a) => a.id !== aid)
                  : x.assets,
            }
          : x,
      ),
    );
  const setAssetFile = (fid: string, aid: string, file: File) =>
    setFolders((f) =>
      f.map((x) =>
        x.id === fid
          ? {
              ...x,
              assets: x.assets.map((a) =>
                a.id === aid ? { ...a, file, url: undefined } : a,
              ),
            }
          : x,
      ),
    );
  const setAssetTitle = (fid: string, aid: string, title: string) =>
    setFolders((f) =>
      f.map((x) =>
        x.id === fid
          ? {
              ...x,
              assets: x.assets.map((a) =>
                a.id === aid ? { ...a, title } : a,
              ),
            }
          : x,
      ),
    );
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: cat } = await supabase
      .from("catalogue_categories")
      .select("*")
      .order("name");
    const { data: res } = await supabase
      .from("resource_types")
      .select("*")
      .order("name");
    const { data: arc } = await supabase
      .from("archive")
      .select("*")
      .order("created_at", { ascending: false });

    setCategories(cat || []);
    setResourceTypes(res || []);
    setArchive(arc || []);
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
  };

  const handleAddOption = async () => {
    if (!newOption.name) return;
    const table =
      newOption.type === "category" ? "catalogue_categories" : "resource_types";
    await supabase.from(table).insert([{ name: newOption.name }]);
    setNewOption({ ...newOption, name: "" });
    fetchData();
  };

  const handleDeleteOption = async (id: number, type: "category" | "type") => {
    if (!confirm("CONFIRM_META_DELETION?")) return;
    const table =
      type === "category" ? "catalogue_categories" : "resource_types";
    await supabase.from(table).delete().eq("id", id);
    fetchData();
  };

  const resetForm = () => {
    setFormData({ title: "", author: "", category: "", resource_type: "", content: "", instagram_url: "", linkedin_url: "", website_url: "" });
    setFolders([blankFolder()]);
    setEditingId(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: every folder needs a title and at least one resolved asset
    // (a pending file or an existing url).
    const cleanFolders = folders
      .map((f) => ({
        ...f,
        assets: f.assets.filter((a) => a.file || a.url),
      }))
      .filter((f) => f.assets.length > 0);

    if (cleanFolders.length === 0) {
      alert("Add at least one folder with at least one asset.");
      return;
    }
    if (cleanFolders.some((f) => !f.title.trim())) {
      alert("Every folder needs a title.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(5);

      const categoryName = formData.category.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const projectName = formData.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

      const uploadFile = async (file: File | Blob, path: string) => {
        // Step 1: Ask your API for a secure direct-upload link
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path, contentType: file.type }),
        });

        const { signedUrl, publicUrl, error } = await res.json();
        if (error) throw new Error(error);

        // Step 2: Upload the file DIRECTLY to Oracle Cloud using the signed link
        // This bypasses Vercel's 4.5MB limit
        const uploadRes = await fetch(signedUrl, {
          method: "PUT", // Direct S3 uploads use PUT
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!uploadRes.ok) throw new Error("Direct upload to Oracle failed.");
        return publicUrl;
      };

      // Count pending uploads up front so the progress bar can step per file.
      const pendingTotal = cleanFolders.reduce(
        (n, f) => n + f.assets.filter((a) => a.file).length,
        0,
      );
      let done = 0;

      // Resolve every asset to a final {id, title, url, thumb, size, mime,
      // added, width, height}, uploading the pending files folder-by-folder.
      // Image files also get an auto-generated ≤1600px WebP thumb uploaded
      // beside the master (`*_thumb.webp`) — browsing surfaces serve that,
      // zoom serves the master. Already-uploaded assets pass through with
      // their stored metadata.
      const resolvedFolders: FolderEntry[] = [];
      for (const f of cleanFolders) {
        const folderName = f.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
        const assets: AssetEntry[] = [];
        for (const a of f.assets) {
          let url = a.url || "";
          let { thumb, size, mime, added, width, height } = a;
          if (a.file) {
            size = a.file.size;
            mime = a.file.type || undefined;
            added = new Date().toISOString();
            const ext = a.file.name.split(".").pop();
            const isPdf = (ext || "").toLowerCase() === "pdf";
            const base = `${categoryName}/${projectName}/${folderName}/asset_${assets.length}_${Date.now()}`;
            url = await uploadFile(a.file, `${base}.${ext}`);
            // Thumbnail: image → downscaled WebP; PDF → first page rendered to
            // WebP. Images keep the thumb only when it saves bytes; a PDF always
            // keeps it (there's no other way to show a PDF as an image cover).
            const t = isPdf ? await makePdfThumb(a.file) : await makeThumb(a.file);
            if (t) {
              if (t.width && t.height) {
                width = t.width;
                height = t.height;
              }
              if (t.blob && (isPdf || t.blob.size < a.file.size)) {
                thumb = await uploadFile(t.blob, `${base}_thumb.webp`);
              }
            }
            done += 1;
            setUploadProgress(
              5 + Math.round((done / Math.max(pendingTotal, 1)) * 85),
            );
          }
          assets.push({
            id: a.id,
            title: a.title || "",
            url,
            ...(thumb ? { thumb } : {}),
            ...(size ? { size } : {}),
            ...(mime ? { mime } : {}),
            ...(added ? { added } : {}),
            ...(width && height ? { width, height } : {}),
          });
        }
        resolvedFolders.push({
          id: f.id,
          title: f.title.trim(),
          ...(f.description?.trim() ? { description: f.description.trim() } : {}),
          assets,
        });
      }

      // Keep file_url as the flat union of all asset urls — preserves the
      // masonry cover (firstImage) + legacy reads with no front-end change yet.
      const flatUrls = resolvedFolders.flatMap((f) => f.assets.map((a) => a.url));

      const payload = {
        ...formData,
        folders: resolvedFolders,
        file_url: flatUrls,
      };

      const { error: dbError } = editingId
        ? await supabase.from("archive").update(payload).eq("id", editingId)
        : await supabase.from("archive").insert([payload]);

      if (dbError) throw dbError;

      setUploadProgress(100);
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        resetForm();
        fetchData();
      }, 1000);
    } catch (err: any) {
      alert(err.message);
      setUploading(false);
    }
  };

  const groupedArchive = categories.reduce(
    (acc: any, cat) => {
      acc[cat.name] = archive.filter((item) => item.category === cat.name);
      return acc;
    },
    { Uncategorized: archive.filter((item) => !item.category) },
  );

  const renderAssetPreview = (url: string) => {
    const extension = url.split(".").pop()?.toLowerCase();
    const isVideo = ["mp4", "webm", "ogg"].includes(extension || "");
    const isPdf = extension === "pdf";

    if (isVideo) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#050505]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF5A00"
            strokeWidth="1.5"
          >
            <path
              d="M12 5V9M12 5C9.23858 5 7 7.23858 7 10V14C7 16.7614 9.23858 19 12 19C14.7614 19 17 16.7614 17 14V10C17 7.23858 14.7614 5 12 5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    }
    if (isPdf) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-white">
          <span className="text-red-700 font-black text-[10px]">PDF</span>
        </div>
      );
    }
    return (
      <img
        src={url}
        className="w-full h-full object-cover"
        alt="Current"
        loading="lazy"
      />
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col text-white antialiased"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.90), rgba(8,8,8,0.7))",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none opacity-90"
        style={{ backgroundImage: "url('/global-bg.avif')" }}
      />
      <div className="fixed inset-0 z-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        <header
          className="w-full px-6 lg:px-16 pt-16 pb-10 border-b border-white/10"
          style={{ maxWidth: "1700px", margin: "0 auto", width: "100%" }}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="font-brand-secondary-thin text-[11px] tracking-[0.25em] text-white/40 uppercase mb-4">
                JUDAION Studios | Admin Portal
              </div>
              <div
                className="font-brand-other text-white leading-[0.9] tracking-[0.02em] mb-3"
                style={{ fontSize: "clamp(42px, 6vw, 72px)" }}
              >
                ADMIN
                <span className="block text-white/40 tracking-[0.08em]">
                  CONTROL
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="font-brand-secondary-thin text-[11px] tracking-[0.2em] uppercase border border-white/20 px-6 py-3 text-white/60 hover:text-white hover:border-white/50 transition-all cursor-pointer mt-2"
            >
              Log Out
            </button>
          </div>
        </header>

        <main
          className="px-6 lg:px-16 py-16 flex flex-col lg:flex-row gap-10"
          style={{ maxWidth: "1700px", margin: "0 auto", width: "100%" }}
        >
          <section className="lg:w-2/5 space-y-8">
            <div className="border border-white/10 bg-black/30 backdrop-blur-sm p-8 space-y-8">
              <div>
                <div className="font-brand-secondary-thin text-[10px] tracking-[0.3em] text-orange-600 uppercase mb-2">
                   Asset Manager
                </div>
                <div className="font-brand-other text-white text-[28px] leading-none tracking-wide uppercase">
                  {editingId ? "Edit Project" : "New Project"}
                </div>
                <div className="h-[1px] w-full bg-white/10 mt-6" />
              </div>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    Entry Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 font-brand-secondary-thin text-[12px] uppercase focus:border-orange-600 transition-colors outline-none cursor-text"
                    placeholder="TITLE"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    Author <span className="text-white/20">(optional — defaults to JUDAION (Pty) Ltd)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) =>
                      setFormData({ ...formData, author: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 font-brand-secondary-thin text-[12px] uppercase focus:border-orange-600 transition-colors outline-none cursor-text"
                    placeholder="e.g. JUDAION (Pty) Ltd"
                  />
                </div>


                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 text-[11px] font-black uppercase outline-none focus:border-orange-600 cursor-pointer"
                    required
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── FOLDER BUILDER — each folder holds assets with a title;
                    size/type/date metadata is captured automatically on
                    upload (focus-view folder desktop) ── */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                      Folders &amp; Assets
                    </label>
                    <span className="font-brand-secondary-thin text-[8px] uppercase text-white/20 tracking-[0.2em]">
                      {folders.length} Folder{folders.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {folders.map((folder, fIdx) => (
                    <div
                      key={folder.id}
                      className="border border-white/10 bg-black/20 p-4 space-y-4"
                    >
                      {/* Folder header — title + remove */}
                      <div className="flex items-center gap-3">
                        <span className="font-brand-other text-orange-600 text-[12px] tracking-[0.2em] uppercase shrink-0">
                          {String(fIdx + 1).padStart(2, "0")}
                        </span>
                        <input
                          type="text"
                          value={folder.title}
                          onChange={(e) => setFolderTitle(folder.id, e.target.value)}
                          placeholder="FOLDER TITLE (e.g. OLD / NEW)"
                          className="flex-1 bg-black/40 border border-white/10 p-3 font-brand-secondary-thin text-[11px] uppercase focus:border-orange-600 transition-colors outline-none cursor-text"
                        />
                        {folders.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFolder(folder.id)}
                            className="font-brand-secondary-thin text-red-500/60 text-[9px] uppercase tracking-widest hover:text-red-400 cursor-pointer shrink-0 px-1"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Per-folder description — shown in the focus-view left
                          pane; blank folders fall back to the project
                          description below. */}
                      <textarea
                        value={folder.description}
                        onChange={(e) =>
                          setFolderDescription(folder.id, e.target.value)
                        }
                        placeholder="FOLDER DESCRIPTION (optional — falls back to the project description if blank)"
                        className="w-full bg-black/40 border border-white/10 p-3 h-44 font-brand-secondary-thin text-[11px] focus:border-orange-600 transition-colors outline-none cursor-text resize-y"
                      />

                      {/* Assets in this folder */}
                      <div className="space-y-3">
                        {folder.assets.map((asset) => (
                          <div key={asset.id} className="flex gap-3">
                            {/* Thumb + file picker */}
                            <label className="group relative w-16 h-16 shrink-0 cursor-pointer border border-white/10 bg-black/30 hover:border-orange-600 overflow-hidden transition-all">
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setAssetFile(folder.id, asset.id, e.target.files[0]);
                                  }
                                  e.target.value = "";
                                }}
                              />
                              <AssetThumb asset={asset} />
                            </label>

                            {/* Per-asset title (metadata — size/type/date —
                                is captured automatically on upload) */}
                            <div className="flex-1 flex flex-col justify-center gap-2">
                              <input
                                type="text"
                                value={asset.title}
                                onChange={(e) =>
                                  setAssetTitle(folder.id, asset.id, e.target.value)
                                }
                                placeholder="ASSET TITLE (heading shown in the folder window)"
                                className="w-full bg-black/40 border border-white/10 p-2.5 text-[11px] uppercase font-brand-secondary-thin focus:border-orange-600 outline-none cursor-text"
                              />
                            </div>

                            {folder.assets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAsset(folder.id, asset.id)}
                                className="font-brand-secondary-thin text-red-500/60 text-[9px] uppercase tracking-widest hover:text-red-400 cursor-pointer shrink-0 self-center px-1"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addAsset(folder.id)}
                          className="w-full border border-dashed border-white/15 text-white/40 font-brand-secondary-thin text-[9px] uppercase tracking-[0.25em] py-2.5 hover:border-orange-600/60 hover:text-orange-500 transition-all cursor-pointer"
                        >
                          + Add Asset
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addFolder}
                    className="w-full border border-orange-600/40 bg-orange-600/5 text-orange-500 font-brand-secondary-thin text-[10px] uppercase tracking-[0.25em] py-3 hover:bg-orange-600/10 hover:border-white hover:text-white transition-all cursor-pointer"
                  >
                    + Add Folder
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    Project Description
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 h-24 text-[12px] font-medium font-brand-secondary-thin focus:border-orange-600 outline-none cursor-text"
                  />
                </div>

                <div className="h-[1px] w-full bg-white/10" />

                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    Instagram Post URL
                  </label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram_url: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 font-brand-secondary-thin text-[12px] focus:border-orange-600 transition-colors outline-none cursor-text"
                    placeholder="https://instagram.com/p/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    LinkedIn Post URL
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedin_url: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 font-brand-secondary-thin text-[12px] focus:border-orange-600 transition-colors outline-none cursor-text"
                    placeholder="https://linkedin.com/posts/..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-brand-secondary-thin text-[9px] uppercase text-white/30 tracking-[0.3em]">
                    Client Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) =>
                      setFormData({ ...formData, website_url: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 p-4 font-brand-secondary-thin text-[12px] focus:border-orange-600 transition-colors outline-none cursor-text"
                    placeholder="https://clientdomain.com"
                  />
                </div>

                {uploading && (
                  <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-orange-600">
                      <span>UPLOADING...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-[1px] w-full bg-white/10">
                      <div
                        className="h-full bg-orange-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  disabled={uploading}
                  className="w-full border border-white/40 bg-black text-white font-brand-secondary-thin text-[11px] uppercase tracking-[0.3em] py-5 hover:border-white hover:bg-black transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {uploading
                    ? "Processing..."
                    : editingId
                      ? "Update Asset"
                      : "UPLOAD PROJECT"}
                </button>
              </form>
            </div>

            <div className="border border-white/10 bg-black/30 backdrop-blur-sm p-8 space-y-8">
              <div>
                <div className="font-brand-secondary-thin text-[10px] tracking-[0.3em] text-orange-600 uppercase mb-2">
                  Meta Manager
                </div>
                <div className="font-brand-other text-white text-[28px] leading-none tracking-wide uppercase">
                  Tags & Types
                </div>
                <div className="h-[1px] w-full bg-white/10 mt-6" />
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="NEW TAG NAME"
                  value={newOption.name}
                  onChange={(e) =>
                    setNewOption({ ...newOption, name: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 p-4 text-[10px] font-black uppercase outline-none focus:border-orange-600 cursor-text"
                />
                <div className="flex gap-2">
                  <select
                    value={newOption.type}
                    onChange={(e) =>
                      setNewOption({ ...newOption, type: e.target.value })
                    }
                    className="bg-black/40 border border-white/10 p-3 text-[10px] font-black uppercase outline-none cursor-pointer"
                  >
                    <option value="category">Category</option>
                    <option value="type">Asset Type</option>
                  </select>
                  <button
                    onClick={handleAddOption}
                    className="flex-1 border border-orange-600/50 bg-orange-600/10 text-orange-500 font-brand-secondary-thin text-[10px] uppercase tracking-[0.2em] py-3 hover:bg-orange-600/10 hover:border-white hover:text-white transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">
                    Active Categories
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center border border-white/10 bg-black/30 px-3 py-1.5 gap-3"
                      >
                        <span className="font-brand-secondary-thin text-[10px] uppercase tracking-[0.15em] text-white/70">
                          {c.name}
                        </span>
                        <button
                          onClick={() => handleDeleteOption(c.id, "category")}
                          className="font-brand-secondary-thin text-[9px] text-orange-600/60 hover:text-orange-500 cursor-pointer uppercase tracking-widest"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">
                    Active Asset Types
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {resourceTypes.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center border border-white/10 bg-black/30 px-3 py-1.5 gap-3"
                      >
                        <span className="font-brand-secondary-thin text-[10px] uppercase tracking-[0.15em] text-white/70">
                          {r.name}
                        </span>
                        <button
                          onClick={() => handleDeleteOption(r.id, "type")}
                          className="font-brand-secondary-thin text-[9px] text-orange-600/60 hover:text-orange-500 cursor-pointer uppercase tracking-widest"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex-1 space-y-16">
            {Object.entries(groupedArchive).map(
              ([catName, items]: [string, any]) =>
                items.length > 0 && (
                  <div
                    key={catName}
                    className="space-y-8 animate-in fade-in duration-700"
                  >
                    <div className="flex items-center gap-6">
                      <div>
                        <span className="font-brand-secondary-thin text-[10px] tracking-[0.3em] text-orange-600 uppercase">
                          {catName}
                        </span>
                      </div>
                      <div className="h-[1px] flex-1 bg-white/10"></div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                      {items.map((item: ArchiveItem) => (
                        <div
                          key={item.id}
                          className="group border border-white/10 bg-black/30 backdrop-blur-sm p-3 transition-all hover:border-white/20"
                        >
                          <div className="aspect-[4/5] overflow-hidden bg-black mb-3 relative">
                            <div className="w-full h-full opacity-50 group-hover:opacity-100 transition-opacity duration-700">
                              {renderAssetPreview(item.file_url?.[0] || "")}
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setFormData({
                                    title: item.title,
                                    author: item.author || "",
                                    category: item.category,
                                    resource_type: item.resource_type,
                                    content: item.content,
                                    instagram_url: item.instagram_url || "",
                                    linkedin_url: item.linkedin_url || "",
                                    website_url: item.website_url || "",
                                  });
                                  // Load existing folders; fall back to wrapping
                                  // legacy file_url into a single folder.
                                  const existing =
                                    item.folders && item.folders.length > 0
                                      ? item.folders.map((f) => ({
                                          id: f.id || uid(),
                                          title: f.title || "",
                                          description: f.description || "",
                                          assets:
                                            f.assets && f.assets.length > 0
                                              ? f.assets.map((a) => ({
                                                  id: a.id || uid(),
                                                  title: a.title || "",
                                                  url: a.url,
                                                  thumb: a.thumb,
                                                  size: a.size,
                                                  mime: a.mime,
                                                  added: a.added,
                                                  width: a.width,
                                                  height: a.height,
                                                }))
                                              : [blankAsset()],
                                        }))
                                      : [
                                          {
                                            id: uid(),
                                            title: item.title || "ARCHIVE",
                                            description: "",
                                            assets: (item.file_url || []).map(
                                              (url) => ({
                                                id: uid(),
                                                title: "",
                                                url,
                                              }),
                                            ),
                                          },
                                        ];
                                  setFolders(
                                    existing.length > 0 ? existing : [blankFolder()],
                                  );
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                className="border border-white/40 bg-black/80 text-white w-2/3 py-3 font-brand-secondary-thin text-[9px] uppercase tracking-widest hover:border-white hover:bg-black/80 transition-all cursor-pointer"
                              >
                                Edit Asset
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm("PERMANENT_REMOVAL?")) {
                                    await supabase
                                      .from("archive")
                                      .delete()
                                      .eq("id", item.id);
                                    fetchData();
                                  }
                                }}
                                className="font-brand-secondary-thin text-red-500/60 text-[9px] uppercase tracking-widest hover:text-red-400 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <p className="font-brand-secondary-thin text-[11px] uppercase tracking-[0.1em] text-white truncate">
                            {item.title}
                          </p>
                          <p className="font-brand-secondary-thin text-[9px] text-white/30 uppercase tracking-[0.15em]">
                            {item.resource_type}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
