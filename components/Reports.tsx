import React, { useMemo, useState } from 'react';
import { StoredDocument } from '../types';
import * as XLSX from 'xlsx';
import { Download, FileBarChart, Filter, Calendar, Eye, ArrowLeft } from 'lucide-react';
import AnalysisView from './AnalysisView';
import { storageService } from '../services/storageService';

interface ReportsProps {
  documents: StoredDocument[];
}

interface DeptStats {
  deptName: string;
  totalLetters: number;
  grammarErrors: number;
  urgencyHigh: number;
  lastActive: number;
  typesBreakdown: Record<string, number>;
}

const Reports: React.FC<ReportsProps> = ({ documents }) => {
  const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);

  // Calculate Statistics
  const stats: DeptStats[] = useMemo(() => {
    const map: Record<string, DeptStats> = {};

    documents.forEach(doc => {
      const dept = doc.analysis.departmentOrigin || "Aniqlanmagan";
      const type = doc.analysis.docType || "Boshqa";

      if (!map[dept]) {
        map[dept] = {
          deptName: dept,
          totalLetters: 0,
          grammarErrors: 0,
          urgencyHigh: 0,
          lastActive: 0,
          typesBreakdown: {}
        };
      }

      const entry = map[dept];
      entry.totalLetters += 1;
      entry.grammarErrors += doc.analysis.grammarErrors.length;
      if (doc.analysis.urgency === 'High') entry.urgencyHigh += 1;
      if (doc.timestamp > entry.lastActive) entry.lastActive = doc.timestamp;

      entry.typesBreakdown[type] = (entry.typesBreakdown[type] || 0) + 1;
    });

    return Object.values(map).sort((a, b) => b.totalLetters - a.totalLetters);
  }, [documents]);

  // Excel Export Function
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: General Summary
    const summaryData = stats.map(s => ({
      "Bo'linma nomi": s.deptName,
      "Jami Xatlar": s.totalLetters,
      "Yuqori Muhimlik": s.urgencyHigh,
      "Jami Grammatik Xatolar": s.grammarErrors,
      "O'rtacha Xatolar": (s.totalLetters > 0 ? s.grammarErrors / s.totalLetters : 0).toFixed(1),
      "So'nggi Faollik": new Date(s.lastActive).toLocaleDateString('uz-UZ')
    }));
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Umumiy Hisobot");

    // Sheet 2: Breakdown by Type
    const typeData: any[] = [];
    stats.forEach(s => {
      Object.entries(s.typesBreakdown).forEach(([type, count]) => {
        typeData.push({
          "Bo'linma": s.deptName,
          "Xat Turi": type,
          "Soni": count
        });
      });
    });
    const wsTypes = XLSX.utils.json_to_sheet(typeData);
    XLSX.utils.book_append_sheet(wb, wsTypes, "Turlar Kesimida");

    // Sheet 3: All Documents Log
    const allDocsData = documents.map(d => ({
        "ID": d.id,
        "Kiritilgan Sana": new Date(d.timestamp).toLocaleDateString('uz-UZ'),
        "Xat Raqami": d.analysis.letterNumber || "",
        "Xat Sanasi": d.analysis.letterDate || "",
        "Bo'linma": d.analysis.departmentOrigin,
        "Xat Turi": d.analysis.docType,
        "Muhimlik": d.analysis.urgency,
        "Xatolar Soni": d.analysis.grammarErrors.length,
        "Maxfiylik": d.analysis.confidentialityRisk ? "Bor" : "Yo'q"
    }));
    const wsLog = XLSX.utils.json_to_sheet(allDocsData);
    XLSX.utils.book_append_sheet(wb, wsLog, "Barcha Xatlar");

    // Save File
    XLSX.writeFile(wb, `Vazirlik_Hisobot_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Detail View Mode
  if (viewingDoc) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setViewingDoc(null)}
            className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            Hisobotlarga qaytish
          </button>
          <button
            onClick={() => storageService.downloadDocument(viewingDoc)}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors shadow-sm"
          >
            <Download size={18} />
            Yuklab olish
          </button>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileBarChart className="text-blue-500" />
                {viewingDoc.analysis.docType}
              </h2>
              <div className="flex gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(viewingDoc.timestamp).toLocaleString('uz-UZ')}
                </span>
                {viewingDoc.fileName && (
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {viewingDoc.fileName}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase
                ${viewingDoc.analysis.urgency === 'High' ? 'bg-red-100 text-red-700' :
                  viewingDoc.analysis.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {viewingDoc.analysis.urgency === 'High' ? 'Yuqori Muhimlik' : viewingDoc.analysis.urgency === 'Medium' ? "O'rta" : 'Oddiy'}
              </div>
            </div>
          </div>
          <AnalysisView result={viewingDoc.analysis} isLoading={false} />
          <div className="mt-8 pt-4 border-t border-slate-100">
            <h4 className="font-semibold text-slate-700 mb-2">Asl Matn / Fayl Mazmuni:</h4>
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 font-mono overflow-auto max-h-96 border border-slate-200 whitespace-pre-wrap">
              {viewingDoc.fullContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <FileBarChart className="text-blue-600" />
             Bo'linmalar Faoliyati Hisoboti
           </h2>
           <p className="text-slate-500 text-sm mt-1">
             Vazirlikning barcha bo'linmalari bo'yicha kiruvchi va chiquvchi xatlar tahlili
           </p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors font-medium"
        >
          <Download size={18} />
          Excel Yuklab Olish (.xlsx)
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400">
             <Filter size={48} className="mx-auto mb-4 opacity-20" />
             <p>Hisobot shakllantirish uchun tizimga hujjatlar kiritilmagan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
           
           {/* Main Summary Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Umumiy Ko'rsatkichlar</h3>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-3">Bo'linma Nomi</th>
                     <th className="px-6 py-3 text-center">Jami Xatlar</th>
                     <th className="px-6 py-3 text-center">Xat Turlari</th>
                     <th className="px-6 py-3 text-center">Yuqori Muhimlik</th>
                     <th className="px-6 py-3 text-center">O'rtacha Xato</th>
                     <th className="px-6 py-3 text-right">So'nggi Faollik</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {stats.map((dept, idx) => (
                     <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                       <td className="px-6 py-4 font-medium text-slate-800">{dept.deptName}</td>
                       <td className="px-6 py-4 text-center">
                         <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                           {dept.totalLetters}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-center text-slate-500">
                         {Object.keys(dept.typesBreakdown).length} xil
                       </td>
                       <td className="px-6 py-4 text-center">
                          {dept.urgencyHigh > 0 ? (
                            <span className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">{dept.urgencyHigh} ta</span>
                          ) : <span className="text-slate-400">-</span>}
                       </td>
                       <td className="px-6 py-4 text-center">
                          <span className={`${(dept.totalLetters > 0 ? dept.grammarErrors/dept.totalLetters : 0) > 5 ? 'text-red-500' : 'text-green-600'}`}>
                             {(dept.totalLetters > 0 ? dept.grammarErrors / dept.totalLetters : 0).toFixed(1)}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right text-slate-500 flex items-center justify-end gap-2">
                          <Calendar size={14} />
                          {new Date(dept.lastActive).toLocaleDateString('uz-UZ')}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>

           {/* Detailed Breakdown Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.slice(0, 4).map((dept, idx) => (
                 <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">{dept.deptName}</h4>
                    <div className="space-y-2">
                        {Object.entries(dept.typesBreakdown)
                           .sort((a, b) => b[1] - a[1])
                           .slice(0, 5) // Show top 5 types
                           .map(([type, count]) => (
                            <div key={type} className="flex justify-between items-center text-sm">
                                <span className="text-slate-600 truncate max-w-[70%]">{type}</span>
                                <div className="flex items-center gap-2">
                                   <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-500 rounded-full"
                                        style={{ width: `${dept.totalLetters > 0 ? (count / dept.totalLetters) * 100 : 0}%` }}
                                      />
                                   </div>
                                   <span className="text-xs font-bold text-slate-700 w-4 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>
              ))}
           </div>

           {/* All Documents Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">Barcha Hujjatlar</h3>
                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                  {documents.length} ta
                </span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                   <tr>
                     <th className="px-6 py-3">Sana</th>
                     <th className="px-6 py-3">Xat Turi</th>
                     <th className="px-6 py-3">Bo'linma</th>
                     <th className="px-6 py-3 text-center">Muhimlik</th>
                     <th className="px-6 py-3 text-center">Xatolar</th>
                     <th className="px-6 py-3 text-right">Amallar</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {documents.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                         Hozircha hech qanday hujjat yo'q.
                       </td>
                     </tr>
                   ) : (
                     documents.slice(0, 20).map((doc) => (
                       <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors">
                         <td className="px-6 py-4 whitespace-nowrap">
                           {new Date(doc.timestamp).toLocaleDateString('uz-UZ', {
                             month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                           })}
                         </td>
                         <td className="px-6 py-4 font-medium text-slate-800">
                           {doc.analysis.docType}
                         </td>
                         <td className="px-6 py-4 truncate max-w-[150px]" title={doc.analysis.departmentOrigin}>
                           {doc.analysis.departmentOrigin || '-'}
                         </td>
                         <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded text-xs font-medium
                             ${doc.analysis.urgency === 'High' ? 'text-red-600 bg-red-50' :
                               doc.analysis.urgency === 'Medium' ? 'text-orange-600 bg-orange-50' :
                               'text-green-600 bg-green-50'}`}>
                             {doc.analysis.urgency === 'High' ? 'Yuqori' :
                              doc.analysis.urgency === 'Medium' ? "O'rta" : 'Past'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-1 rounded-full text-xs font-bold
                             ${doc.analysis.grammarErrors.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                             {doc.analysis.grammarErrors.length}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => setViewingDoc(doc)}
                             className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                             title="Ko'rish"
                           >
                             <Eye size={18} />
                           </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>

        </div>
      )}
    </div>
  );
};

export default Reports;
