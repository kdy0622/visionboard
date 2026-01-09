
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, VisionItem } from './types';
import { getGeminiResponse, extractVisionData, REFERENCE_DATE } from './services/geminiService';
import { 
  Send, Trash2, Layout, MessageSquare, Download, Sparkles,
  MapPin, Gift, Star, PlusCircle, User, Calendar, X, Info, Edit3, Save, CheckCircle, Award, Image as ImageIcon,
  Upload, Camera, FileImage
} from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [visionItems, setVisionItems] = useState<VisionItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [view, setView] = useState<'chat' | 'board'>('chat');
  const [creatorName, setCreatorName] = useState('');
  const [tempName, setTempName] = useState('');
  const [activeTab, setActiveTab] = useState<'place' | 'item' | 'experience'>('place');
  const [selectedItem, setSelectedItem] = useState<VisionItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const UsanaLogo = () => (
    <div className="flex items-center gap-2">
      <div className="bg-[#003399] text-white font-black px-3 py-1 rounded-lg text-xl italic tracking-tighter shadow-sm">USANA</div>
      <div className="text-[#003399] font-bold text-xs leading-tight hidden sm:block">HEALTH<br/>SCIENCES</div>
    </div>
  );

  useEffect(() => {
    if (creatorName) {
      const intro = `반갑습니다, ${creatorName} 리더님! 🌟 
리더님의 멋진 미래를 시각화할 준비가 되었습니다.

꿈꾸는 사진이 있다면 드래그하거나 업로드해 주세요! 
제가 이미지를 분석해서 리더님께 딱 맞는 꿈의 비용과 계획을 설계해 드릴게요. 🌸☀️🍂❄️

💡 [입력 팁]: 사진을 올리시거나, 꿈의 제목만 말씀해 주셔도 좋습니다.`;
      setMessages([{ role: 'assistant', content: intro, timestamp: new Date() }]);
    }
  }, [creatorName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageToSend = text || inputValue;
    if (!messageToSend.trim() && !uploadedImage) return;
    
    const displayContent = messageToSend || (uploadedImage ? "사진을 업로드했습니다. 이 꿈을 분석해주세요!" : "");
    
    setMessages(prev => [...prev, { role: 'user', content: displayContent, timestamp: new Date() }]);
    const currentImage = uploadedImage;
    setInputValue('');
    setUploadedImage(null);
    setIsTyping(true);

    try {
      const response = await getGeminiResponse(messages, messageToSend, currentImage || undefined);
      setMessages(prev => [...prev, { role: 'assistant', content: response || '', timestamp: new Date() }]);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsTyping(false); 
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateBoard = async () => {
    if (messages.length < 2) {
      alert("꿈에 대해 먼저 채팅으로 대화해 주세요!");
      return;
    }
    setIsGenerating(true);
    try {
      const items = await extractVisionData(messages.map(m => `${m.role}: ${m.content}`).join('\n'));
      setVisionItems(items);
      setView('board');
    } catch (error) { 
      alert('비전보드 생성 중 오류가 발생했습니다.'); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const toggleAchieved = () => {
    if (selectedItem) {
      const updated = { 
        ...selectedItem, 
        isAchieved: !selectedItem.isAchieved,
        achievementDate: !selectedItem.isAchieved ? new Date().toISOString().split('T')[0] : undefined
      };
      setSelectedItem(updated);
      setVisionItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('ko-KR').format(val) + '원';

  if (!creatorName) {
    return (
      <div className="min-h-screen bg-[#003399] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
          <div className="mb-10 flex justify-center scale-150"><UsanaLogo /></div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">비전보드 빌더</h1>
          <p className="text-slate-500 font-medium mb-10">리더님의 성함을 입력하고 미래를 시작하세요.</p>
          <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} onKeyDown={e => e.key === 'Enter' && setCreatorName(tempName)} placeholder="성함 입력" className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-5 px-6 text-xl text-center outline-none focus:border-blue-500 transition-all mb-6" />
          <button onClick={() => setCreatorName(tempName)} disabled={!tempName.trim()} className="w-full bg-[#003399] text-white py-5 rounded-2xl text-xl font-bold shadow-xl hover:bg-blue-800 transition-all">입장하기</button>
        </div>
      </div>
    );
  }

  const filteredItems = visionItems.filter(item => item.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto bg-white shadow-2xl relative overflow-hidden" 
         onDragOver={onDragOver} 
         onDragLeave={onDragLeave} 
         onDrop={onDrop}>
      
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#003399]/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-10 pointer-events-none animate-in fade-in">
          <Upload size={120} className="mb-6 animate-bounce" />
          <h2 className="text-4xl font-black mb-2">여기에 사진을 놓으세요!</h2>
          <p className="text-xl opacity-80">리더님의 꿈을 시각화해 드립니다.</p>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 sm:px-10 flex flex-col sm:flex-row gap-4 justify-between items-center no-print">
        <div className="flex items-center gap-6">
          <UsanaLogo />
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black text-[#003399] tracking-tighter uppercase">Vision Board</h1>
            <p className="text-sm font-bold text-slate-400 flex items-center gap-1"><User size={14}/> {creatorName} 리더님 | {REFERENCE_DATE}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setView('chat')} className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${view === 'chat' ? 'bg-[#003399] text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600'}`}>채팅 & 분석</button>
          <button onClick={() => setView('board')} className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${view === 'board' ? 'bg-[#003399] text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-600'}`}>나의 보드</button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {view === 'chat' ? (
          <div className="flex-1 flex flex-col p-4 sm:p-8 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 hide-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-sm text-[1.1rem] leading-relaxed break-keep whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-200'}`}>{msg.content}</div>
                </div>
              ))}
              {isTyping && <div className="text-blue-600 animate-pulse font-bold px-4 flex items-center gap-2"><Sparkles size={18}/> 사진과 꿈을 분석하여 비용을 설계하는 중...</div>}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4 shadow-inner">
              {uploadedImage && (
                <div className="relative inline-block animate-in slide-in-from-bottom-2">
                  <img src={uploadedImage} className="h-32 w-32 object-cover rounded-2xl shadow-lg border-4 border-white" alt="Preview" />
                  <button onClick={() => setUploadedImage(null)} className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-md"><X size={16}/></button>
                </div>
              )}
              <div className="flex gap-3 items-center">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-2 border-slate-200 text-slate-400 p-4 rounded-2xl hover:border-[#003399] hover:text-[#003399] transition-all"
                >
                  <Camera size={28}/>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                
                <input 
                  type="text" 
                  value={inputValue} 
                  onChange={e => setInputValue(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                  placeholder="꿈을 적거나 사진을 올려주세요..." 
                  className="flex-1 bg-white border-2 border-slate-200 rounded-2xl p-4 text-xl outline-none focus:border-[#003399] transition-all" 
                />
                <button onClick={() => handleSendMessage()} className="bg-[#003399] text-white p-5 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"><Send size={28}/></button>
              </div>
              <button 
                onClick={generateBoard} 
                disabled={isGenerating}
                className={`w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all ${isGenerating ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.99]'}`}
              >
                {isGenerating ? (
                  <><div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> 소중한 비전보드 완성하는 중...</>
                ) : (
                  <><Sparkles size={28}/> 비전보드 시각화하기 ({visionItems.length}개)</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden">
            <div className="p-6 bg-white border-b border-slate-200 no-print">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">나의 비전 리포트</h2>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all"><Download size={24}/> PDF 저장</button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                {(['place', 'item', 'experience'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-xl font-black text-lg border-2 transition-all ${activeTab === tab ? 'bg-[#003399] border-[#003399] text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>
                    {tab === 'place' ? '📍 가고 싶은 곳' : tab === 'item' ? '🎁 갖고 싶은 것' : '✨ 해보고 싶은 것'} ({visionItems.filter(i => i.category === tab).length})
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print-area">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => { setSelectedItem(item); setIsEditing(false); }} 
                  className={`vision-card relative cursor-pointer group bg-white rounded-3xl overflow-hidden shadow-md border-4 transition-all duration-300 hover:shadow-2xl ${item.isAchieved ? 'border-emerald-500' : 'border-transparent hover:border-blue-100'}`}
                >
                  <div className="h-44 overflow-hidden relative bg-slate-200">
                    <img 
                      src={item.imageUrl} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={item.title} 
                      onError={(e) => { e.currentTarget.src = `https://loremflickr.com/800/600/dream,success?sig=${item.id}`; }}
                    />
                    {item.isAchieved && (
                      <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-full font-black shadow-lg animate-bounce flex items-center gap-1">
                          <CheckCircle size={16}/> 달성 완료!
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col min-h-[180px]">
                    <h4 className="font-black text-[1.2rem] text-slate-800 mb-2 leading-[1.3] break-keep h-14 overflow-hidden line-clamp-2">{item.title}</h4>
                    <p className="text-slate-500 text-sm line-clamp-3 mb-4 leading-relaxed break-keep flex-1">{item.details}</p>
                    <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                      <div className="text-left flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">목표 시기</span>
                        <span className="text-slate-800 font-bold text-[0.95rem]">{item.targetDate.replace('-', '.')}</span>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">상세 예산</span>
                        <span className="text-[#003399] font-black text-[1rem]">{formatCurrency(item.estimatedCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center p-20 text-slate-400">
                  <PlusCircle size={64} className="mb-4 opacity-20"/>
                  <p className="text-xl font-bold">채팅과 사진을 통해 리더님의 비전을 채워주세요!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden relative max-h-[95vh] flex flex-col shadow-2xl scale-in duration-300">
            <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 bg-black/50 p-3 rounded-full text-white z-10 transition-transform hover:rotate-90 hover:bg-black/70"><X/></button>
            <div className="flex flex-col lg:flex-row h-full overflow-hidden">
              <div className="w-full lg:w-1/2 bg-slate-50 overflow-y-auto hide-scrollbar p-6 space-y-4">
                <div className="relative group overflow-hidden rounded-[2.5rem]">
                  <img src={selectedItem.imageUrl} className="w-full h-80 object-cover shadow-xl transition-transform duration-500 group-hover:scale-105" alt="Main" onError={(e) => { e.currentTarget.src = `https://loremflickr.com/800/600/dream,vision?sig=${selectedItem.id}`; }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedItem.additionalImages?.map((img, i) => (
                    <img key={i} src={img} className="w-full h-40 object-cover rounded-2xl shadow-md hover:scale-[1.03] transition-transform cursor-pointer" alt={`Extra ${i}`} onError={(e) => { e.currentTarget.src = `https://loremflickr.com/800/600/goal,success?sig=${selectedItem.id}_${i}`; }} />
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-1/2 p-8 lg:p-12 overflow-y-auto flex flex-col bg-white">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex-1 mr-4">
                    <h3 className="text-3xl font-black text-slate-900 mb-4 break-keep leading-tight">{selectedItem.title}</h3>
                    <button onClick={toggleAchieved} className={`px-6 py-2.5 rounded-full font-black text-sm flex items-center gap-2 transition-all ${selectedItem.isAchieved ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                      {selectedItem.isAchieved ? <CheckCircle size={18}/> : <Award size={18}/>}
                      {selectedItem.isAchieved ? '멋지게 달성하셨습니다!' : '달성 완료하기'}
                    </button>
                  </div>
                  <button onClick={() => setIsEditing(!isEditing)} className={`p-4 rounded-2xl transition-all shadow-sm ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-blue-600'}`}><Edit3 size={24}/></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">목표 시기</p>
                    {isEditing ? <input type="month" value={selectedItem.targetDate} onChange={e => setSelectedItem({...selectedItem, targetDate: e.target.value})} className="w-full bg-white p-3 rounded-xl font-bold border-2 border-blue-100 outline-none focus:border-blue-500" /> : <p className="text-2xl font-black text-[#003399]">{selectedItem.targetDate.replace('-', '년 ')}월</p>}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">설계된 총 예산</p>
                    {isEditing ? <div className="flex items-center gap-2"><input type="number" value={selectedItem.estimatedCost} onChange={e => setSelectedItem({...selectedItem, estimatedCost: parseInt(e.target.value) || 0})} className="w-full bg-white p-3 rounded-xl font-bold border-2 border-blue-100 outline-none focus:border-blue-500" /> <span className="font-bold">원</span></div> : <p className="text-2xl font-black text-emerald-600">{formatCurrency(selectedItem.estimatedCost)}</p>}
                  </div>
                </div>

                <div className="flex-1 space-y-8">
                  <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 min-h-[220px] relative">
                    <h5 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-[#003399]"/> AI 상세 비용 분석 및 다짐</h5>
                    {isEditing ? (
                      <textarea value={selectedItem.details} onChange={e => setSelectedItem({...selectedItem, details: e.target.value})} rows={8} className="w-full bg-white p-6 rounded-2xl border-2 border-blue-50 outline-none focus:border-blue-500 text-[1.05rem] leading-relaxed shadow-sm break-keep" />
                    ) : (
                      <div className="text-slate-600 leading-relaxed text-[1.05rem] break-keep whitespace-pre-wrap">
                        {selectedItem.details || "이미지를 분석하여 정교한 비용 설계를 진행 중입니다."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-100 flex gap-4 no-print">
                  <button onClick={() => { if(window.confirm('이 꿈을 삭제하시겠습니까?')) { setVisionItems(v => v.filter(i => i.id !== selectedItem.id)); setSelectedItem(null); } }} className="px-8 py-5 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-colors flex items-center gap-2"><Trash2 size={20}/> 삭제</button>
                  <button onClick={() => { setVisionItems(v => v.map(i => i.id === selectedItem.id ? selectedItem : i)); setSelectedItem(null); }} className="flex-1 py-5 bg-[#003399] text-white font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all text-xl">보드 반영</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
