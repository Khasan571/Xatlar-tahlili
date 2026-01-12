import React, { useEffect, useState } from 'react';
import { HierarchyNode, LetterType } from '../types';
import { FolderTree, Plus, Trash2, Tag, ChevronRight, ChevronDown, Edit2, X, Check } from 'lucide-react';
import { makeId } from '../services/id';

interface SettingsProps {
  hierarchy: HierarchyNode[];
  setHierarchy: React.Dispatch<React.SetStateAction<HierarchyNode[]>>;
  letterTypes: LetterType[];
  setLetterTypes: React.Dispatch<React.SetStateAction<LetterType[]>>;
}

interface TreeNodeProps {
  node: HierarchyNode;
  depth?: number;
  onAdd: (parentId: string, name: string, type: HierarchyNode['type']) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth = 0, onAdd, onDelete, onRename, onUpdateDescription }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildType, setNewChildType] = useState<HierarchyNode['type']>('Department');
  const [descDraft, setDescDraft] = useState(node.description || '');

  useEffect(() => {
    setDescDraft(node.description || '');
  }, [node.description]);

  const hasChildren = node.children && node.children.length > 0;

  const handleRename = () => {
    if (editName.trim()) {
      onRename(node.id, editName);
      setIsEditing(false);
    }
  };

  const handleAddChild = () => {
    if (newChildName.trim()) {
      onAdd(node.id, newChildName, newChildType);
      setNewChildName('');
      setShowAddForm(false);
      setIsOpen(true);
    }
  };

  const getNextLikelyType = (currentType: string): HierarchyNode['type'] => {
    if (currentType === 'Ministry') return 'Deputy';
    if (currentType === 'Deputy') return 'Department';
    if (currentType === 'Advisor') return 'Department';
    if (currentType === 'Department') return 'Division';
    return 'Division';
  };

  return (
    <div className="select-none">
      <div 
        className="flex items-center gap-2 py-2 px-2 hover:bg-slate-50 rounded group relative"
        style={{ paddingLeft: `${depth * 20}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          className="cursor-pointer p-1"
          onClick={() => setIsOpen(!isOpen)}
        >
           {hasChildren ? (
            isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
          ) : <div className="w-4" />}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
             <input 
               autoFocus
               type="text" 
               value={editName} 
               onChange={(e) => setEditName(e.target.value)}
               className="text-sm border border-blue-300 rounded px-2 py-1 outline-none w-full"
             />
             <button onClick={handleRename} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
             <button onClick={() => setIsEditing(false)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
              ${node.type === 'Ministry' ? 'bg-indigo-100 text-indigo-700' :
                node.type === 'Deputy' ? 'bg-blue-100 text-blue-700' :
                node.type === 'Department' ? 'bg-green-100 text-green-700' : 
                node.type === 'Division' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
              {node.type}
            </span>
            <span className="text-slate-700 font-medium text-sm">{node.name}</span>
          </div>
        )}

        {/* Action Buttons */}
        {isHovered && !isEditing && (
          <div className="flex items-center gap-1 bg-white shadow-sm border border-slate-200 rounded px-1 absolute right-2 top-1/2 -translate-y-1/2">
             <button 
               onClick={() => {
                 setNewChildType(getNextLikelyType(node.type));
                 setShowAddForm(true);
               }}
               title="Quyi bo'linma qo'shish"
               className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
             >
               <Plus size={14} />
             </button>
             <button 
               onClick={() => setIsEditing(true)}
               title="Tahrirlash"
               className="p-1.5 text-slate-500 hover:bg-slate-100 rounded"
             >
               <Edit2 size={14} />
             </button>
             {node.type !== 'Ministry' && (
               <button 
                 onClick={() => {
                   if(window.confirm(`${node.name} ni o'chirishni tasdiqlaysizmi?`)) {
                     onDelete(node.id);
                   }
                 }}
                 title="O'chirish"
                 className="p-1.5 text-red-500 hover:bg-red-50 rounded"
               >
                 <Trash2 size={14} />
               </button>
             )}
          </div>
        )}
      </div>

      {/* Add Child Form */}
      {showAddForm && (
         <div className="ml-8 my-2 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <select 
              value={newChildType} 
              onChange={(e) => setNewChildType(e.target.value as any)}
              className="text-xs border border-blue-200 rounded px-2 py-1.5 outline-none bg-white text-slate-700"
            >
               <option value="Deputy">O'rinbosar</option>
               <option value="Advisor">Maslahatchi</option>
               <option value="Department">Departament/Boshqarma</option>
               <option value="Division">Bo'lim</option>
            </select>
            <input 
              type="text" 
              placeholder="Nomi..."
              autoFocus
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              className="flex-1 text-sm border border-blue-200 rounded px-2 py-1.5 outline-none"
            />
            <button 
              onClick={handleAddChild}
              disabled={!newChildName.trim()}
              className="bg-blue-600 text-white p-1.5 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Check size={14} />
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              className="text-slate-500 p-1.5 hover:text-slate-700"
            >
              <X size={14} />
            </button>
         </div>
      )}
      
      {isOpen && (
        <div className="ml-3 space-y-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-2">
              Vazifa va funksiyalar
            </label>
            <textarea
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              placeholder="Bo'linma vazifalari va asosiy funksiyalarini kiriting..."
              className="w-full min-h-[80px] text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={() => onUpdateDescription(node.id, descDraft.trim())}
                className="text-sm px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={(node.description || '') === descDraft.trim()}
              >
                Saqlash
              </button>
            </div>
          </div>

          {hasChildren && (
            <div className="border-l border-slate-200">
              {node.children?.map(child => (
                <TreeNode 
                  key={child.id} 
                  node={child} 
                  depth={depth + 1} 
                  onAdd={onAdd}
                  onDelete={onDelete}
                  onRename={onRename}
                  onUpdateDescription={onUpdateDescription}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Settings: React.FC<SettingsProps> = ({ hierarchy, setHierarchy, letterTypes, setLetterTypes }) => {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'types'>('hierarchy');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  // --- Hierarchy Actions ---
  const addNodeToTree = (nodes: HierarchyNode[], parentId: string, newNode: HierarchyNode): HierarchyNode[] => {
    return nodes.map(node => {
      if (node.id === parentId) {
        return { ...node, children: [...(node.children || []), newNode] };
      }
      if (node.children) {
        return { ...node, children: addNodeToTree(node.children, parentId, newNode) };
      }
      return node;
    });
  };

  const removeNodeFromTree = (nodes: HierarchyNode[], id: string): HierarchyNode[] => {
    return nodes
      .filter(node => node.id !== id)
      .map(node => ({
        ...node,
        children: node.children ? removeNodeFromTree(node.children, id) : undefined
      }));
  };

  const renameNodeInTree = (nodes: HierarchyNode[], id: string, newName: string): HierarchyNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, name: newName };
      }
      if (node.children) {
        return { ...node, children: renameNodeInTree(node.children, id, newName) };
      }
      return node;
    });
  };

  const updateDescriptionInTree = (nodes: HierarchyNode[], id: string, description: string): HierarchyNode[] => {
    return nodes.map(node => {
      if (node.id === id) {
        return { ...node, description };
      }
      if (node.children) {
        return { ...node, children: updateDescriptionInTree(node.children, id, description) };
      }
      return node;
    });
  };

  const handleAddNode = (parentId: string, name: string, type: HierarchyNode['type']) => {
    const newNode: HierarchyNode = {
      id: makeId(),
      name,
      type,
      children: []
    };
    setHierarchy(prev => addNodeToTree(prev, parentId, newNode));
  };

  const handleDeleteNode = (id: string) => {
    setHierarchy(prev => removeNodeFromTree(prev, id));
  };

  const handleRenameNode = (id: string, newName: string) => {
    setHierarchy(prev => renameNodeInTree(prev, id, newName));
  };

  const handleUpdateDescription = (id: string, description: string) => {
    setHierarchy(prev => updateDescriptionInTree(prev, id, description));
  };

  // --- Letter Type Actions ---
  const addLetterType = () => {
    if (!newTypeName.trim()) return;
    const newEntry: LetterType = {
      id: Date.now().toString(),
      name: newTypeName.trim(),
      description: newTypeDescription.trim() || "Foydalanuvchi tomonidan qo'shildi"
    };
    setLetterTypes([...letterTypes, newEntry]);
    setNewTypeName('');
    setNewTypeDescription('');
    setShowAddTypeModal(false);
  };

  const removeLetterType = (id: string) => {
    setLetterTypes(letterTypes.filter(t => t.id !== id));
  };

  const closeAddTypeModal = () => {
    setShowAddTypeModal(false);
    setNewTypeName('');
    setNewTypeDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <button 
          onClick={() => setActiveTab('hierarchy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'hierarchy' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <FolderTree size={18} />
          Tuzilma (Ierarxiya)
        </button>
        <button 
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'types' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Tag size={18} />
          Xat Turlari
        </button>
      </div>

      {activeTab === 'hierarchy' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-semibold text-slate-800 mb-4">Vazirlik Tashkiliy Tuzilmasi</h3>
           <div className="bg-blue-50 text-blue-800 p-3 rounded-lg mb-4 text-sm flex items-start gap-2">
             <Edit2 size={16} className="mt-0.5" />
             <div>
               <p className="font-semibold">Tuzilmani Tahrirlash:</p>
               <ul className="list-disc list-inside text-xs mt-1 space-y-0.5">
                 <li>Bo'linma ustiga sichqonchani olib borib <b>(+)</b> tugmasi orqali yangi quyi bo'linma qo'shing.</li>
                 <li>Qalam tugmasi orqali nomini o'zgartiring.</li>
                 <li>Chiqindi qutisi tugmasi orqali o'chiring.</li>
               </ul>
             </div>
           </div>
           
           <div className="border border-slate-200 rounded-lg p-4 h-[500px] overflow-y-auto bg-white">
             {hierarchy.map(node => (
               <TreeNode 
                 key={node.id} 
                 node={node} 
                 onAdd={handleAddNode}
                 onDelete={handleDeleteNode}
                 onRename={handleRenameNode}
                onUpdateDescription={handleUpdateDescription}
               />
             ))}
           </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Xat Turlari Klassifikatori</h3>
              <p className="text-sm text-slate-500 mt-1">{letterTypes.length} ta xat turi mavjud</p>
            </div>
            <button
              onClick={() => setShowAddTypeModal(true)}
              className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus size={18} /> Yangi tur qo'shish
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
            {letterTypes.map(type => (
              <div key={type.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-200 group hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-700 truncate">{type.name}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{type.description}</p>
                </div>
                <button
                  onClick={() => {
                    if(window.confirm(`"${type.name}" turini o'chirishni tasdiqlaysizmi?`)) {
                      removeLetterType(type.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Letter Type Modal */}
      {showAddTypeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Yangi xat turi</h3>
                  <p className="text-sm text-slate-500">Ma'lumotlarni kiriting</p>
                </div>
              </div>
              <button
                onClick={closeAddTypeModal}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Xat turi nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Masalan: Buyruq, Ariza, Hisobot..."
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tavsif
                </label>
                <textarea
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                  placeholder="Bu xat turi haqida qisqacha ma'lumot..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button
                onClick={closeAddTypeModal}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={addLetterType}
                disabled={!newTypeName.trim()}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={18} />
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;