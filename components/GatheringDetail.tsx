
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Gathering, MemberBalance, GatheringStatus, GlobalMember } from '../types.ts';
import * as db from '../services/database.ts';
import { Button } from './Button.tsx';
import { Modal } from './Modal.tsx';
import { Input } from './Input.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { useTranslation } from '../i18n/index.ts';

interface GatheringDetailProps {
    gatheringId: string;
    onBack: () => void;
    refreshGatherings: () => void;
}

const statusClasses = {
    'settled': 'text-slate-500 dark:text-slate-400',
    'isOwedMoney': 'text-green-600 dark:text-green-400',
    'owesMoney': 'text-red-600 dark:text-red-400',
};

export const GatheringDetail: React.FC<GatheringDetailProps> = ({ gatheringId, onBack, refreshGatherings }) => {
    const { t } = useTranslation();
    const [gathering, setGathering] = useState<Gathering | null>(db.getGathering(gatheringId) || null);
    
    // Modals states
    const [expenseModalMember, setExpenseModalMember] = useState<MemberBalance | null>(null);
    const [paymentModalMember, setPaymentModalMember] = useState<MemberBalance | null>(null);
    const [addMemberModal, setAddMemberModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState<'close' | 'delete' | 'removeMember' | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<MemberBalance | null>(null);
    
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const refreshData = useCallback(() => {
        const freshGathering = db.getGathering(gatheringId);
        setGathering(freshGathering || null);
        if (!freshGathering) {
            onBack();
        }
        refreshGatherings();
    }, [gatheringId, refreshGatherings, onBack]);

    const { expensePerMember, totalExpenses } = useMemo(() => {
        if (!gathering) return { expensePerMember: 0, totalExpenses: 0 };
        return db.getGatheringTotals(gathering);
    }, [gathering]);

    const membersWithBalance = useMemo(() => {
        if (!gathering) return [];
        return db.getGatheringMembersWithBalance(gathering);
    }, [gathering]);

    const handleAddExpense = () => {
        if (!expenseModalMember || !gathering) return;
        setError('');
        try {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                setError(t('errorPositiveAmount')); return;
            }
            db.addExpense(gathering.id, expenseModalMember.memberId, numAmount);
            refreshData();
            setExpenseModalMember(null);
        } catch (e: any) { setError(e.message); }
    };
    
    const handleRecordPayment = () => {
        if (!paymentModalMember || !gathering) return;
        setError('');
        try {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount === 0) {
                setError(t('errorNonZeroAmount')); return;
            }
            db.recordPayment(gathering.id, paymentModalMember.memberId, numAmount);
            refreshData();
            setPaymentModalMember(null);
        } catch (e: any) { setError(e.message); }
    };

    const handleSettle = (member: MemberBalance) => {
        if (!gathering || gathering.status === GatheringStatus.CLOSED) return;
        const settlementAmount = -member.balance;
        if (Math.abs(settlementAmount) < 0.01) return; // Don't settle if already balanced
        try {
            db.recordPayment(gathering.id, member.memberId, settlementAmount);
            refreshData();
        } catch(e: any) {
            console.error("Failed to settle payment:", e.message);
            setError("Failed to settle payment."); // Optionally show error to user
        }
    };

    const handleCloseGathering = () => {
        if (!gathering) return;
        db.closeGathering(gathering.id);
        refreshData();
        setConfirmModal(null);
    }
    
    const handleDeleteGathering = () => {
        if (!gathering) return;
        db.deleteGathering(gathering.id);
        onBack();
    }

    const handleRemoveMember = () => {
        if (!memberToRemove || !gathering) return;
        db.removeMemberFromGathering(gathering.id, memberToRemove.memberId);
        refreshData();
        setConfirmModal(null);
        setMemberToRemove(null);
    }

    if (!gathering) {
        return <div className="text-center p-8">Gathering not found. <Button onClick={onBack}>Go Back</Button></div>;
    }
    
    const isClosed = gathering.status === GatheringStatus.CLOSED;

    return (
        <div className="space-y-8">
            <div>
                <Button onClick={onBack} variant="ghost" className="mb-4">
                    <ArrowLeftIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2 rtl:scale-x-[-1]" />
                    {t('backToGatherings')}
                </Button>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h2 className="text-3xl font-bold">{gathering.description}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{gathering.id}</p>
                        </div>
                        <div className="flex gap-2">
                           {!isClosed && <Button onClick={() => setConfirmModal('close')} variant="secondary">{t('close')}</Button>}
                           <Button onClick={() => setConfirmModal('delete')} variant="danger"><TrashIcon className="w-5 h-5"/></Button>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('totalExpenses')}</p>
                            <p className="text-2xl font-semibold">{t('currencySymbol')}{totalExpenses.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('expensePerMember')}</p>
                            <p className="text-2xl font-semibold">{t('currencySymbol')}{expensePerMember.toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('status')}</p>
                            <p className={`text-2xl font-semibold ${isClosed ? 'text-slate-500' : 'text-green-500'}`}>{gathering.status}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold">{t('members')} ({gathering.members.length})</h3>
                    {!isClosed && <Button onClick={() => setAddMemberModal(true)}><PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>{t('addMember')}</Button>}
                </div>
                <div className="space-y-3">
                    {membersWithBalance.length > 0 ? membersWithBalance.map(member => (
                        <div key={member.memberId} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex-1">
                                <p className="font-semibold">{member.name}</p>
                                <p className={`text-sm font-medium ${statusClasses[member.status]}`}>
                                    {member.status === 'settled'
                                        ? t('settled')
                                        : t(member.status, { amount: `${t('currencySymbol')}${Math.abs(member.balance).toFixed(2)}` })
                                    }
                                </p>
                            </div>
                            {!isClosed && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {member.status !== 'settled' && (
                                        <Button onClick={() => handleSettle(member)} variant="secondary" size="sm">{t('settle')}</Button>
                                    )}
                                    <Button onClick={() => { setPaymentModalMember(member); setAmount(''); setError(''); }} variant="secondary" size="sm">{t('payment')}</Button>
                                    <Button onClick={() => { setExpenseModalMember(member); setAmount(''); setError(''); }} size="sm">{t('expense')}</Button>
                                    <Button onClick={() => { setMemberToRemove(member); setConfirmModal('removeMember'); }} variant="ghost" className="p-2 h-auto"><TrashIcon className="w-4 h-4 text-red-500"/></Button>
                                </div>
                            )}
                        </div>
                    )) : (
                        <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-8">{t('noMembersInGathering')}</p>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AddMemberModal isOpen={addMemberModal} onClose={() => setAddMemberModal(false)} gathering={gathering} onMemberAdded={refreshData} />
            
            <Modal isOpen={!!expenseModalMember} onClose={() => setExpenseModalMember(null)} title={t('addExpenseTitle')}>
                <div className="space-y-4">
                    <p>{t('for')}: <span className="font-bold">{expenseModalMember?.name}</span></p>
                    <Input label={t('amount')} type="number" placeholder={t('amountExpensePlaceholder')} value={amount} onChange={(e) => setAmount(e.target.value)} />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-end"><Button onClick={handleAddExpense}>{t('addExpenseBtn')}</Button></div>
                </div>
            </Modal>
            
             <Modal isOpen={!!paymentModalMember} onClose={() => setPaymentModalMember(null)} title={t('recordPaymentTitle')}>
                <div className="space-y-4">
                    <p>{t('for')}: <span className="font-bold">{paymentModalMember?.name}</span></p>
                    <Input label={t('amount')} type="number" placeholder={t('amountPaymentPlaceholder')} value={amount} onChange={(e) => setAmount(e.target.value)} />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-end"><Button onClick={handleRecordPayment}>{t('recordPaymentBtn')}</Button></div>
                </div>
            </Modal>
            
            <ConfirmationModal isOpen={confirmModal === 'close'} onClose={() => setConfirmModal(null)} onConfirm={handleCloseGathering} title={t('closeGatheringTitle')} confirmText={t('confirm')} cancelText={t('cancel')}>
                <p>{t('closeGatheringBody')}</p>
            </ConfirmationModal>

            <ConfirmationModal isOpen={confirmModal === 'delete'} onClose={() => setConfirmModal(null)} onConfirm={handleDeleteGathering} title={t('deleteGatheringTitle')} confirmText={t('confirm')} cancelText={t('cancel')}>
                <p>{t('deleteGatheringBody')}</p>
            </ConfirmationModal>

            <ConfirmationModal isOpen={confirmModal === 'removeMember'} onClose={() => setConfirmModal(null)} onConfirm={handleRemoveMember} title={t('removeMemberTitle', { name: memberToRemove?.name || ''})} confirmText={t('confirm')} cancelText={t('cancel')}>
                <p>{t('removeMemberBody', { name: memberToRemove?.name || '' })}</p>
            </ConfirmationModal>
        </div>
    );
};

