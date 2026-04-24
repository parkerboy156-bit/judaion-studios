"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 

interface ArchiveItem {
  id: number;
  title: string;
  category: string;
  resource_type: string;
  content: string;
  thumbnail_url: string;
  file_url: string[]; 
  created_at?: string;
}

interface MetaOption {
  id: number;
  name: string;
}

export default function AdminPortal() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<MetaOption[]>([]);
  const [resourceTypes, setResourceTypes] = useState<MetaOption[]>([]);
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newOption, setNewOption] = useState({ name: '', type: 'category' });
  const [formData, setFormData] = useState({ 
    title: '', category: '', resource_type: '', content: '' 
  });
  const [files, setFiles] = useState<{ thumb: File | null; assets: File[] }>({
    thumb: null,
    assets: []
  });


  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: cat } = await supabase.from('catalogue_categories').select('*').order('name');
    const { data: res } = await supabase.from('resource_types').select('*').order('name');
    const { data: arc } = await supabase.from('archive').select('*').order('created_at', { ascending: false });
    
    setCategories(cat || []);
    setResourceTypes(res || []);
    setArchive(arc || []);
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
  };

  const handleAddOption = async () => {
    if (!newOption.name) return;
    const table = newOption.type === 'category' ? 'catalogue_categories' : 'resource_types';
    await supabase.from(table).insert([{ name: newOption.name }]);
    setNewOption({ ...newOption, name: '' });
    fetchData();
  };

  const handleDeleteOption = async (id: number, type: 'category' | 'type') => {
    if(!confirm("CONFIRM_META_DELETION?")) return;
    const table = type === 'category' ? 'catalogue_categories' : 'resource_types';
    await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  const resetForm = () => {
    setFormData({ title: '', category: '', resource_type: '', content: '' });
    setFiles({ thumb: null, assets: [] }); 
    setEditingId(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingProject = editingId ? archive.find(item => item.id === editingId) : null;

    if (!editingId && (!files.thumb || files.assets.length === 0)) {
      alert("Please select a thumbnail and at least one asset for a new project.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);

      let finalThumbUrl = existingProject?.thumbnail_url || '';
      let finalAssetUrls = existingProject?.file_url || [];

      const folderName = formData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const categoryName = formData.category.replace(/[^a-z0-9]/gi, '_').toLowerCase();

const uploadFile = async (file: File, path: string) => {
  // Step 1: Ask your API for a secure direct-upload link
  const res = await fetch('/api/upload', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, contentType: file.type }) 
  });
  
  const { signedUrl, publicUrl, error } = await res.json();
  if (error) throw new Error(error);

  // Step 2: Upload the file DIRECTLY to Oracle Cloud using the signed link
  // This bypasses Vercel's 4.5MB limit
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT', // Direct S3 uploads use PUT
    body: file,
    headers: { 'Content-Type': file.type }
  });

  if (!uploadRes.ok) throw new Error("Direct upload to Oracle failed.");
  
  return publicUrl;
};

if (files.thumb) {
  const thumbPath = `${categoryName}/${folderName}/thumb_${Date.now()}.${files.thumb.name.split('.').pop()}`;
  finalThumbUrl = await uploadFile(files.thumb, thumbPath);
}

