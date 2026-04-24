"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase'; // Path adjusted per project tree
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ArchiveCatalogue() {
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const [modalAspectRatio, setModalAspectRatio] = useState<number | null>(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);


  useEffect(() => {
    if (isMobile && scrollRef.current) {
      const activeItem = scrollRef.current.querySelector('[data-active="true"]');
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  }, [activeCategory, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject && Array.isArray(selectedProject.file_url)) {
      selectedProject.file_url.forEach((url: string) => {
        // Only preload if it's an image; videos handle their own loading differently
        const extension = url.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '')) {
          const img = new Image();
          img.src = url;
        }
      });
    }
  }, [selectedProject]);

  async function fetchData() {
    try {
      setLoading(true);
      const timer = new Promise(resolve => setTimeout(resolve, 3000));
      const fetchProjects = supabase.from('archive').select('*').order('created_at', { ascending: false });
      const fetchCategories = supabase.from('catalogue_categories').select('name');

      const [projectsRes, categoriesRes] = await Promise.all([
        fetchProjects,
        fetchCategories,
        timer 
      ]);

      setProjects(projectsRes.data || []);
      setCategories([{ name: 'All' }, ...(categoriesRes.data || [])]);
    } catch (err) {
      console.error("System Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = projects.filter(p => 
    activeCategory === 'All' || p.category === activeCategory
  );

  const isVideo = (url: any) => {
    if (!url || Array.isArray(url)) return false; 
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg'].includes(ext || '');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const renderPreview = (url: string) => {
    if (!url) return <div className="flex items-center justify-center h-full text-[10px] uppercase opacity-20 italic">No Asset Loaded</div>;
    const extension = url.split('.').pop()?.toLowerCase();

    // 1. VIDEO HANDLING
    if (['mp4', 'webm', 'ogg'].includes(extension || '')) {
      return (
        <video 
          key={url}
          src={url} 
          controls 
          className="w-full h-full object-contain bg-black" 
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      );
    }

    // 2. PDF HANDLING
    if (extension === 'pdf') {
      return <iframe key={url} src={`${url}#toolbar=0`} className="w-full h-full border-none bg-white" title="PDF Preview" />;
    }

    // 3. IMAGE HANDLING
    return (
      <div 
        className="w-full h-full overflow-hidden cursor-zoom-in relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <img 
          key={url}
          src={url} 
          onLoad={() => setIsPreviewLoaded(true)}
          className="w-full h-full object-contain transition-transform"
          style={{
            transition: 'transform 2s cubic-bezier(0.20, 1, 0.5, 1)',
            transform: isHovering ? 'scale(2.2)' : 'scale(1)',
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
          }}
          alt="Asset Preview" 
          loading="eager"
        />
      </div>
    );
  };

  if (loading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-20">
        <source src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/grain%20videograin.mp4" type="video/mp4" />
      </video>
      <div className="relative z-10 flex flex-col items-center">
        <div className="font-brand-secondary-thin text-[13px] tracking-[0.7em] uppercase text-white animate-pulse establishing-authority-mobile">
          Loading Project Archive
        </div>
      </div>
    </div>
  );

  return (

        <main className="relative bg-black">
      {/* SURGICAL MASK: Add this exact block to every new page */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.7 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'black',
          zIndex: 999, // Ensure it sits above all page content
          pointerEvents: 'none'
        }}
      />
    <div className="min-h-screen relative text-white font-brand-secondary-thin antialiased overflow-x-hidden bg-black custom-scrollbar">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #636363; border-radius: 0px; cursor: pointer; }
        * { scrollbar-width: thin; scrollbar-color: #d3d3d3 #000000; }
      `}} />

      <div className="relative w-full min-h-screen bg-black ">
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
          <video
            key="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4"
            muted 
            autoPlay
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover grayscale opacity-30"
          >
            <source src="https://objectstorage.af-johannesburg-1.oraclecloud.com/n/axqupand75tw/b/judaion-vault/o/JDS%20Global%20Bgglobal-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/0 pointer-events-none" />
        </div>
          
        <header className="relative bg-black backdrop-blur-sm px-6 lg:px-16 pt-24 pb-9 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 sticky top-0 z-30 transition-all duration-500 overflow-hidden shadow-2xl"
          style={{
            backgroundImage: "url('/archive-header.avif')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
          }}
        >
          <div className="absolute inset-0 bg-black/65 z-0 pointer-events-none" />
          <div className="flex flex-col">
            <div className="flex items-end justify-between w-full relative">
              <img src="/project-arch-title.png" alt="PROJECT ARCHIVE" className="w-full max-w-[700px] h-auto object-contain" />
            </div>

            {!isMobile && (
              <div className="absolute top-33 right-15 flex items-center space-x-6 ">
                <img src="/box-icon.png" alt="Archive Designator" className="w-15 h-auto filter brightness-110" />
              </div>
            )}

            <Link 
            href="/projectarchive"
             className="flex items-center cursor-pointer group mb-0 self-start">
              <motion.img 
                src="/return-to.png" 
                className="pt-8 w-22 h-auto opacity-70 group-hover:opacity-100" 
                animate={{ x: [0, -4, 0] }} 
                transition={{ duration: 3, repeat: Infinity }} 
              />
            </Link>
          </div>

          <nav ref={scrollRef as any} className="archive-nav-scroller flex flex-wrap gap-x-8 gap-y-2 mb-1">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                data-active={activeCategory === cat.name} 
                className={`text-[18px] font-brand-cn uppercase tracking-widest transition-all duration-300 relative pb-1 cursor-pointer ${
                  activeCategory === cat.name ? 'text-white/40' : 'text-white/40 hover:text-white'
                }`}
              >
                {cat.name}
                {activeCategory === cat.name && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-700" />
                )}
              </button>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-6 lg:px-16 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12 mt-12">
            {filtered.map((item) => (
              <div 
                key={item.id} 
                className="group cursor-pointer"
onClick={() => {
          setIsPreviewLoaded(false); // Reset load state
          setSelectedProject(item);
          setIsPlaying(false);
          setCurrentAssetIndex(0);
        
          const assetUrl = Array.isArray(item.file_url) ? item.file_url[0] : item.file_url;
          if (assetUrl) {
            const extension = assetUrl.split('.').pop()?.toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension || '');

            if (isImage) {
              const img = new Image();
              img.src = assetUrl;
              img.onload = () => {
                const ratio = img.naturalWidth / img.naturalHeight;
                console.log(`Dynamic Ratio [${item.title}]: ${ratio}`);
                setModalAspectRatio(ratio);
              };
            } else {
              setModalAspectRatio(null); // Fallback for video/PDF
            }
          }
        }}
      >
                <div className="aspect-[4/5] overflow-hidden bg-white/5 backdrop-blur-md border border-white/0 shadow-xl mb-4 relative rounded-none">
                  <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                </div>
                <div className="space-y-1 px-1">
                  <p className="text-[25px] font-brand-other uppercase tracking-[0.2em] leading-tight text-white">{item.title}</p>
                  <p className="text-[12px] text-white/40 font-brand-seondary-thin uppercase tracking-[0.3em]">{item.resource_type}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-12 px-10">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer" onClick={() => setSelectedProject(null)} />
          <div 
          className="relative w-full max-w-[95vw] h-full max-h-[85vh] bg-[#0a0a0a] border border-white/10 rounded-none overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in slide-in-from-bottom-8 duration-500"
          style={{
            // If an image ratio exists, use it. Otherwise use the default 4:3 (or 1:1)
            aspectRatio: modalAspectRatio ? `${modalAspectRatio}` : '1.33 / 1', 
          }}
        >
            
            <div className="lg:w-2/3 h-1/2 lg:h-auto bg-black border-r border-white/0 relative group ">
                {isVideo(selectedProject.file_url) && !isPlaying && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 opacity-70 group-hover:opacity-0 transition-opacity duration-500 pointer-events-none bg-black/20">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white mb-4 animate-bounce">
                          <path d="M12 5V9M12 5C9.23858 5 7 7.23858 7 10V14C7 16.7614 9.23858 19 12 19C14.7614 19 17 16.7614 17 14V10C17 7.23858 14.7614 5 12 5Z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-white text-[10px] font-black uppercase tracking-[0.6em]">Click To Play</span>
                  </div>
                )}

                <div className="absolute top-3 left-3 z-20 flex items-center gap-4 opacity-40 transition-opacity">
                    <span className="w-3 h-3 bg-orange-600 animate-pulse rounded-full" />
                </div>
                
                {renderPreview(
                  Array.isArray(selectedProject.file_url) 
                    ? selectedProject.file_url[currentAssetIndex] 
                    : selectedProject.file_url
                )}

                {Array.isArray(selectedProject.file_url) && selectedProject.file_url.length > 1 && (
                  <div className="absolute inset-0 flex items-center justify-between px-4 z-30 pointer-events-none">
                    {currentAssetIndex > 0 ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentAssetIndex(prev => prev - 1);
                        }}
                        className="p-2 bg-black/50 hover:bg-orange-800 text-white transition-all pointer-events-auto cursor-pointer"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                    ) : <div />}

                    {currentAssetIndex < selectedProject.file_url.length - 1 ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentAssetIndex(prev => prev + 1);
                        }}
                        className="p-2 bg-black/50 hover:bg-orange-800 text-white transition-all pointer-events-auto cursor-pointer"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    ) : <div />}
                  </div>
                )}

                {Array.isArray(selectedProject.file_url) && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-black/60 px-3 py-1 text-[14px] font-black tracking-widest uppercase">
                    {currentAssetIndex + 1} / {selectedProject.file_url.length}
                  </div>
                )}
            </div>

            <div className="flex-1 flex flex-col bg-[#0000]">
              <div className="h-40 shrink-0 relative overflow-hidden border-b border-white/0">
                <img src={selectedProject.thumbnail_url} className="w-full h-full object-cover grayscale-26 opacity-100" alt="" />
                <button 
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-30 cursor-pointer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="flex-1 p-8 lg:p-10 overflow-y-auto space-y-8 custom-scrollbar">
                <div>
                  <div className="space-y-8 mb-6">
                    <span className="px-3 py-1.5 border border-orange-600/60 text-[10px] uppercase text-orange-600 inline-block animate-pulse">
                        JDS Archive // {selectedProject.category} - {selectedProject.resource_type}
                    </span>
                    <h2 className="text-4xl lg:text-5xl font-brand-other uppercase tracking-[0.2em] leading-[1] text-white ">
                        {selectedProject.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/30 pt-8">
                  <p className="text-[14px] leading-relaxed text-white/60 font-medium uppercase font-brand-secondary-thin whitespace-pre-wrap">
                    {selectedProject.content}
                  </p>
                </div>
              </div>

              <div className="p-8 border-t border-white/0 bg-black/40 flex items-center justify-center space-x-4">
                  <img src="/judaion-logo-white.svg" alt="Judaion" className="h-8 w-auto opacity-20" />
                  <span className="text-white/20 text-[13px] font-brand-med-italic-cn uppercase tracking-[0.5em] leading-none pt-1">
                    // Proj.ARCHIVE
                  </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
  );
}