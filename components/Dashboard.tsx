import React, { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, LineChart, Line, CartesianGrid, Area, AreaChart
} from 'recharts';
import { LetterType, StoredDocument } from '../types';
import {
    Eye, ArrowLeft, Calendar, FileText, AlertTriangle, Download,
    TrendingUp, Users, Clock, MessageSquare, Tag, Activity,
    ThumbsUp, ThumbsDown, Minus, AlertCircle, FileSpreadsheet, FileDown,
    ChevronDown, ChevronUp, Folder, Search, Filter, X, SlidersHorizontal
} from 'lucide-react';
import AnalysisView from './AnalysisView';
import { storageService } from '../services/storageService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
    letterTypes: LetterType[];
    documents: StoredDocument[];
}

const Dashboard: React.FC<DashboardProps> = ({ letterTypes, documents }) => {
    const [viewingDoc, setViewingDoc] = useState<StoredDocument | null>(null);
    const [activeStatTab, setActiveStatTab] = useState<'overview' | 'types' | 'sentiment' | 'timeline' | 'topics'>('overview');

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterUrgency, setFilterUrgency] = useState<string>('all');
    const [filterDateRange, setFilterDateRange] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Filtered Documents
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    doc.analysis.docType?.toLowerCase().includes(query) ||
                    doc.analysis.departmentOrigin?.toLowerCase().includes(query) ||
                    doc.analysis.summary?.toLowerCase().includes(query) ||
                    doc.fullContent?.toLowerCase().includes(query) ||
                    doc.analysis.letterNumber?.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Type filter
            if (filterType !== 'all' && doc.analysis.docType !== filterType) {
                return false;
            }

            // Urgency filter
            if (filterUrgency !== 'all' && doc.analysis.urgency !== filterUrgency) {
                return false;
            }

            // Date range filter
            if (filterDateRange !== 'all') {
                const now = Date.now();
                const docTime = doc.timestamp;
                switch (filterDateRange) {
                    case 'today':
                        const todayStart = new Date();
                        todayStart.setHours(0, 0, 0, 0);
                        if (docTime < todayStart.getTime()) return false;
                        break;
                    case 'week':
                        if (docTime < now - 7 * 24 * 60 * 60 * 1000) return false;
                        break;
                    case 'month':
                        if (docTime < now - 30 * 24 * 60 * 60 * 1000) return false;
                        break;
                }
            }

            return true;
        });
    }, [documents, searchQuery, filterType, filterUrgency, filterDateRange]);

    // Get unique document types for filter
    const uniqueTypes = useMemo(() => {
        const types = new Set(documents.map(d => d.analysis.docType).filter(Boolean));
        return Array.from(types).sort();
    }, [documents]);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setFilterUrgency('all');
        setFilterDateRange('all');
    };

    const hasActiveFilters = searchQuery || filterType !== 'all' || filterUrgency !== 'all' || filterDateRange !== 'all';

    // ========== STATISTICS CALCULATIONS ==========

    // 1. Type Statistics
    const typeStats = useMemo(() => {
        const map: Record<string, number> = {};
        documents.forEach(doc => {
            const type = doc.analysis.docType || "Aniqlanmagan";
            map[type] = (map[type] || 0) + 1;
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value, percent: ((value / documents.length) * 100).toFixed(1) }))
            .sort((a, b) => b.value - a.value);
    }, [documents]);

    // 2. Department Statistics
    const deptStats = useMemo(() => {
        const map: Record<string, { letters: number, errors: number }> = {};
        documents.forEach(doc => {
            const dept = doc.analysis.departmentOrigin || "Boshqa";
            if (!map[dept]) map[dept] = { letters: 0, errors: 0 };
            map[dept].letters += 1;
            map[dept].errors += doc.analysis.grammarErrors.length;
        });
        return Object.entries(map)
            .map(([name, stats]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                fullName: name,
                letters: stats.letters,
                errors: stats.errors
            }))
            .sort((a, b) => b.letters - a.letters);
    }, [documents]);

    // 3. Sentiment Statistics
    const sentimentStats = useMemo(() => {
        const map: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0, Urgent: 0 };
        documents.forEach(doc => {
            const sentiment = doc.analysis.sentiment || 'Neutral';
            map[sentiment] = (map[sentiment] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({
            name,
            value,
            percent: documents.length ? ((value / documents.length) * 100).toFixed(1) : '0'
        }));
    }, [documents]);

    // 4. Urgency Statistics
    const urgencyStats = useMemo(() => {
        const map: Record<string, number> = { Low: 0, Medium: 0, High: 0 };
        documents.forEach(doc => {
            const urgency = doc.analysis.urgency || 'Low';
            map[urgency] = (map[urgency] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({
            name: name === 'Low' ? 'Past' : name === 'Medium' ? "O'rta" : 'Yuqori',
            value,
            percent: documents.length ? ((value / documents.length) * 100).toFixed(1) : '0'
        }));
    }, [documents]);

    // 5. Timeline Statistics (last 30 days)
    const timelineStats = useMemo(() => {
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const dayMap: Record<string, number> = {};

        // Initialize last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const key = date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
            dayMap[key] = 0;
        }

        documents.forEach(doc => {
            if (doc.timestamp >= thirtyDaysAgo) {
                const date = new Date(doc.timestamp);
                const key = date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
                if (dayMap[key] !== undefined) {
                    dayMap[key] += 1;
                }
            }
        });

        return Object.entries(dayMap).map(([date, count]) => ({ date, count }));
    }, [documents]);


    // 7. Summary Stats
    const summaryStats = useMemo(() => {
        const totalErrors = documents.reduce((acc, doc) => acc + doc.analysis.grammarErrors.length, 0);
        const avgScore = documents.length ? Math.round(100 - (totalErrors / documents.length) * 5) : 100;
        const confidentialCount = documents.filter(doc => doc.analysis.confidentialityRisk).length;
        const urgentCount = documents.filter(doc => doc.analysis.urgency === 'High' || doc.analysis.sentiment === 'Urgent').length;

        // Today's count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = documents.filter(doc => doc.timestamp >= today.getTime()).length;

        // This week's count
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weekCount = documents.filter(doc => doc.timestamp >= weekAgo).length;

        return { totalErrors, avgScore, confidentialCount, urgentCount, todayCount, weekCount };
    }, [documents]);

    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [showTypesDropdown, setShowTypesDropdown] = useState(false);

    // Excel Export Function
    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: All Documents
        const docsData = documents.map(d => ({
            "ID": d.id,
            "Sana": new Date(d.timestamp).toLocaleDateString('uz-UZ'),
            "Xat Turi": d.analysis.docType,
            "Bo'linma": d.analysis.departmentOrigin || '-',
            "Muhimlik": d.analysis.urgency === 'High' ? 'Yuqori' : d.analysis.urgency === 'Medium' ? "O'rta" : 'Past',
            "Xatolar Soni": d.analysis.grammarErrors.length,
            "Xulosa": d.analysis.summary?.substring(0, 100) || '-'
        }));
        const wsDocuments = XLSX.utils.json_to_sheet(docsData);
        XLSX.utils.book_append_sheet(wb, wsDocuments, "Barcha Xatlar");

        // Sheet 2: Department Stats
        const deptData = deptStats.map(d => ({
            "Bo'linma": d.fullName,
            "Xatlar Soni": d.letters,
            "Xatolar Soni": d.errors
        }));
        const wsDepts = XLSX.utils.json_to_sheet(deptData);
        XLSX.utils.book_append_sheet(wb, wsDepts, "Bo'limlar");

        // Sheet 3: Type Stats
        const typeData = typeStats.map(t => ({
            "Xat Turi": t.name,
            "Soni": t.value,
            "Foiz": t.percent + '%'
        }));
        const wsTypes = XLSX.utils.json_to_sheet(typeData);
        XLSX.utils.book_append_sheet(wb, wsTypes, "Xat Turlari");

        XLSX.writeFile(wb, `Dashboard_Hisobot_${new Date().toISOString().slice(0, 10)}.xlsx`);
        setShowDownloadMenu(false);
    };

    // PDF Export Function
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(18);
        doc.text("Dashboard Hisoboti", pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, pageWidth / 2, 28, { align: 'center' });

        // Summary Stats
        doc.setFontSize(12);
        doc.text("Umumiy Ko'rsatkichlar:", 14, 40);
        doc.setFontSize(10);
        doc.text(`Jami xatlar: ${documents.length}`, 14, 48);
        doc.text(`Bugun: ${summaryStats.todayCount}`, 14, 54);
        doc.text(`Bu hafta: ${summaryStats.weekCount}`, 14, 60);
        doc.text(`Shoshilinch: ${summaryStats.urgentCount}`, 14, 66);
        doc.text(`Jami xatolar: ${summaryStats.totalErrors}`, 14, 72);

        // Documents Table
        const tableData = documents.slice(0, 50).map(d => [
            new Date(d.timestamp).toLocaleDateString('uz-UZ'),
            d.analysis.docType || '-',
            (d.analysis.departmentOrigin || '-').substring(0, 20),
            d.analysis.urgency === 'High' ? 'Yuqori' : d.analysis.urgency === 'Medium' ? "O'rta" : 'Past',
            d.analysis.grammarErrors.length.toString()
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Sana', 'Xat Turi', "Bo'linma", 'Muhimlik', 'Xatolar']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] }
        });

        doc.save(`Dashboard_Hisobot_${new Date().toISOString().slice(0, 10)}.pdf`);
        setShowDownloadMenu(false);
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    const SENTIMENT_COLORS: Record<string, string> = {
        Positive: '#10b981',
        Neutral: '#6b7280',
        Negative: '#ef4444',
        Urgent: '#f59e0b'
    };
    const URGENCY_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    // --- Detail View Mode ---
    if (viewingDoc) {
        return (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setViewingDoc(null)}
                        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-medium transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Dashboardga qaytish
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
                                <FileText className="text-blue-500" />
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

    // --- Dashboard View Mode ---
    return (
        <div className="space-y-6">
            {/* Header with Download Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Statistika va Tahlil</h2>
                    <p className="text-slate-500 text-sm">Barcha xatlar bo'yicha umumiy ko'rsatkichlar</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors font-medium"
                    >
                        <Download size={18} />
                        Yuklab olish
                    </button>
                    {showDownloadMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-10">
                            <button
                                onClick={handleExportExcel}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <FileSpreadsheet size={18} className="text-green-600" />
                                Excel (.xlsx)
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <FileDown size={18} className="text-red-600" />
                                PDF (.pdf)
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
                    <FileText className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-blue-100 text-xs font-medium">Jami xatlar</p>
                    <h4 className="text-2xl font-bold">{documents.length}</h4>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg">
                    <Activity className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-emerald-100 text-xs font-medium">Bugun</p>
                    <h4 className="text-2xl font-bold">{summaryStats.todayCount}</h4>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white p-4 rounded-xl shadow-lg">
                    <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-violet-100 text-xs font-medium">Bu hafta</p>
                    <h4 className="text-2xl font-bold">{summaryStats.weekCount}</h4>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-xl shadow-lg">
                    <AlertTriangle className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-amber-100 text-xs font-medium">Shoshilinch</p>
                    <h4 className="text-2xl font-bold">{summaryStats.urgentCount}</h4>
                </div>
                <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-4 rounded-xl shadow-lg">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-rose-100 text-xs font-medium">Xatolar</p>
                    <h4 className="text-2xl font-bold">{summaryStats.totalErrors}</h4>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white p-4 rounded-xl shadow-lg">
                    <Users className="w-8 h-8 mb-2 opacity-80" />
                    <p className="text-cyan-100 text-xs font-medium">Bo'limlar</p>
                    <h4 className="text-2xl font-bold">{deptStats.length}</h4>
                </div>
            </div>

            {/* Statistics Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Umumiy', icon: Activity },
                        { id: 'types', label: 'Xat turlari', icon: Tag },
                        { id: 'timeline', label: 'Dinamika', icon: TrendingUp },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveStatTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors
                                ${activeStatTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {documents.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <FileText className="w-16 h-16 mx-auto mb-3 opacity-30" />
                            <p>Statistika ko'rish uchun avval xatlarni tahlil qiling.</p>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeStatTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Types Dropdown - Professional */}
                                    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 overflow-hidden">
                                        <button
                                            onClick={() => setShowTypesDropdown(!showTypesDropdown)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                                    <Folder className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-semibold text-slate-800">Xat turlari taqsimoti</h4>
                                                    <p className="text-sm text-slate-500">{typeStats.length} xil tur, jami {documents.length} ta xat</p>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition-transform duration-200 ${showTypesDropdown ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-5 h-5 text-slate-600" />
                                            </div>
                                        </button>

                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showTypesDropdown ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="border-t border-slate-100 max-h-[350px] overflow-y-auto">
                                                {typeStats.map((type, idx) => (
                                                    <div
                                                        key={type.name}
                                                        className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/50 transition-colors border-b border-slate-50 last:border-b-0"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div
                                                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                            />
                                                            <span className="text-sm text-slate-700 truncate" title={type.name}>
                                                                {type.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                            <span className="text-sm font-bold text-slate-800">{type.value}</span>
                                                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                                {type.percent}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {typeStats.length === 0 && (
                                                <div className="p-6 text-center text-slate-400 text-sm">
                                                    Ma'lumot topilmadi
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bar Chart - Departments */}
                                    <div>
                                        <h4 className="font-semibold text-slate-700 mb-4">Bo'limlar faolligi</h4>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={deptStats.slice(0, 5)} layout="vertical">
                                                    <XAxis type="number" />
                                                    <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                                                    <Tooltip
                                                        formatter={(value: number) => [`${value} ta`, 'Xatlar']}
                                                        labelFormatter={(label) => deptStats.find(d => d.name === label)?.fullName || label}
                                                    />
                                                    <Bar dataKey="letters" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Types Tab */}
                            {activeStatTab === 'types' && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-4">Xat turlari bo'yicha batafsil statistika</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {typeStats.map((type, idx) => (
                                            <div key={type.name} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full"
                                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-slate-800 truncate" title={type.name}>
                                                            {type.name}
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            {type.value} ta xat ({type.percent}%)
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${type.percent}%`,
                                                            backgroundColor: COLORS[idx % COLORS.length]
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Timeline Tab */}
                            {activeStatTab === 'timeline' && (
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-4">So'nggi 30 kun dinamikasi</h4>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={timelineStats}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                <XAxis dataKey="date" fontSize={11} tick={{ fill: '#64748b' }} />
                                                <YAxis fontSize={11} tick={{ fill: '#64748b' }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: number) => [`${value} ta xat`, 'Soni']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorCount)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                        </>
                    )}
                </div>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header with Search */}
                <div className="p-4 border-b border-slate-100">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Xatlar ro'yxati</h3>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:min-w-[300px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Qidirish (tur, bo'linma, mazmun...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            {/* Filter Toggle Button */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors text-sm font-medium
                                    ${showFilters || hasActiveFilters
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                            >
                                <SlidersHorizontal size={18} />
                                Filterlar
                                {hasActiveFilters && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Type Filter */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Xat turi</label>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="all">Barchasi</option>
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Urgency Filter */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Muhimlik</label>
                                <select
                                    value={filterUrgency}
                                    onChange={(e) => setFilterUrgency(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="all">Barchasi</option>
                                    <option value="High">Yuqori</option>
                                    <option value="Medium">O'rta</option>
                                    <option value="Low">Past</option>
                                </select>
                            </div>
                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Vaqt oralig'i</label>
                                <select
                                    value={filterDateRange}
                                    onChange={(e) => setFilterDateRange(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                >
                                    <option value="all">Barchasi</option>
                                    <option value="today">Bugun</option>
                                    <option value="week">So'nggi 7 kun</option>
                                    <option value="month">So'nggi 30 kun</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Active Filters & Results Count */}
                    {hasActiveFilters && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">Natija:</span>
                                <span className="font-semibold text-slate-800">{filteredDocuments.length} ta xat</span>
                                {filteredDocuments.length !== documents.length && (
                                    <span className="text-slate-400">({documents.length} tadan)</span>
                                )}
                            </div>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                            >
                                <X size={14} />
                                Tozalash
                            </button>
                        </div>
                    )}
                </div>

                {/* Documents Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3">Sana</th>
                                <th className="px-6 py-3">Xat Turi</th>
                                <th className="px-6 py-3">Bo'linma</th>
                                <th className="px-6 py-3">Muhimlik</th>
                                <th className="px-6 py-3">Xatolar</th>
                                <th className="px-6 py-3 text-right">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={40} className="text-slate-300" />
                                            <p className="text-slate-400 italic">
                                                {hasActiveFilters ? 'Qidiruv natijasi topilmadi' : 'Hozircha hech qanday xat yo\'q'}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    Filterlarni tozalash
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDocuments.slice(0, 20).map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
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
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium
                                                ${doc.analysis.urgency === 'High' ? 'text-red-600 bg-red-50' :
                                                  doc.analysis.urgency === 'Medium' ? 'text-orange-600 bg-orange-50' :
                                                  'text-green-600 bg-green-50'}`}>
                                                {doc.analysis.urgency === 'High' ? 'Yuqori' :
                                                 doc.analysis.urgency === 'Medium' ? "O'rta" : 'Past'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
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

                {/* Show more indicator */}
                {filteredDocuments.length > 20 && (
                    <div className="p-4 text-center border-t border-slate-100">
                        <span className="text-sm text-slate-500">
                            {filteredDocuments.length - 20} ta qo'shimcha xat mavjud
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
