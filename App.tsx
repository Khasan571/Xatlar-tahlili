import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileSearch, 
  Settings as SettingsIcon, 
  Menu, 
  UploadCloud,
  X,
  Building,
  FileBarChart,
  Mail,
  Inbox,
  LogOut,
  User
} from 'lucide-react';

import { HierarchyNode, LetterType, AnalysisResult, StoredDocument } from './types';
import Login from './components/Login';
import { authService } from './services/authService';

import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Letters from './components/Letters';
import AnalysisView from './components/AnalysisView';
import Chancellery from './components/Chancellery';
import { analyzeText, correctText } from './services/localAnalyzer';
import { storageService } from './services/storageService';
import { documentApi } from './services/documentApi';
import { makeId } from './services/id';
import { letterTypeApi } from './services/letterTypeApi';
import { hierarchyApi } from './services/hierarchyApi';

enum Tab {
  DASHBOARD = 'DASHBOARD',
  LETTERS = 'LETTERS',
  ANALYZER = 'ANALYZER',
  CHANCELLERY = 'CHANCELLERY',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS'
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(() => authService.getUser());

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data State - Initialize from Storage
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>(() => storageService.getHierarchy());
  const [letterTypes, setLetterTypes] = useState<LetterType[]>(() => storageService.getLetterTypes());
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(true);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentUser(authService.getUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // Hierarchy load/save
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingHierarchy(false);
      return;
    }
    (async () => {
      try {
        const data = await hierarchyApi.get();
        if (Array.isArray(data) && data.length) {
          setHierarchy(data);
        } else {
          setHierarchy(storageService.getHierarchy());
        }
      } catch (err) {
        console.error(err);
        setHierarchy(storageService.getHierarchy());
      } finally {
        setIsLoadingHierarchy(false);
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoadingHierarchy || !isAuthenticated) return;
    storageService.saveHierarchy(hierarchy);
    hierarchyApi.save(hierarchy).catch((err) => {
      console.error('Failed to save hierarchy', err);
    });
  }, [hierarchy, isLoadingHierarchy, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingTypes(false);
      return;
    }
    (async () => {
      try {
        const types = await letterTypeApi.list();
        if (Array.isArray(types) && types.length) {
          setLetterTypes(types);
        } else {
          // fallback to local if empty
          setLetterTypes(storageService.getLetterTypes());
        }
      } catch (err) {
        console.error(err);
        setLetterTypes(storageService.getLetterTypes());
      } finally {
        setIsLoadingTypes(false);
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoadingTypes || !isAuthenticated) return;
    // save to local for offline
    storageService.saveLetterTypes(letterTypes);
    // push to API
    letterTypeApi.saveAll(letterTypes).catch((err) => {
      console.error('Failed to save letter types', err);
    });
  }, [letterTypes, isLoadingTypes, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoadingDocs(false);
      return;
    }
    (async () => {
      try {
        const docs = await documentApi.getAll();
        setDocuments(docs);
      } catch (err) {
        console.error(err);
        setDocumentsError("Serverdan hujjatlar yuklab bo'lmadi.");
      } finally {
        setIsLoadingDocs(false);
      }
    })();
  }, [isAuthenticated]);
  
  // Analysis State
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to flatten hierarchy for dropdown
  const flatDepartments = useMemo(() => {
    const flatten = (nodes: HierarchyNode[], prefix = ''): {id: string, name: string}[] => {
      let list: {id: string, name: string}[] = [];
      nodes.forEach(node => {
        list.push({ id: node.id, name: prefix + node.name });
        if (node.children) {
          list = [...list, ...flatten(node.children, prefix + '- ')];
        }
      });
      return list;
    };
    return flatten(hierarchy);
  }, [hierarchy]);

