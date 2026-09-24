"use client";

import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Adjust path if necessary
import { useRouter } from 'next/navigation';

export default function AnalisisCampanaPage() {
  const router = useRouter();
  
  // Segmento 1: Origen y Operación Digital
  const [cuentasMatriz, setCuentasMatriz] = useState('');
  const [estrategiaNarrativa, setEstrategiaNarrativa] = useState('');
  const [lineaAmplificacion, setLineaAmplificacion] = useState('');

  // Segmento 2: Descontento Comunitario y Focos Territoriales
  const [municipios, setMunicipios] = useState([]);
  
  // Segmento 3: Alerta Temprana y Registro en Comentarios
  const [alertas, setAlertas] = useState([]);

  // Segmento 4: Registro de Publicaciones (Capturas de pantalla)
  const [publicacionesFiles, setPublicacionesFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add/Remove Municipio
  const handleAddMunicipio = () => {
    setMunicipios([...municipios, { id: Date.now(), nombre: '', descripcion: '' }]);
  };
  const handleRemoveMunicipio = (id) => {
    setMunicipios(municipios.filter(m => m.id !== id));
  };
  const handleChangeMunicipio = (id, field, value) => {
    setMunicipios(municipios.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Add/Remove Alerta
  const handleAddAlerta = () => {
    setAlertas([...alertas, { id: Date.now(), nivel: 'Alerta Alta', usuario: '', registro: '' }]);
  };
  const handleRemoveAlerta = (id) => {
    setAlertas(alertas.filter(a => a.id !== id));
  };
  const handleChangeAlerta = (id, field, value) => {
    setAlertas(alertas.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  // File selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setPublicacionesFiles(files);
  };

  // Upload to ImgBB
  const uploadToImgBB = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    // Fallback key if env var not set, for demonstration purposes. Use your own in production.
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY; 
    
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error(data.error?.message || 'Error al subir imagen');
      }
    } catch (error) {
      console.error('ImgBB Upload Error:', error);
      return null;
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      // 1. Subir todas las imágenes a ImgBB
      const uploadPromises = publicacionesFiles.map(file => uploadToImgBB(file));
      const urls = await Promise.all(uploadPromises);
      
      const publicacionesValidas = urls.filter(url => url !== null);

      // 2. Construir objeto de datos
      const formData = {
        origenOperacion: {
          cuentasMatriz,
          estrategiaNarrativa,
          lineaAmplificacion,
        },
        focosTerritoriales: municipios.map(({ nombre, descripcion }) => ({ nombre, descripcion })),
        alertasTempranas: alertas.map(({ nivel, usuario, registro }) => ({ nivel, usuario, registro })),
        publicacionesRegistradas: publicacionesValidas,
      };

      // 3. Guardar en Firestore
      const colRef = collection(db, 'analisis_campanas');
      await addDoc(colRef, {
        ...formData,
        createdAt: serverTimestamp(),
      });

      setSuccessMessage('El Análisis de Campaña ha sido registrado exitosamente. Generando PDF con diseño...');
      
      // 4. Generar y descargar el PDF con el diseño especial
      try {
        const pdfRes = await fetch('/api/generate-analisis-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            fechaStr: new Date().toLocaleDateString('es-VE')
          }),
        });
        if (pdfRes.ok) {
          const blob = await pdfRes.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Analisis_Campana_${new Date().toLocaleDateString('es-VE').replace(/\//g, '-')}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          setSuccessMessage('¡El Análisis de Campaña se guardó y el PDF se generó exitosamente!');
        } else {
          console.error('Error del servidor al generar PDF:', await pdfRes.text());
          alert('Se guardó el registro, pero ocurrió un error generando el PDF visual.');
        }
      } catch (pdfErr) {
        console.error('Error generando PDF:', pdfErr);
      }
      
      // Reset form
      setCuentasMatriz('');
      setEstrategiaNarrativa('');
      setLineaAmplificacion('');
      setMunicipios([]);
      setAlertas([]);
      setPublicacionesFiles([]);
      e.target.reset(); // reset file input visually

    } catch (error) {
      console.error("Error al guardar:", error);
      alert('Hubo un error al guardar el registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Análisis Técnico de Campaña
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Registro y Alerta Digital para situaciones críticas.
            </p>
          </div>
          <button 
            onClick={() => router.back()} 
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition font-medium text-sm"
          >
            ← Volver
          </button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
            <span>✅</span> {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SEGMENTO 1 */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="text-blue-600 dark:text-blue-400">1.</span> Origen y Operación Digital
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cuentas Matriz Identificadas</label>
                <input 
                  type="text" 
                  required
                  value={cuentasMatriz} 
                  onChange={(e) => setCuentasMatriz(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Ej: @Usuario1, @Usuario2..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estrategia y Narrativa</label>
                <textarea 
                  required
                  rows={3}
                  value={estrategiaNarrativa} 
                  onChange={(e) => setEstrategiaNarrativa(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
                  placeholder="Describe la narrativa detectada..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Línea de Amplificación</label>
                <textarea 
                  required
                  rows={3}
                  value={lineaAmplificacion} 
                  onChange={(e) => setLineaAmplificacion(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y"
                  placeholder="Detalla cómo se está amplificando el mensaje..."
                />
              </div>
            </div>
          </section>

          {/* SEGMENTO 2 */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="text-orange-500">2.</span> Focos Territoriales
              </h2>
              <button 
                type="button" 
                onClick={handleAddMunicipio}
                className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:hover:bg-orange-500/30 px-3 py-1.5 rounded-lg font-bold transition"
              >
                + Añadir Municipio
              </button>
            </div>
            
            <div className="space-y-4">
              {municipios.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No se han añadido focos territoriales.</p>
              )}
              {municipios.map((mun, index) => (
                <div key={mun.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 relative group">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveMunicipio(mun.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                  <div className="mb-3 pr-6">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nombre del Municipio</label>
                    <input 
                      type="text" 
                      required
                      value={mun.nombre} 
                      onChange={(e) => handleChangeMunicipio(mun.id, 'nombre', e.target.value)}
                      className="w-full border-b-2 border-slate-300 dark:border-slate-600 bg-transparent py-2 text-sm text-slate-900 dark:text-white focus:border-orange-500 outline-none transition"
                      placeholder="Ej: Sucre..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Descripción de la situación/foco</label>
                    <textarea 
                      required
                      rows={2}
                      value={mun.descripcion} 
                      onChange={(e) => handleChangeMunicipio(mun.id, 'descripcion', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Describa el foco de descontento..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEGMENTO 3 */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-3">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span className="text-red-500">3.</span> Alertas Tempranas
              </h2>
              <button 
                type="button" 
                onClick={handleAddAlerta}
                className="text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-bold transition"
              >
                + Añadir Alerta
              </button>
            </div>
            
            <div className="space-y-4">
              {alertas.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No hay alertas registradas.</p>
              )}
              {alertas.map((alerta) => (
                <div key={alerta.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 relative">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveAlerta(alerta.id)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pr-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nivel de Alerta</label>
                      <select 
                        value={alerta.nivel}
                        onChange={(e) => handleChangeAlerta(alerta.id, 'nivel', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 p-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition"
                      >
                        <option value="Alerta Crítica">🔴 Alerta Crítica</option>
                        <option value="Alerta Alta">🟠 Alerta Alta</option>
                        <option value="Alerta Moderada">🟡 Alerta Moderada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Usuario</label>
                      <input 
                        type="text" 
                        required
                        value={alerta.usuario}
                        onChange={(e) => handleChangeAlerta(alerta.id, 'usuario', e.target.value)}
                        className="w-full border-b-2 border-slate-300 dark:border-slate-600 bg-transparent py-2 text-sm text-slate-900 dark:text-white focus:border-red-500 outline-none transition"
                        placeholder="@PerfilImplicado..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Registro / Comentario</label>
                    <textarea 
                      required
                      rows={2}
                      value={alerta.registro}
                      onChange={(e) => handleChangeAlerta(alerta.id, 'registro', e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 p-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition"
                      placeholder="Detalles de la alerta..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SEGMENTO 4 */}
          <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <span className="text-purple-600 dark:text-purple-400">4.</span> Registro de Publicaciones
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sube las capturas de pantalla de las publicaciones detectadas. 
                <span className="block mt-1 font-medium text-slate-500 text-xs">Se enviarán a almacenamiento externo para generar enlaces directos.</span>
              </p>
              
              <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-4xl mb-3">📸</div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Haz clic o arrastra imágenes aquí
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {publicacionesFiles.length > 0 
                    ? `${publicacionesFiles.length} imagen(es) seleccionada(s)` 
                    : "PNG, JPG, JPEG permitidos"}
                </p>
              </div>
              
              {publicacionesFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {publicacionesFiles.map((f, i) => (
                    <span key={i} className="inline-block px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-md text-xs font-medium border border-purple-100 dark:border-purple-800">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ACCIONES */}
          <div className="pt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${
                isSubmitting 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 cursor-pointer'
              }`}
            >
              {isSubmitting ? 'Guardando Registro...' : 'Guardar Análisis Completo'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