if (files.assets.length > 0) {
  const assetUrls = [];
  for (let i = 0; i < files.assets.length; i++) {
    const path = `${categoryName}/${folderName}/asset_${i}_${Date.now()}.${files.assets[i].name.split('.').pop()}`;
    const url = await uploadFile(files.assets[i], path);
    assetUrls.push(url);
  }
  finalAssetUrls = assetUrls;
}

      const payload = { ...formData, thumbnail_url: finalThumbUrl, file_url: finalAssetUrls };

      const { error: dbError } = editingId 
        ? await supabase.from('archive').update(payload).eq('id', editingId)
        : await supabase.from('archive').insert([payload]);

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

  const groupedArchive = categories.reduce((acc: any, cat) => {
    acc[cat.name] = archive.filter(item => item.category === cat.name);
    return acc;
  }, { 'Uncategorized': archive.filter(item => !item.category) });

  const renderAssetPreview = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    const isVideo = ['mp4', 'webm', 'ogg'].includes(extension || '');
    const isPdf = extension === 'pdf';

    if (isVideo) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#050505]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF5A00" strokeWidth="1.5"><path d="M12 5V9M12 5C9.23858 5 7 7.23858 7 10V14C7 16.7614 9.23858 19 12 19C14.7614 19 17 16.7614 17 14V10C17 7.23858 14.7614 5 12 5Z" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
    return <img src={url} className="w-full h-full object-cover" alt="Current" loading="lazy" />;
  };

  return (
    <div className="min-h-screen relative text-white font-brand-secondary-heavy antialiased bg-black custom-scrollbar">

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dddddd; border-radius: 0px; cursor: pointer; }
        * { scrollbar-width: thin; scrollbar-color: #dfdfdf #000; }
      `}} />

      <div 
        className="fixed inset-0 z-0 bg-cover bg-center pointer-events-none opacity-40"
        style={{ backgroundImage: "url('/admin-bg.png')" }} 
      />
      <div className="fixed inset-0 z-0 bg-black/60 pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        
        <header className="px-6 lg:px-16 pt-32 pb-12 border-b border-white/5 backdrop-blur-sm">
            <h1 className="text-[9px] font-brand-secondary-thin uppercase tracking-[0.6em] text-white/30 mb-1 ">Admin Control Terminal</h1>
            <h2 className="text-[35px] font-black uppercase  tracking-[0.2em] text-white">Admin V2.0</h2>
            <button 
              onClick={handleLogout}
              className="text-[13px] font-black text-red-600 hover:text-white hover:bg-red-600 border border-red-600/30 px-9 py-3 transition-all uppercase tracking-widest cursor-pointer"
            >
              LOG-OUT 
            </button>
        </header>

        <main className="px-6 lg:px-16 py-12 flex flex-col lg:flex-row gap-16">
          <section className="lg:w-1/3 space-y-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 space-y-8 shadow-2xl">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-600 border-b border-orange-600/20 pb-4">
                {editingId ? 'EDIT CURRENT PROJECT' : 'Add Asset'}
              </h3>

              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Entry Title</label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 p-4 text-[13px] font-bold  uppercase focus:border-orange-600 transition-colors outline-none cursor-text"
                    placeholder="TITLE"
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Category</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 p-4 text-[11px] font-black uppercase outline-none focus:border-orange-600 cursor-pointer"
                      required
                    >
                      <option value="">Select</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Asset Type</label>
                    <select 
                      value={formData.resource_type}
                      onChange={e => setFormData({...formData, resource_type: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 p-4 text-[11px] font-black uppercase outline-none focus:border-orange-600 cursor-pointer"
                      required
                    >
                      <option value="">Select</option>
                      {resourceTypes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Thumbnail [+]</label>
                    <label className="group cursor-pointer flex flex-col items-center justify-center border border-white/10 bg-black/20 hover:border-orange-600 aspect-square transition-all relative overflow-hidden text-center">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={e => setFiles({...files, thumb: e.target.files ? e.target.files[0] : null})} 
                        />
                        {files.thumb ? (
                           <span className="text-[10px] font-black text-white/50 px-4 uppercase truncate max-w-full">
                             {files.thumb.name}
                           </span>
                        ) : editingId ? (
                           archive.find(item => item.id === editingId)?.thumbnail_url ? (
                               <img src={archive.find(item => item.id === editingId)?.thumbnail_url} className="w-full h-full object-cover grayscale opacity-60 hover:opacity-100 transition-opacity" alt="Current Thumbnail" />
                           ) : (
                               <span className="text-[10px] font-black px-4 uppercase truncate max-w-full">+</span>
                           )
                        ) : (
                           <span className="text-[10px] font-black px-4 uppercase truncate max-w-full">+</span>
                        )}
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Assets [+]</label>
                    <label className="group cursor-pointer flex flex-col items-center justify-center border border-white/10 bg-black/20 hover:border-orange-600 aspect-square transition-all relative overflow-hidden text-center">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            const newFile = e.target.files[0];
                            setFiles(prev => ({
                              ...prev,
                              assets: [...prev.assets, newFile] 
                            }));
                          }
                          e.target.value = ''; 
                        }} 
                      />
                      {files.assets.length > 0 ? (
                        <span className="text-[10px] font-black text-orange-600 px-4 uppercase animate-pulse">
                          {files.assets.length} Files Stacking...
                        </span>
                      ) : editingId ? (
                        <div className="w-full h-full flex flex-wrap gap-0.5 p-1 bg-black/40 opacity-50 group-hover:opacity-100 transition-opacity">
                          {archive.find(item => item.id === editingId)?.file_url.slice(0, 4).map((url, index) => (
                            <div key={index} className="w-[calc(50%-2px)] h-[calc(50%-2px)] overflow-hidden">
                              {renderAssetPreview(url)}
                            </div>
                          ))}
                          {archive.find(item => item.id === editingId)?.file_url.length! > 4 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <span className="text-[10px] font-black">+{archive.find(item => item.id === editingId)?.file_url.length! - 4}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black px-4 uppercase truncate max-w-full">+</span>
                      )}

                      {files.assets.length > 0 && (
                        <button 
                          type="button"
                          onClick={(e) => { e.preventDefault(); setFiles({...files, assets: []}); }}
                          className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] bg-red-600 text-white px-2 py-1 font-black tracking-widest uppercase hover:bg-white hover:text-red-600 transition-colors z-50"
                        >
                          Reset Sequence
                        </button>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Project Description</label>
                  <textarea 
                    value={formData.content} 
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 p-4 h-24 text-[12px] font-medium uppercase font-brand-secondary-thin focus:border-orange-600 outline-none cursor-text"
                  />
                </div>

                {uploading && (
                  <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-orange-600">
                      <span>UPLOADING_ASSET</span>
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
                  className="w-full bg-white text-black py-6 font-black uppercase tracking-[0.5em] text-[10px] hover:bg-orange-600 hover:text-white transition-all shadow-xl cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? 'Processing...' : (editingId ? 'Update Asset' : 'UPLOAD PROJECT')}
                </button>
              </form>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 space-y-8 shadow-2xl">
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 ">System Meta Manager</h3>
                
                <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="NEW TAG NAME"
                      value={newOption.name}
                      onChange={(e) => setNewOption({ ...newOption, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 p-4 text-[10px] font-black uppercase outline-none focus:border-orange-600 cursor-text"
                    />
                    <div className="flex gap-2">
                        <select 
                            value={newOption.type}
                            onChange={(e) => setNewOption({ ...newOption, type: e.target.value })}
                            className="bg-black/40 border border-white/10 p-3 text-[10px] font-black uppercase outline-none cursor-pointer"
                        >
                            <option value="category">Category</option>
                            <option value="type">Asset Type</option>
                        </select>
                        <button onClick={handleAddOption} className="flex-1 bg-orange-600 text-white font-black text-[10px] uppercase hover:bg-white hover:text-black transition-all cursor-pointer">Add</button>
                    </div>
                </div>

                <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">Active Categories</span>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(c => (
                                <div key={c.id} className="flex items-center bg-white/5 border border-white/10 px-3 py-1 gap-3">
                                    <span className="text-[10px] font-black uppercase">{c.name}</span>
                                    <button onClick={() => handleDeleteOption(c.id, 'category')} className="text-orange-600 hover:text-white font-bold cursor-pointer">[X]</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-white/20 tracking-[0.3em]">Active Asset Types</span>
                        <div className="flex flex-wrap gap-2">
                            {resourceTypes.map(r => (
                                <div key={r.id} className="flex items-center bg-white/5 border border-white/10 px-3 py-1 gap-3">
                                    <span className="text-[10px] font-black uppercase">{r.name}</span>
                                    <button onClick={() => handleDeleteOption(r.id, 'type')} className="text-orange-600 hover:text-white font-bold cursor-pointer">[X]</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </section>

          <section className="flex-1 space-y-16">
            {Object.entries(groupedArchive).map(([catName, items]: [string, any]) => (
              items.length > 0 && (
                <div key={catName} className="space-y-8 animate-in fade-in duration-700">
                  <div className="flex items-center gap-6">
                    <h4 className="text-[14px] font-black uppercase tracking-[0.5em] text-orange-600 ">/ {catName}</h4>
                    <div className="h-[1px] flex-1 bg-white/10"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                    {items.map((item: ArchiveItem) => (
                      <div key={item.id} className="group border border-white/5 bg-white/5 backdrop-blur-md p-3 transition-all hover:border-white/20">
                        <div className="aspect-[4/5] overflow-hidden bg-black mb-3 relative">
                          <img src={item.thumbnail_url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity duration-700" alt="" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({ title: item.title, category: item.category, resource_type: item.resource_type, content: item.content });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="bg-white text-black w-2/3 py-3 text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all cursor-pointer"
                            >
                              Modify
                            </button>
                            <button 
                              onClick={async () => {
                                if(confirm("PERMANENT_REMOVAL?")) {
                                    await supabase.from('archive').delete().eq('id', item.id);
                                    fetchData();
                                }
                              }}
                              className="text-red-500 text-[9px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                            >
                              Purge
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] font-black uppercase text-white truncate">{item.title}</p>
                        <p className="text-[9px] text-white/30 font-bold uppercase">{item.resource_type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}