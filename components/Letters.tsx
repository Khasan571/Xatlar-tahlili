import React, { useState } from 'react';
import { StoredDocument } from '../types';
import AnalysisView from './AnalysisView';
import { Eye, X, FileText, Calendar, Building, Hash, Search, Filter } from 'lucide-react';

interface LettersProps {
  documents: StoredDocument[];
}

const Letters: React.FC<LettersProps> = ({ documents }) => {
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter documents based on search
  const filteredDocs = documents.filter(doc => {
    const term = searchTerm.toLowerCase();
    return (
      (doc.analysis.letterNumber && doc.analysis.letterNumber.toLowerCase().includes(term)) ||
      doc.analysis.docType.toLowerCase().includes(term) ||
      doc.analysis.departmentOrigin.toLowerCase().includes(term) ||
      doc.analysis.summary.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      
      {/* Search and Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <FileText className="text-blue-600" />
             Barcha Xatlar Ro'yxati
           </h2>
           <p className="text-slate-500 text-sm">Jami {documents.length} ta hujjat saqlangan</p>
        </div>
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Xat raqami, turi yoki bo'linma bo'yicha izlash..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-3 w-16 text-center">#</th>
                        <th className="px-6 py-3">Xat Raqami</th>
                        <th className="px-6 py-3">Xat Sanasi</th>
                        <th className="px-6 py-3">Mas'ul Bo'linma</th>
                        <th className="px-6 py-3">Xat Turi</th>
                        <th className="px-6 py-3 text-right">Amallar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredDocs.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center justify-center">
                                    <Filter size={48} className="mb-2 opacity-20" />
                                    <p>Ma'lumot topilmadi</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        filteredDocs.map((doc, index) => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 text-center text-slate-400">{index + 1}</td>
                                <td className="px-6 py-4 font-semibold text-slate-800">
                                    <div className="flex items-center gap-2">
                                        <Hash size={14} className="text-blue-400" />
                                        {doc.analysis.letterNumber || <span className="text-slate-400 text-xs italic">Mavjud emas</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {doc.analysis.letterDate || <span className="text-slate-400 text-xs italic">--.--.----</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Building size={14} className="text-slate-400" />
                                        <span className="truncate max-w-[200px]" title={doc.analysis.departmentOrigin}>{doc.analysis.departmentOrigin}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                                        {doc.analysis.docType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setViewingDoc(doc)}
                                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ml-auto text-xs font-medium"
                                    >
                                        <Eye size={14} /> Tahlilni Ko'rish
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal for Viewing Analysis */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Xat Tahlili Natijasi
                        </h3>
                        <p className="text-xs text-slate-500 flex gap-2 mt-1">
                           <span>ID: {viewingDoc.id.slice(0, 8)}...</span>
                           <span>•</span>
                           <span>Tizimga kiritildi: {new Date(viewingDoc.timestamp).toLocaleString('uz-UZ')}</span>
                        </p>
                    </div>
                    <button 
                        onClick={() => setViewingDoc(null)}
                        className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 overflow-y-auto">
                    <AnalysisView result={viewingDoc.analysis} isLoading={false} />
                    
                    <div className="mt-8 pt-6 border-t border-slate-200">
                         <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                             <FileText size={18} /> Asl Matn / Fayl Mazmuni
                         </h4>
                         <div className="bg-white p-4 rounded-lg text-sm text-slate-600 font-mono border border-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto shadow-inner">
                             {viewingDoc.fullContent}
                         </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-end">
                    <button 
                        onClick={() => setViewingDoc(null)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Yopish
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Letters;