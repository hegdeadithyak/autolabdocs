
'use client';

import React, { useState, useEffect } from 'react';
import { Bug, X, Upload, History, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { submitBugReportAction, getUserBugReportsAction } from '../lib/actions';
import { BugStatus } from '@prisma/client';

type Tab = 'report' | 'history';

interface BugReport {
  id: string;
  description: string;
  status: BugStatus;
  adminReply: string | null;
  createdAt: Date;
  screenshot: string | null;
}

export const BugReportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('report');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [myReports, setMyReports] = useState<BugReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      fetchReports();
    }
  }, [isOpen, activeTab]);

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const reports = await getUserBugReportsAction();
      setMyReports(reports);
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let screenshotUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success) {
          screenshotUrl = data.url;
        }
      }

      await submitBugReportAction(description, screenshotUrl || undefined);
      setDescription('');
      setFile(null);
      setActiveTab('history'); // Switch to history to see the new report
      fetchReports();
    } catch (error) {
      console.error("Failed to submit bug report", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: BugStatus) => {
    switch (status) {
      case 'OPEN': return 'text-yellow-500';
      case 'IN_PROGRESS': return 'text-blue-500';
      case 'RESOLVED': return 'text-green-500';
      case 'CLOSED': return 'text-zinc-500';
      default: return 'text-zinc-500';
    }
  };

  const getStatusIcon = (status: BugStatus) => {
    switch (status) {
      case 'OPEN': return <AlertCircle size={16} />;
      case 'IN_PROGRESS': return <Clock size={16} />;
      case 'RESOLVED': return <CheckCircle size={16} />;
      case 'CLOSED': return <X size={16} />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium text-zinc-300 transition-all shadow-lg hover:shadow-xl hover:scale-105"
      >
        <Bug size={16} />
        <span>Report a Bug</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 shrink-0">
              <h3 className="text-lg font-semibold text-white">Bug Reports</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-white/10 shrink-0">
                <button 
                    onClick={() => setActiveTab('report')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'report' ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                    New Report
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                    History
                </button>
            </div>

            <div className="overflow-y-auto p-6">
                {activeTab === 'report' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                        Issue Description
                        </label>
                        <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what happened..."
                        className="w-full h-32 px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                        Screenshot (Optional)
                        </label>
                        <div className="relative border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-zinc-500 hover:bg-white/5 transition-colors cursor-pointer overflow-hidden">
                           <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                           />
                           {file ? (
                               <div className="text-blue-400 flex items-center gap-2">
                                   <CheckCircle size={16} />
                                   <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                               </div>
                           ) : (
                               <>
                                <Upload size={20} className="mb-2" />
                                <span className="text-xs">Click to upload screenshot</span>
                               </>
                           )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                        type="submit"
                        disabled={uploading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                        {uploading ? (
                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : 'Submit Report'}
                        </button>
                    </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        {loadingReports ? (
                             <div className="flex justify-center py-8">
                                 <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                             </div>
                        ) : myReports.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500">
                                <History size={32} className="mx-auto mb-3 opacity-50" />
                                <p>No reports found.</p>
                            </div>
                        ) : (
                            myReports.map(report => (
                                <div key={report.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-white/5 ${getStatusColor(report.status)}`}>
                                                {getStatusIcon(report.status)}
                                                {report.status}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-zinc-300 text-sm whitespace-pre-wrap">{report.description}</p>
                                    
                                    {report.screenshot && (
                                        <a href={report.screenshot} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline">
                                            View Screenshot
                                        </a>
                                    )}

                                    {report.adminReply && (
                                        <div className="mt-3 pt-3 border-t border-white/10 bg-blue-500/5 -mx-4 px-4 pb-1">
                                            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-1 mt-2">
                                                <MessageSquare size={14} />
                                                Admin Reply
                                            </div>
                                            <p className="text-zinc-300 text-sm">{report.adminReply}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

