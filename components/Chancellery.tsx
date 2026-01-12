import React, { useEffect, useState } from 'react';
import { HierarchyNode } from '../types';
import { classifyDepartment, DepartmentAssignment } from '../services/geminiService';
import { UploadCloud, FileSearch, ShieldCheck, AlertTriangle, Building2, X, Star } from 'lucide-react';

interface Props {
  hierarchy: HierarchyNode[];
}

interface Result {
  assignments: DepartmentAssignment[];
  reason: string;
}

const Chancellery: React.FC<Props> = ({ hierarchy }) => {
  const [file, setFile] = useState<File | null>(null);
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setPreviewUrl(null);
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.type === 'application/pdf' || f.type.startsWith('image/') || f.type === 'text/plain') {
        setFile(f);
        setResult(null);
        setError(null);
        setMode('file');
      } else {
        setError("Faqat PDF, rasm yoki matn fayllar qabul qilinadi.");
      }
    }
  };

  const clearAll = () => {
    setFile(null);
    setInputText('');
    setResult(null);
    setError(null);
    setShowPreview(false);
  };

  const handleAnalyze = async () => {
    const content = mode === 'file' ? file : inputText.trim();
    if (!content) {
      setError("Avval PDF/rasm yuklang yoki matn kiriting.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await classifyDepartment(content, hierarchy);
      const sanitized = {
        assignments: (res.assignments || []).map((a) => ({
          ...a,
          confidence: typeof a.confidence === 'string' ? Number(a.confidence) : a.confidence
        })),
        reason: res.reason
      };
      setResult(sanitized);
    } catch (err) {
      console.error(err);
      setError("AI xizmati bilan bog'lanib bo'lmadi. Keyinroq urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upload */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Devonxona — Hujjatni aniqlash</h3>
            <p className="text-slate-500 text-sm">PDF yuklang yoki matn kiriting</p>
          </div>
          {(file || inputText) && (
            <button
              onClick={clearAll}
              className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1 hover:bg-red-100 hover:text-red-700"
            >
              Tozalash
            </button>
          )}
        </div>

        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setMode('file')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'file' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}
          >
            Fayl (PDF)
          </button>
          <button
            onClick={() => setMode('text')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'text' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}
          >
            Matn
          </button>
        </div>

        {mode === 'file' ? (
          <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center text-center min-h-[220px] relative">
            {!file ? (
              <>
                <UploadCloud size={48} className="text-blue-400 mb-3" />
                <p className="text-slate-600 font-medium mb-2">PDF yoki rasm yuklang</p>
                <label
                  htmlFor="chancellery-upload"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Fayl tanlash
                </label>
                <input
                  id="chancellery-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,application/pdf,text/plain,image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-slate-400 mt-2">PDF, rasm yoki matn fayl</p>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileSearch size={40} className="text-blue-500" />
                <p className="text-slate-700 font-semibold">{file.name}</p>
                <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                <div className="flex items-center gap-3 mt-2">
                  {previewUrl && (
                    <button
                      onClick={() => setShowPreview(true)}
                      className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 hover:bg-blue-100 transition"
                    >
                      Ko'rish
                    </button>
                  )}
                  <button
                    onClick={() => { setFile(null); setShowPreview(false); }}
                    className="text-xs text-red-500 hover:underline"
                  >
                    O'chirish
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Hujjat matnini shu yerga kiriting..."
            className="w-full min-h-[220px] border border-slate-200 rounded-lg p-4 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        )}

        <button
          onClick={handleAnalyze}
          disabled={isLoading || (mode === 'file' ? !file : !inputText.trim())}
          className={`w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md
            ${isLoading || (mode === 'file' ? !file : !inputText.trim()) ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'}`}
        >
          {isLoading ? "Aniqlanmoqda..." : "Bo'linmani aniqlash"}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[260px]">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="text-blue-500" />
            <h3 className="text-lg font-semibold text-slate-800">Masʼul bo'linmalar</h3>
        </div>

        {!result && !error && (
          <div className="h-full min-h-[180px] flex items-center justify-center text-slate-400 text-sm">
            Tahlil qilish uchun fayl yuklang
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
              {result.assignments.map((item, idx) => {
                const confValue = Number(item.confidence);
                const conf =
                  Number.isFinite(confValue) ? `${Math.round(confValue)}%` : '—';
                return (
                <div key={idx} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {item.role === 'primary' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          <Star size={12} />
                          Asosiy ijrochi
                        </span>
                      )}
                      {item.role === 'secondary' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          Qo'shimcha
                        </span>
                      )}
                    </div>
                    <p className="text-base font-bold text-slate-800 mt-1">{item.department || "Aniqlanmadi"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <ShieldCheck size={18} />
                    {conf}
                  </div>
                </div>
              )})}
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
              <p className="font-semibold mb-1">Izoh:</p>
              <p>{result.reason}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
      </div>

      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden relative">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2"
            >
              <X size={18} />
            </button>
            <div className="p-4 h-[80vh]">
              {file?.type === 'application/pdf' ? (
                <iframe
                  src={previewUrl}
                  title="PDF preview"
                  className="w-full h-full border border-slate-200 rounded-lg"
                />
              ) : file?.type?.startsWith('image/') ? (
                <img
                  src={previewUrl}
                  alt="Fayl old ko'rinishi"
                  className="max-h-full max-w-full object-contain mx-auto"
                />
              ) : (
                <p className="text-sm text-slate-600">Old ko'rinish mavjud emas</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chancellery;