// Sub-component for Add Member Modal to encapsulate its logic
const AddMemberModal: React.FC<{isOpen: boolean, onClose: () => void, gathering: Gathering, onMemberAdded: () => void}> = ({isOpen, onClose, gathering, onMemberAdded}) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'select' | 'create'>('select');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [error, setError] = useState('');
    const [allGlobalMembers, setAllGlobalMembers] = useState<GlobalMember[]>([]);

    useEffect(() => {
        if (isOpen) {
            setAllGlobalMembers(db.listGlobalMembers());
            setView('select');
            setError('');
            setSelectedMemberId('');
            setNewMemberName('');
        }
    }, [isOpen]);

    const availableMembers = useMemo(() => {
        return allGlobalMembers.filter(gm => !gathering.members.some(gmInG => gmInG.memberId === gm.id));
    }, [allGlobalMembers, gathering]);

    useEffect(() => {
        if (availableMembers.length > 0) {
            setSelectedMemberId(availableMembers[0].id);
        } else {
            setSelectedMemberId('');
        }
    }, [availableMembers]);

    const handleAdd = () => {
        setError('');
        if (!selectedMemberId) {
            setError(t('errorSelectMember')); return;
        }
        try {
            db.addMemberToGathering(gathering.id, selectedMemberId);
            onMemberAdded();
            onClose();
        } catch (e: any) { setError(e.message); }
    };

    const handleCreateAndAdd = () => {
        setError('');
        if (!newMemberName.trim()) {
            setError(t('errorEnterName')); return;
        }
        try {
            const newMember = db.createGlobalMember(newMemberName);
            db.addMemberToGathering(gathering.id, newMember.id);
            onMemberAdded();
            onClose();
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                setError(t('errorMemberExists', { name: newMemberName }));
            } else {
                setError(e.message);
            }
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('addMemberToGatheringTitle')}>
            {view === 'select' ? (
                <div className="space-y-4">
                    {availableMembers.length > 0 ? (
                        <>
                            <label htmlFor="member-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('selectExistingMember')}</label>
                            <select
                                id="member-select"
                                value={selectedMemberId}
                                onChange={e => setSelectedMemberId(e.target.value)}
                                className="block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200"
                            >
                                {availableMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="pt-2 flex justify-end"><Button onClick={handleAdd}>{t('addSelectedMember')}</Button></div>
                        </>
                    ) : (
                        <p className="text-center text-slate-500">{t('noMembersToAdd')}</p>
                    )}

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-300 dark:border-slate-600" /></div>
                      <div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-slate-800 text-sm text-slate-500">{t('or')}</span></div>
                    </div>
                    <Button onClick={() => setView('create')} variant="secondary" className="w-full">{t('createNewMember')}</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <Input label={t('newMemberName')} placeholder={t('enterNamePlaceholder')} value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-between items-center">
                        <Button onClick={() => setView('select')} variant="ghost">{t('back')}</Button>
                        <Button onClick={handleCreateAndAdd}>{t('createAndAdd')}</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};