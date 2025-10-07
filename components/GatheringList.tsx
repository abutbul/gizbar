
import React, { useState, useMemo } from 'react';
import { Gathering, GatheringStatus } from '../types.ts';
import { Button } from './Button.tsx';
import { Modal } from './Modal.tsx';
import { Input } from './Input.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';
import * as db from '../services/database.ts';
import { useTranslation } from '../i18n/index.ts';

interface GatheringListProps {
    gatherings: Gathering[];
    onSelectGathering: (id: string) => void;
    refreshGatherings: () => void;
}

const formatDate = (dateString: string, locale: string) => {
    // Use 'he' for Hebrew locale to get correct date formatting
    const displayLocale = locale === 'he' ? 'he-IL' : locale;
    return new Date(dateString).toLocaleDateString(displayLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const GatheringCard: React.FC<{ gathering: Gathering, onSelect: () => void }> = ({ gathering, onSelect }) => {
    const { t, language } = useTranslation();
    const { totalExpenses } = db.getGatheringTotals(gathering);
    const statusColor = gathering.status === GatheringStatus.OPEN ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    
    return (
        <div onClick={onSelect} className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{gathering.description}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{gathering.id}</p>
                </div>
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>{gathering.status}</span>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('totalExpenses')}</p>
                    <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{t('currencySymbol')}{totalExpenses.toFixed(2)}</p>
                </div>
                <div className="text-end">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('membersCount', { count: gathering.members.length })}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(gathering.createdAt, language)}</p>
                </div>
            </div>
        </div>
    );
};

export const GatheringList: React.FC<GatheringListProps> = ({ gatherings, onSelectGathering, refreshGatherings }) => {
    const { t } = useTranslation();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [id, setId] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [showOnlyOpen, setShowOnlyOpen] = useState(true);

    const filteredGatherings = useMemo(() => {
        return showOnlyOpen ? gatherings.filter(g => g.status === GatheringStatus.OPEN) : gatherings;
    }, [gatherings, showOnlyOpen]);

    const handleCreate = () => {
        setError('');
        if (!id.trim() || !description.trim()) {
            setError(t('errorRequired'));
            return;
        }
        try {
            db.createGathering(id, description);
            refreshGatherings();
            setCreateModalOpen(false);
            setId('');
            setDescription('');
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">{t('yourGatherings')}</h2>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center">
                        <input
                            id="show-open-only"
                            name="show-open-only"
                            type="checkbox"
                            checked={showOnlyOpen}
                            onChange={(e) => setShowOnlyOpen(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-transparent"
                        />
                        <label htmlFor="show-open-only" className="ltr:ml-2 rtl:mr-2 block text-sm text-slate-700 dark:text-slate-300">
                            {t('showOpenOnly')}
                        </label>
                    </div>
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                        {t('newGathering')}
                    </Button>
                </div>
            </div>
            {gatherings.length > 0 ? (
                filteredGatherings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredGatherings.map(g => (
                            <GatheringCard key={g.id} gathering={g} onSelect={() => onSelectGathering(g.id)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        <h3 className="text-xl font-medium">{t('noOpenGatherings')}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('noOpenGatheringsHint')}</p>
                    </div>
                )
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    <h3 className="text-xl font-medium">{t('noGatherings')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{t('noGatheringsHint')}</p>
                </div>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title={t('createGatheringTitle')}>
                <div className="space-y-4">
                    <Input label={t('gatheringId')} placeholder={t('gatheringIdPlaceholder')} value={id} onChange={(e) => setId(e.target.value)} />
                    <Input label={t('description')} placeholder={t('descriptionPlaceholder')} value={description} onChange={(e) => setDescription(e.target.value)} />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleCreate}>{t('create')}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};