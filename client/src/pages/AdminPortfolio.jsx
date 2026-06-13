import { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Star, StarOff, ExternalLink, X, Upload, Loader } from 'lucide-react';
import api from '../utils/api';
import { gsap } from 'gsap';
const API_URL_IMAGE = import.meta.env.VITE_API_URL_IMAGE;


const CATEGORIES = ['E-commerce', 'Medical', 'Real Estate', 'Restaurants & Food', 'SaaS / Platforms', 'Educational', 'Other'];

// ── Empty form state ────────────────────────────────────────────────────────
const emptyForm = {
  title: '', titleAr: '', category: 'E-commerce',
  description: '', descriptionAr: '',
  liveUrl: '', tags: '', order: 0,
  featured: false, isPublished: true,
};

// ── Image preview helper ────────────────────────────────────────────────────
const Thumb = ({ src, onRemove, label }) => (
  <div className="relative group aspect-video bg-white/5 border border-white/10 overflow-hidden">
    {src
      ? <img src={src} alt={label} className="w-full h-full object-cover" />
      : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">{label}</div>}
    {onRemove && src && (
      <button onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
const AdminPortfolio = () => {
  const [projects, setProjects]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [coverFile, setCoverFile]     = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [imageFiles, setImageFiles]   = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [deleteId, setDeleteId]       = useState(null);
  const [toast, setToast]             = useState(null);
  const listRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/portfolio/admin/all');
      setProjects(data.projects || []);
    } catch { showToast('Failed to load projects', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    if (!loading && listRef.current) {
      gsap.fromTo(listRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out' });
    }
  }, [loading]);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setCoverFile(null); setCoverPreview('');
    setImageFiles([]); setImagePreviews([]);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditId(p._id);
  
    setForm({
      title: p.title || '',
      titleAr: p.titleAr || '',
      category: p.category || 'E-commerce',
      description: p.description || '',
      descriptionAr: p.descriptionAr || '',
      liveUrl: p.liveUrl || '',
      tags: (p.tags || []).join(', '),
      order: p.order || 0,
      featured: p.featured,
      isPublished: p.isPublished,
    });
  
    setCoverFile(null);
  
    // 🔥 الحل هنا
    setCoverPreview(
      p.coverImage
        ? `${API_URL_IMAGE}/api/portfolio/image/${p.coverImage}`
        : ''
    );
  
    setImageFiles([]);
  
    setImagePreviews(
      (p.images || []).map(
        (img) => `${API_URL_IMAGE}/api/portfolio/image/${img}`
      )
    );
  
    setShowForm(true);
  };

  const handleCover = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImageFiles(files);
    setImagePreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverPreview && !coverFile) return showToast('Cover image required', 'error');

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (coverFile) fd.append('coverImage', coverFile);
      imageFiles.forEach((f) => fd.append('images', f));

      if (editId) {
        await api.put(`/portfolio/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Project updated ✓');
      } else {
        await api.post('/portfolio', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Project created ✓');
      }
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/portfolio/${id}`);
      setDeleteId(null);
      showToast('Deleted ✓');
      fetchProjects();
    } catch { showToast('Delete failed', 'error'); }
  };

  const toggleField = async (id, field, val) => {
    try {
      const fd = new FormData();
      fd.append(field, String(!val));
      await api.put(`/portfolio/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchProjects();
    } catch { showToast('Update failed', 'error'); }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 px-4 py-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] px-6 py-3 text-sm font-light tracking-wide border transition-all
          ${toast.type === 'error' ? 'bg-red-950 border-red-800 text-red-300' : 'bg-[#d4af37]/10 border-[#d4af37]/40 text-[#d4af37]'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white/90">Portfolio</h1>
          <p className="text-white/40 font-light mt-1">{projects.length} projects</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-6 py-3 bg-[#d4af37] text-black text-xs font-light tracking-widest uppercase hover:bg-[#c4a030] transition-colors active:scale-95">
          <Plus className="w-4 h-4" /> Add Project
        </button>
      </div>

      {/* Projects Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-60 border border-white/10 text-white/30">
          <p className="text-lg font-light mb-4">No portfolio projects yet</p>
          <button onClick={openAdd} className="text-[#d4af37] text-sm underline underline-offset-4">Add your first project</button>
        </div>
      ) : (
        <div ref={listRef} className="space-y-3">
          {projects.map((p) => (
            <div key={p._id}
              className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors">
              {/* Cover thumb */}
              <div className="w-20 h-14 flex-shrink-0 overflow-hidden bg-white/5">
  {p.coverImage ? (
    <img
      src={`${API_URL_IMAGE}/api/portfolio/image/${p.coverImage}`}
      alt={p.title}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
      No img
    </div>
  )}
</div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white/90 font-light truncate">{p.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 border border-[#d4af37]/30 text-[#d4af37]/70 tracking-wide">{p.category}</span>
                  {p.featured && <span className="text-[10px] px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] tracking-wide">Featured</span>}
                  {!p.isPublished && <span className="text-[10px] px-2 py-0.5 bg-white/5 text-white/30 tracking-wide">Draft</span>}
                </div>
                <p className="text-white/30 text-xs mt-1 truncate">{p.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Featured toggle */}
                <button onClick={() => toggleField(p._id, 'featured', p.featured)}
                  title={p.featured ? 'Unfeature' : 'Feature'}
                  className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-[#d4af37] transition-colors">
                  {p.featured ? <Star className="w-4 h-4 fill-[#d4af37] text-[#d4af37]" /> : <StarOff className="w-4 h-4" />}
                </button>

                {/* Published toggle */}
                <button onClick={() => toggleField(p._id, 'isPublished', p.isPublished)}
                  title={p.isPublished ? 'Unpublish' : 'Publish'}
                  className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                  {p.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Live link */}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* Edit */}
                <button onClick={() => openEdit(p)}
                  className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-[#d4af37] transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button onClick={() => setDeleteId(p._id)}
                  className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Form Modal ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-8">
          <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 p-8 relative">
            <button onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-light text-white/90 mb-8">
              {editId ? 'Edit Project' : 'New Portfolio Project'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Row: title + titleAr */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Title (EN) *</label>
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors placeholder-white/20"
                    placeholder="Project name" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Title (AR)</label>
                  <input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} dir="rtl"
                    className="w-full bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors placeholder-white/20"
                    placeholder="اسم المشروع" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Category *</label>
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
  className="w-full bg-[#0a0a0a] border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors">
  {CATEGORIES.map((c) => (
    <option key={c} value={c} className="bg-[#0a0a0a] text-white/90">{c}</option>
  ))}
</select>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Description (EN) *</label>
                  <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors placeholder-white/20 resize-none"
                    placeholder="Project description..." />
                </div>
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Description (AR)</label>
                  <textarea rows={4} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl"
                    className="w-full bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors placeholder-white/20 resize-none"
                    placeholder="وصف المشروع..." />
                </div>
              </div>

              {/* Live URL + Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Live URL</label>
                  <input type="url" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors placeholder-white/20"
                    placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors placeholder-white/20"
                    placeholder="React, Node.js, MongoDB" />
                </div>
              </div>

              {/* Order + Toggles */}
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Display Order</label>
                  <input type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className="w-24 bg-white/5 border border-white/10 text-white/90 text-sm font-light px-4 py-3 focus:border-[#d4af37]/50 focus:outline-none transition-colors" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <div onClick={() => setForm({ ...form, featured: !form.featured })}
                    className={`w-10 h-5 rounded-full transition-colors ${form.featured ? 'bg-[#d4af37]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-white/50 uppercase tracking-widest">Featured (show in Home)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <div onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                    className={`w-10 h-5 rounded-full transition-colors ${form.isPublished ? 'bg-[#d4af37]' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-xs text-white/50 uppercase tracking-widest">Published</span>
                </label>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Cover Image *</label>
                <div className="grid grid-cols-2 gap-4">
                  <Thumb src={coverPreview} label="Cover" />
                  <label className="flex flex-col items-center justify-center aspect-video border border-dashed border-white/20 hover:border-[#d4af37]/40 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-white/30 mb-2" />
                    <span className="text-xs text-white/30">Upload cover</span>
                    <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-xs text-white/40 tracking-widest uppercase mb-2">Gallery Images (up to 5)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Thumb key={i} src={imagePreviews[i]} label={`#${i + 1}`} />
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 hover:border-[#d4af37]/40 cursor-pointer transition-colors text-xs text-white/40">
                  <Upload className="w-4 h-4" /> Select up to 5 images
                  <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
                </label>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4 border-t border-white/10">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-[#d4af37] text-black text-xs font-light tracking-widest uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50 active:scale-95">
                  {saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : editId ? 'Update Project' : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-8 py-3 border border-white/10 text-white/50 text-xs font-light tracking-widest uppercase hover:border-white/30 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 p-8 text-center">
            <p className="text-white/70 font-light mb-6">Delete this project? This can't be undone.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => handleDelete(deleteId)}
                className="px-6 py-2.5 bg-red-900/60 border border-red-800/50 text-red-300 text-xs tracking-widest uppercase hover:bg-red-900 transition-colors">
                Delete
              </button>
              <button onClick={() => setDeleteId(null)}
                className="px-6 py-2.5 border border-white/10 text-white/50 text-xs tracking-widest uppercase hover:border-white/30 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortfolio;
