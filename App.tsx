import React, { useState, useEffect, useCallback } from 'react';
import { Gathering, AppData } from './types';
import * as db from './services/database';
import { GatheringList } from './components/GatheringList';
import { GatheringDetail } from './components/GatheringDetail';
import { MemberList } from './components/MemberList';
import { Header } from './components/Header';
import { Modal } from './components/Modal';
import { Button } from './components/Button';
import { useTranslation } from './i18n';

export default function App() {
    const { t } = useTranslation();
    const [gatherings, setGatherings] = useState<Gathering[]>([]);
    const [mainView, setMainView] = useState<'gatherings' | 'members'>('gatherings');
    const [selectedGatheringId, setSelectedGatheringId] = useState<string | null>(null);
    
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [importData, setImportData] = useState('');
    const [exportData, setExportData] = useState('');
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(''), 3000);
    };

    const refreshGatherings = useCallback(() => {
        setGatherings(db.listGatherings());
    }, []);

    useEffect(() => {
        refreshGatherings();
    }, [refreshGatherings]);

    const handleSelectGathering = (id: string) => {
        setSelectedGatheringId(id);
    };

    const handleBackToGatheringList = () => {
        setSelectedGatheringId(null);
        refreshGatherings();
    };
    
    const handleNavigate = (view: 'gatherings' | 'members') => {
        setSelectedGatheringId(null); // Always reset detail view on main navigation
        setMainView(view);
    };

    const handleExportClick = () => {
        const data = db.exportData();
        setExportData(data);
        setExportModalOpen(true);
    };

    const handleImportClick = () => {
        setImportData('');
        setError('');
        setImportModalOpen(true);
    };

    const handleImport = () => {
        setError('');
        if (!importData.trim()) {
            setError(t('errorImportPaste'));
            return;
        }
        try {
            db.importData(importData);
            refreshGatherings();
            setImportModalOpen(false);
            showNotification(t('notificationImportSuccess'));
            // After import, stay on the current view or default to gatherings
            setMainView(currentView => currentView);
        } catch (e: any) {
            setError(e.message);
        }
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(exportData).then(() => {
            showNotification(t('notificationCopied'));
        }, (err) => {
            setError(t('errorCopyFailed'));
        });
    }

    const renderContent = () => {
        if (mainView === 'members') {
            return <MemberList />;
        }
        
        // mainView is 'gatherings'
        if (selectedGatheringId) {
            return <GatheringDetail
                        gatheringId={selectedGatheringId}
                        onBack={handleBackToGatheringList}
                        refreshGatherings={refreshGatherings}
                    />;
        }
        
        return <GatheringList
                    gatherings={gatherings}
                    onSelectGathering={handleSelectGathering}
                    refreshGatherings={refreshGatherings}
                />;
    }

    return (
        <>
            <Header 
                onImportClick={handleImportClick} 
                onExportClick={handleExportClick} 
                currentView={mainView}
                onNavigate={handleNavigate}
            />
            <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                {renderContent()}
            </main>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-5 right-5 bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out">
                    {notification}
                </div>
            )}
            
            {/* Export Modal */}
            <Modal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} title={t('exportDataTitle')}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t('exportDataBody')}</p>
                    <textarea 
                        readOnly
                        value={exportData}
                        className="w-full h-32 p-2 border rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-xs"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-end">
                        <Button onClick={copyToClipboard}>{t('copyToClipboard')}</Button>
                    </div>
                </div>
            </Modal>
            
            {/* Import Modal */}
            <Modal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} title={t('importDataTitle')}>
                 <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t('importDataBody')} <strong className="text-red-500">{t('importWarning')}</strong></p>
                    <textarea 
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder={t('importPlaceholder')}
                        className="w-full h-32 p-2 border rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-xs focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleImport} variant="danger">{t('importAndOverwrite')}</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
