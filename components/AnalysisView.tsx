import React from 'react';
import { AnalysisResult, GrammarError } from '../types';
import { CheckCircle, AlertTriangle, FileText, Activity, ShieldAlert, User, Calendar, Hash } from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 animate-pulse">Hujjat tahlil qilinmoqda...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
        <FileText size={48} className="mb-4" />
        <p>Tahlil qilish uchun hujjat yuklang yoki matn kiriting</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Document Info Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
           <div className="mb-3">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <FileText size={16} />
                <span className="text-xs font-medium uppercase">Hujjat Turi</span>
              </div>
              <p className="text-lg font-bold text-slate-800 leading-tight">{result.docType}</p>
              <span className="text-xs text-green-600 font-medium">Ishonch: {result.docTypeConfidence}%</span>
           </div>

           <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <div className="flex items-center gap-2">
                 <Hash size={16} className="text-blue-400" />
                 <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Raqam</span>
                    <span className="text-sm font-semibold text-slate-700">{result.letterNumber || "—"}</span>
                 </div>
              </div>
              <div className="flex items-center gap-2 text-right">
                 <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Sana</span>
                    <span className="text-sm font-semibold text-slate-700">{result.letterDate || "—"}</span>
                 </div>
                 <Calendar size={16} className="text-blue-400" />
              </div>
           </div>
        </div>

        {/* Origin & Status Card */}
        <div className="space-y-3">
           <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                 <span className="text-xs text-slate-400 block uppercase">Ijrochi Bo'linma</span>
                 <p className="text-sm font-bold text-slate-800 truncate" title={result.departmentOrigin}>
                   {result.departmentOrigin || "Aniqlanmadi"}
                 </p>
              </div>
           </div>

           <div className="flex gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase mb-1">Muhimlik</span>
                  <div className={`px-2 py-0.5 rounded text-xs font-bold
                    ${result.urgency === 'High' ? 'bg-red-100 text-red-700' : 
                      result.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {result.urgency === 'High' ? 'YUQORI' : result.urgency === 'Medium' ? "O'RTA" : 'PAST'}
                  </div>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 uppercase mb-1">Maxfiylik</span>
                  <span className={`text-xs font-bold flex items-center gap-1 ${result.confidentialityRisk ? 'text-red-600' : 'text-green-600'}`}>
                    <ShieldAlert size={12} />
                    {result.confidentialityRisk ? "XAVF" : "XAVFSIZ"}
                  </span>
              </div>
           </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="text-blue-900 font-semibold mb-2 flex items-center gap-2">
          <Activity size={18} />
          AI Xulosasi
        </h3>
        <p className="text-blue-800 leading-relaxed">{result.summary}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
            {result.keyEntities.map((entity, idx) => (
                <span key={idx} className="px-2 py-1 bg-white/60 text-blue-700 text-xs rounded-md border border-blue-200">
                    {entity}
                </span>
            ))}
        </div>
      </div>

      {/* Grammar & Spelling */}
      <div>
        <h3 className="text-slate-800 font-semibold mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-slate-400" />
          Aniqlangan Xatolar va Tavsiyalar
          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
            {result.grammarErrors.length}
          </span>
        </h3>
        
        {result.grammarErrors.length === 0 ? (
          <div className="bg-green-50 p-4 rounded-lg text-green-700 border border-green-200 flex items-center gap-2">
            <CheckCircle size={18} /> Xatolar topilmadi. Hujjat toza.
          </div>
        ) : (
          <div className="space-y-3">
            {result.grammarErrors.map((error, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 border-l-4 border-l-red-400">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1 block">
                      {error.type}
                    </span>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="line-through text-slate-400 bg-slate-50 px-1 rounded">{error.original}</span>
                       <span className="text-slate-400">→</span>
                       <span className="text-green-600 font-semibold bg-green-50 px-1 rounded">{error.suggestion}</span>
                    </div>
                    <p className="text-sm text-slate-600">{error.explanation}</p>
                  </div>
                  <button className="text-slate-300 hover:text-slate-500">
                    <AlertTriangle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisView;
