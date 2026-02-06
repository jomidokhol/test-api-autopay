
import React, { useState, useEffect, useCallback } from 'react';
import Loader from './components/Loader';
import Toast from './components/Toast';
import { verifyToken, logServiceActivity, saveMessage, getMessages } from './services/firebaseService';
import { ConnectionStatus, SMSMessage } from './types';

const App: React.FC = () => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.INACTIVE);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const triggerToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  }, []);

  const handleConnect = async () => {
    if (!token.trim()) {
      triggerToast("অনুগ্রহ করে একটি বৈধ NURAPI টোকেন দিন!");
      return;
    }

    setStatus(ConnectionStatus.VERIFYING);
    try {
      const isValid = await verifyToken(token.trim());
      if (isValid) {
        triggerToast("API ভেরিফাইড! সার্ভিস এখন ডাটা সিঙ্ক করার জন্য প্রস্তুত।");
        setStatus(ConnectionStatus.ACTIVE);
        localStorage.setItem('nurapi_token', token.trim());
        setTimeout(() => setShowModal(true), 1000);
      } else {
        triggerToast("ভুল টোকেন! ডাটাবেজে এই কি পাওয়া যায়নি।");
        setStatus(ConnectionStatus.INACTIVE);
      }
    } catch (error) {
      triggerToast("কানেকশন এরর! আপনার ইন্টারনেট সংযোগ চেক করুন।");
      setStatus(ConnectionStatus.INACTIVE);
    }
  };

  const fetchHistory = async () => {
    if (!token) return;
    setIsLoadingMessages(true);
    const fetched = await getMessages(token);
    setMessages(fetched);
    setIsLoadingMessages(false);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  const handleGrantPermissions = () => {
    setShowModal(false);
    triggerToast("অনুমতি প্রদান করা হয়েছে! অ্যাপটি এখন ব্যাকগ্রাউন্ডে মেসেজ রিড করবে।");
    logServiceActivity(token);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
      triggerToast("টোকেন পেস্ট করা হয়েছে");
    } catch (err) {
      triggerToast("ক্লিপবোর্ড অ্যাক্সেস রিফিউজ করা হয়েছে।");
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('nurapi_token');
    if (savedToken) setToken(savedToken);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === ConnectionStatus.ACTIVE) {
        e.preventDefault();
        e.returnValue = "সার্ভিসটি কি বন্ধ করতে চান?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-slate-50">
      <Loader />
      
      {/* Header */}
      <header className="sticky top-0 w-full bg-white/90 backdrop-blur-md h-[70px] flex items-center justify-between shadow-sm z-[100] px-6">
        <div className="flex items-center gap-2.5">
          <img 
            src="https://i.ibb.co.com/ZpYtjLT8/1000043015-removebg-preview.png" 
            className="h-[35px]" 
            alt="Logo" 
          />
          <span className="font-extrabold text-[#1e293b] text-lg">AUTO PAY</span>
        </div>
        {status === ConnectionStatus.ACTIVE && (
          <button 
            onClick={handleViewHistory}
            className="text-[#10b981] font-bold text-sm bg-[#10b981]/10 px-4 py-2 rounded-full active:scale-95 transition-all"
          >
            <i className="fas fa-history mr-1"></i> History
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[500px] px-5 pt-6 pb-10">
        <div className="bg-white rounded-[25px] p-8 shadow-xl border border-[#10b981]/10 animate-[slideUp_0.6s_ease]">
          <h2 className="text-xl font-bold text-[#059669] mb-5 text-center">Service Configuration</h2>
          
          <div className="mb-4">
            <label className="text-[13px] font-semibold text-[#64748b] mb-2 block">API Token</label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter NURAPI Token"
                className="w-full p-[15px] pr-[120px] border-2 border-[#e2e8f0] rounded-xl outline-none text-sm transition-all focus:border-[#10b981]"
              />
              <div className="absolute right-2 flex items-center gap-2">
                {token && (
                  <i 
                    className="fas fa-times-circle text-[#94a3b8] cursor-pointer p-1" 
                    onClick={() => {
                      setToken('');
                      localStorage.removeItem('nurapi_token');
                    }}
                  />
                )}
                <button 
                  onClick={pasteFromClipboard}
                  className="bg-[#10b981] text-white border-none py-2 px-4 rounded-lg font-semibold text-xs cursor-pointer active:scale-95"
                >
                  PASTE
                </button>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 mb-6 text-[13px] ${
            status === ConnectionStatus.ACTIVE ? 'text-[#10b981]' : 'text-gray-400'
          }`}>
            <div className={`w-2.5 h-2.5 rounded-full transition-all ${
              status === ConnectionStatus.ACTIVE ? 'bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse' : 
              status === ConnectionStatus.VERIFYING ? 'bg-yellow-400 animate-pulse' : 'bg-[#cbd5e1]'
            }`}></div>
            <span>Status: <b className="font-bold uppercase tracking-wider">{status}</b></span>
          </div>

          <button 
            disabled={status === ConnectionStatus.VERIFYING || status === ConnectionStatus.ACTIVE}
            onClick={handleConnect}
            className={`w-full text-white border-none p-4 rounded-xl text-base font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
              status === ConnectionStatus.ACTIVE ? 'bg-[#64748b] cursor-not-allowed' : 'bg-gradient-to-br from-[#10b981] to-[#059669]'
            }`}
          >
            {status === ConnectionStatus.VERIFYING ? (
              <><i className="fas fa-spinner animate-spin"></i> VERIFYING...</>
            ) : status === ConnectionStatus.ACTIVE ? (
              <><i className="fas fa-check-circle"></i> SERVICE RUNNING</>
            ) : (
              <><i className="fas fa-plug"></i> CONNECT SERVICE</>
            )}
          </button>

          {status === ConnectionStatus.ACTIVE && (
            <p className="mt-4 text-[12px] text-center text-[#64748b] italic">
               সার্ভিসটি সক্রিয় আছে। এটি ব্যাকগ্রাউন্ডে মেসেজ স্ক্যান করছে।
            </p>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center py-10 mt-8 border-t border-[#e2e8f0]">
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <button 
              onClick={() => triggerToast("নির্দেশিকা শীঘ্রই আসছে!")}
              className="px-5 py-3 bg-white text-[#64748b] border border-[#e2e8f0] rounded-xl text-sm font-semibold flex items-center gap-2 hover:text-[#10b981] hover:border-[#10b981] transition-all shadow-sm"
            >
              <i className="fas fa-book"></i> How to Activate?
            </button>
            <a 
              href="https://autopay-api.vercel.app/" 
              target="_blank" 
              className="px-5 py-3 bg-white text-[#64748b] border border-[#e2e8f0] rounded-xl text-sm font-semibold flex items-center gap-2 hover:text-[#10b981] hover:border-[#10b981] transition-all shadow-sm"
            >
              <i className="fas fa-key"></i> Get API Key
            </a>
          </div>
          <p className="text-sm text-[#64748b]">
            Auto Pay API System <b>&copy; 2026</b> | Powered by <a href="https://www.facebook.com/NURtheBackBencher" target="_blank" className="text-[#10b981] font-bold no-underline">Developer Nur</a>
          </p>
        </footer>
      </main>

      {/* Message History Side/Bottom Drawer */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex flex-col justify-end transition-opacity duration-300">
          <div className="absolute inset-0" onClick={() => setShowHistory(false)}></div>
          <div className="bg-white w-full max-w-[500px] self-center rounded-t-[30px] p-6 max-h-[85vh] overflow-hidden flex flex-col relative z-[2001] animate-[slideUp_0.4s_ease-out]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#1e293b]">Message History</h3>
              <div className="flex gap-2">
                <button 
                  onClick={fetchHistory}
                  className="p-2 text-[#10b981] rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <i className={`fas fa-sync-alt ${isLoadingMessages ? 'animate-spin' : ''}`}></i>
                </button>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-gray-400 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              {isLoadingMessages ? (
                <div className="py-20 text-center text-gray-400">
                  <div className="inline-block w-8 h-8 border-4 border-gray-100 border-t-[#10b981] rounded-full animate-spin mb-4"></div>
                  <p>Fetching messages...</p>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 transition-all hover:border-[#10b981]/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-[#1e293b] text-sm">{msg.sender}</span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        msg.sync_status === 'synced' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {msg.sync_status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-2">{msg.body}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <i className="far fa-clock"></i>
                      {new Date(msg.date).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center text-gray-400">
                  <i className="fas fa-comment-slash text-4xl mb-4 opacity-20"></i>
                  <p>No messages captured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals & Toasts */}
      <Toast 
        message={toastMsg} 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[2000] p-5">
          <div className="bg-white p-8 rounded-[25px] text-center max-w-[400px] animate-[slideUp_0.3s_ease] shadow-2xl">
            <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-shield-alt text-4xl text-[#10b981]"></i>
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#1e293b]">Permissions Required</h3>
            <p className="text-sm text-[#64748b] mb-6 leading-relaxed">
              ইনকামিং মেসেজগুলো পড়ার জন্য এবং পেমেন্ট প্রসেস করার জন্য আমাদের SMS এবং ব্যাকগ্রাউন্ড এক্সিকিউশন পারমিশন প্রয়োজন।
            </p>
            <button 
              onClick={handleGrantPermissions}
              className="w-full bg-[#10b981] text-white p-4 rounded-xl font-bold shadow-lg shadow-[#10b981]/30 active:scale-95 transition-all"
            >
              ALLOW PERMISSIONS
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
