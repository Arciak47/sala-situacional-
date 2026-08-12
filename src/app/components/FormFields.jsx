"use client";

import { MUNICIPIOS, REDES_SOCIALES, AREAS, SENTIMIENTOS, VIRALIDADES } from '../lib/constants';
import { formatDate, formatTime } from '../lib/canvasHelpers';

export default function FormFields({ data, setData, readOnly = false, onImageUpload }) {
  const ch = (f) => (e) => setData((p) => ({ ...p, [f]: e.target.value }));
  const cls =
    'w-full px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:border-red-600';

  // Helper to convert DD/MM/YYYY back to YYYY-MM-DD for <input type="date">
  const getRawDate = () => {
    if (data.fechaRaw) return data.fechaRaw;
    if (data.fecha && /^\d{2}\/\d{2}\/\d{4}$/.test(data.fecha)) {
      const [d, m, y] = data.fecha.split('/');
      return `${y}-${m}-${d}`;
    }
    return '';
  };

  // Helper to convert 12h time back to HH:MM (24h) for <input type="time">
  const getRawTime = () => {
    if (data.horaRaw) return data.horaRaw;
    if (data.hora && /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(data.hora)) {
      const match = data.hora.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let [, h, m, ampm] = match;
        let hNum = parseInt(h, 10);
        if (ampm.toUpperCase() === 'PM' && hNum < 12) hNum += 12;
        if (ampm.toUpperCase() === 'AM' && hNum === 12) hNum = 0;
        const hStr = hNum < 10 ? '0' + hNum : '' + hNum;
        return `${hStr}:${m}`;
      }
    }
    return '';
  };

  const handleDateChange = (e) => {
    const raw = e.target.value; // YYYY-MM-DD
    const formatted = formatDate(raw);
    setData((p) => ({
      ...p,
      fechaRaw: raw,
      fecha: formatted,
    }));
  };

  const handleTimeChange = (e) => {
    const raw = e.target.value; // HH:MM
    const formatted = formatTime(raw);
    setData((p) => ({
      ...p,
      horaRaw: raw,
      hora: formatted,
    }));
  };

  // Get current date in local time for YYYY-MM-DD format (min/max attributes)
  const todayObj = new Date();
  const yyyy = todayObj.getFullYear();
  const mm = String(todayObj.getMonth() + 1).padStart(2, '0');
  const dd = String(todayObj.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  return (
    <div className="space-y-3 text-slate-700 dark:text-slate-200">
      <div>
        <label className="block text-xs font-bold mb-1">1. Municipio *</label>
        <select
          disabled={readOnly}
          value={data.municipio}
          onChange={ch('municipio')}
          className={cls + ' font-bold'}
        >
          <option value="">— Seleccionar —</option>
          {MUNICIPIOS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Fecha *</label>
          <input
            disabled={readOnly}
            type="date"
            min={today}
            max={today}
            value={getRawDate()}
            onChange={handleDateChange}
            className={cls + ' font-medium cursor-pointer'}
          />
          {data.fecha && (
            <span className="text-[10px] text-red-600 font-bold block mt-1">
              Formato: {data.fecha}
            </span>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Hora (12H AM/PM) *</label>
          <input
            disabled={readOnly}
            type="time"
            value={getRawTime()}
            onChange={handleTimeChange}
            className={cls + ' font-medium cursor-pointer'}
          />
          {data.hora && (
            <span className="text-[10px] text-red-600 font-bold block mt-1">
              Formato: {data.hora}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Red Social</label>
          <select
            disabled={readOnly}
            value={data.redSocial}
            onChange={ch('redSocial')}
            className={cls + ' font-bold'}
          >
            {REDES_SOCIALES.map((rs) => (
              <option key={rs} value={rs}>
                {rs}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Usuario *</label>
          <input
            disabled={readOnly}
            type="text"
            value={data.usuario}
            onChange={ch('usuario')}
            className={cls}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Post *</label>
          <input
            disabled={readOnly}
            type="text"
            value={data.postTitle}
            onChange={ch('postTitle')}
            className={cls}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Área</label>
          <select
            disabled={readOnly}
            value={data.area}
            onChange={ch('area')}
            className={cls + ' font-bold'}
          >
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-end mb-1">
          <label className="block text-xs font-bold">Contexto *</label>
          <span className={`text-[10px] font-bold ${
            (data.contexto || '').length > 400 ? 'text-amber-500' : 'text-slate-400'
          }`}>
            {(data.contexto || '').length}/450
          </span>
        </div>
        <textarea
          disabled={readOnly}
          rows="3"
          maxLength={450}
          value={data.contexto || ''}
          onChange={ch('contexto')}
          className={cls + ' resize-none'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold mb-1">Sentimiento</label>
          <select
            disabled={readOnly}
            value={data.sentimiento}
            onChange={ch('sentimiento')}
            className={cls + ' font-bold'}
          >
            {SENTIMIENTOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">Viralidad</label>
          <select
            disabled={readOnly}
            value={data.viralidad}
            onChange={ch('viralidad')}
            className={cls + ' font-bold'}
          >
            {VIRALIDADES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold mb-1">Enlace</label>
        <input
          disabled={readOnly}
          type="text"
          value={data.enlace}
          onChange={ch('enlace')}
          placeholder="https://..."
          className={cls}
        />
      </div>

      <div className={`grid ${data.redSocial === 'TIKTOK' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} gap-3`}>
        <div>
          <label className="block text-xs font-bold mb-1">❤️ Likes</label>
          <input
            disabled={readOnly}
            type="text"
            value={data.likes}
            onChange={ch('likes')}
            className={cls + ' text-center'}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">💬 Comentarios</label>
          <input
            disabled={readOnly}
            type="text"
            value={data.comments}
            onChange={ch('comments')}
            className={cls + ' text-center'}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1">🔁 Compartidos</label>
          <input
            disabled={readOnly}
            type="text"
            value={data.shares}
            onChange={ch('shares')}
            className={cls + ' text-center'}
          />
        </div>
        {data.redSocial === 'TIKTOK' && (
          <div>
            <label className="block text-xs font-bold mb-1">👁️ Visualizaciones</label>
            <input
              disabled={readOnly}
              type="text"
              value={data.views || '0'}
              onChange={ch('views')}
              className={cls + ' text-center font-bold text-indigo-600'}
            />
          </div>
        )}
      </div>

      {!readOnly && onImageUpload && (
        <div className="space-y-2">
          <label className="block text-xs font-bold mb-1">Subir Foto Evidencia</label>
          <input
            id="foto-evidencia"
            type="file"
            accept="image/jpeg, image/png, image/webp"
            onChange={onImageUpload}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 cursor-pointer"
          />
          {data.evidenceImageSrc && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm max-w-sm">
              <img 
                src={data.evidenceImageSrc} 
                alt="Vista previa" 
                className="w-full h-auto object-contain max-h-48"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