  // Fayl tarkibini o'qish (txt, pdf uchun matn)
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type === 'text/plain') {
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
        reader.readAsText(file, 'UTF-8');
      } else if (file.type === 'application/pdf') {
        // PDF uchun oddiy xabar (haqiqiy PDF parsing uchun pdf.js kerak)
        resolve(`[PDF fayl: ${file.name}]\n\nPDF fayllar hozircha to'liq qo'llab-quvvatlanmaydi. Iltimos, matnni qo'lda kiriting yoki .txt formatda yuklang.`);
      } else {
        reject(new Error("Faqat .txt va .pdf fayllar qo'llab-quvvatlanadi"));
      }
    });
  };

  const handleAnalysis = async () => {
    if (!inputText && !selectedFile) {
      setError("Iltimos, matn kiriting yoki fayl yuklang.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let textContent = inputText;

      // Agar fayl tanlangan bo'lsa, uni o'qish
      if (selectedFile) {
        textContent = await readFileContent(selectedFile);
      }

      // Mahalliy tahlilchi bilan tahlil qilish
      const result = analyzeText(textContent);
      setAnalysisResult(result);

      // Create stored document
      const newDoc: StoredDocument = {
        id: makeId(),
        timestamp: Date.now(),
        fileName: selectedFile?.name,
        contentSnippet: textContent.slice(0, 150) + (textContent.length > 150 ? '...' : ''),
        fullContent: textContent,
        analysis: result
      };

      // Saqlash backendga
      const savedDoc = await documentApi.create(newDoc);
      setDocuments(prev => [savedDoc, ...prev]);

    } catch (err: any) {
      console.error(err);
      setError("Xatolik yuz berdi: Faylni o'qib bo'lmadi yoki matn formati noto'g'ri.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain') {
        setSelectedFile(file);
        setInputText(''); // Clear text if file selected
        setInputMode('file');
        setError(null);
      } else {
        setError("Faqat PDF, Rasm yoki Text fayllar qabul qilinadi.");
      }
    }
  };

  const clearInputs = () => {
    setInputText('');
    setSelectedFile(null);
    setInputMode('text');
    setSelectedDeptId('');
    setAnalysisResult(null);
    setError(null);
  };

  // Authentication check - must be after all hooks
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-blue-900 text-white transition-all duration-300 ease-in-out flex flex-col fixed h-full z-20`}
      >
        <div className="p-4 flex items-center justify-between border-b border-blue-800">
           <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-900 font-bold text-xl">
               X
             </div>
             {sidebarOpen && <span className="font-bold text-lg tracking-wide">Xatlar tahlili</span>}
           </div>
        </div>

        <nav className="flex-1 py-6 space-y-2 px-2">
          <button 
            onClick={() => setActiveTab(Tab.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === Tab.DASHBOARD ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
          >
            <LayoutDashboard size={22} className="min-w-[22px]" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button 
            onClick={() => setActiveTab(Tab.LETTERS)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === Tab.LETTERS ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
          >
            <Mail size={22} className="min-w-[22px]" />
            {sidebarOpen && <span>Xatlar</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab(Tab.ANALYZER)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === Tab.ANALYZER ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
          >
            <FileSearch size={22} className="min-w-[22px]" />
            {sidebarOpen && <span>Hujjat Tahlili</span>}
          </button>

          <button 
            onClick={() => setActiveTab(Tab.REPORTS)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === Tab.REPORTS ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
          >
            <FileBarChart size={22} className="min-w-[22px]" />
            {sidebarOpen && <span>Hisobotlar</span>}
          </button>

          <button 
            onClick={() => setActiveTab(Tab.CHANCELLERY)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === Tab.CHANCELLERY ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
          >
            <Inbox size={22} className="min-w-[22px]" />
            {sidebarOpen && <span>Devonxona</span>}
          </button>

          <button 
            onClick={() => setActiveTab(Tab.SETTINGS)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === Tab.SETTINGS ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800'}`}
          >
            <SettingsIcon size={22} className="min-w-[22px]" />
            {sidebarOpen && <span>Sozlamalar</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-blue-800 space-y-3">
           {sidebarOpen && currentUser && (
             <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
               <User size={16} />
               <span className="truncate">{currentUser.fullName}</span>
             </div>
           )}
           <div className="flex gap-2">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex-1 flex justify-center text-blue-300 hover:text-white py-2">
                <Menu size={24} />
             </button>
             <button onClick={handleLogout} className="flex-1 flex justify-center text-red-300 hover:text-red-100 py-2" title="Chiqish">
                <LogOut size={24} />
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-6 md:p-8`}>
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {activeTab === Tab.DASHBOARD && 'Dashboard'}
              {activeTab === Tab.LETTERS && 'Xatlar Ro\'yxati'}
              {activeTab === Tab.ANALYZER && 'Hujjat Tahlili va Tahriri'}
              {activeTab === Tab.CHANCELLERY && 'Devonxona'}
              {activeTab === Tab.REPORTS && 'Tahliliy Hisobotlar'}
              {activeTab === Tab.SETTINGS && 'Tizim Sozlamalari'}
            </h1>
            <p className="text-slate-500 text-sm">Oliy ta'lim, fan va innovatsiyalar vazirligi</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
             <span className="text-xs font-medium text-slate-600">AI Tizimi Faol</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto">
          
          {isLoadingDocs && (
            <div className="mb-4 p-3 bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
              Hujjatlar yuklanmoqda...
            </div>
          )}
          {documentsError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
              {documentsError}
            </div>
          )}
          
          {activeTab === Tab.DASHBOARD && <Dashboard letterTypes={letterTypes} documents={documents} />}
          
          {activeTab === Tab.LETTERS && (
            <Letters documents={documents} />
          )}

          {activeTab === Tab.REPORTS && (
            <Reports documents={documents} />
          )}

          {activeTab === Tab.SETTINGS && (
            <Settings 
              hierarchy={hierarchy} 
              setHierarchy={setHierarchy}
              letterTypes={letterTypes}
              setLetterTypes={setLetterTypes}
            />
          )}

          {activeTab === Tab.ANALYZER && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
              
              {/* Left Column: Input */}
              <div className="flex flex-col space-y-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-slate-700">Hujjat Kiriting</h3>
                    {(inputText || selectedFile) && (
                      <button
                        onClick={clearInputs}
                        className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 rounded-full px-4 py-1.5 shadow-md shadow-red-200 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 transition-all"
                        title="Kiritilgan ma'lumotlarni tozalash"
                      >
                        <X size={14} />
                        Tozalash
                      </button>
                    )}
                  </div>
                  
                  {/* Department Selection */}
                  <div className="mb-4">
                     <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                        Hujjat tegishli bo'linma (Ixtiyoriy)
                     </label>
                     <div className="relative">
                        <select 
                           value={selectedDeptId}
                           onChange={(e) => setSelectedDeptId(e.target.value)}
                           className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                           <option value="">-- Avtomatik aniqlash --</option>
                           {flatDepartments.map(dept => (
                              <option key={dept.id} value={dept.id}>
                                 {dept.name}
                              </option>
                           ))}
                        </select>
                        <Building size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  </div>

                  {/* Tabs for Input Type */}
                  <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                      onClick={() => setInputMode('file')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'file' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}
                    >
                      Fayl (PDF)
                    </button>
                    <button
                      onClick={() => setInputMode('text')}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${inputMode === 'text' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'}`}
                    >
                      Matn
                    </button>
                  </div>

                  {inputMode === 'file' ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 flex flex-col items-center justify-center text-center min-h-[300px] relative">
                      {!selectedFile ? (
                        <>
                          <UploadCloud size={48} className="text-blue-400 mb-3" />
                          <p className="text-slate-600 font-medium mb-2">PDF yoki rasm yuklang</p>
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          >
                            Fayl tanlash
                          </label>
                          <input
                            id="file-upload"
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
                          <p className="text-slate-700 font-semibold">{selectedFile.name}</p>
                          <p className="text-slate-400 text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                          <button
                            onClick={() => { setSelectedFile(null); }}
                            className="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full px-3 py-1 hover:bg-red-100 transition"
                          >
                            O'chirish
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Xat loyihasi matnini shu yerga kiriting..."
                      className="w-full flex-1 p-4 rounded-lg border border-slate-200 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50"
                      style={{ minHeight: '300px' }}
                    />
                  )}

                  <div className="mt-4 flex flex-col gap-2">

                     <button
                        onClick={handleAnalysis}
                        disabled={isAnalyzing || (!inputText && !selectedFile)}
                        className={`w-full py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all shadow-md
                          ${isAnalyzing || (!inputText && !selectedFile) 
                            ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98]'}`}
                      >
                        {isAnalyzing ? (
                          <><span>Tahlil qilinmoqda...</span></>
                        ) : (
                          <><span>AI Tahlilni Boshlash</span> <FileSearch size={18} /></>
                        )}
                      </button>
                  </div>
                  
                  {error && (
                    <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                      <div className="mt-0.5 min-w-[4px] h-4 bg-red-500 rounded-full"></div>
                      {error}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="flex flex-col h-full">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-slate-700">Tahlil Natijalari</h3>
                    {analysisResult && (
                      <span className="text-xs text-slate-400">Gemini 3 Flash tomonidan tahlil qilindi</span>
                    )}
                  </div>
                  
                  <AnalysisView result={analysisResult} isLoading={isAnalyzing} />
                </div>
              </div>

            </div>
          )}

          {activeTab === Tab.CHANCELLERY && (
            <Chancellery hierarchy={hierarchy} />
          )}

        </div>
      </main>
    </div>
  );
};

export default App;