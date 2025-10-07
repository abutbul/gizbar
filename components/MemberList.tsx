
import React, { useState, useEffect, useCallback } from 'react';
import { GlobalMemberBalance } from '../types.ts';
import { Button } from './Button.tsx';
import { Modal } from './Modal.tsx';
import { Input } from './Input.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';
import * as db from '../services/database.ts';
import { useTranslation } from '../i18n/index.ts';

const BalanceCard: React.FC<{ member: GlobalMemberBalance }> = ({ member }) => {
    const { t } = useTranslation();
    
    let balanceColor = 'text-slate-500 dark:text-slate-400';
    if (member.netBalance > 0.01) balanceColor = 'text-green-600 dark:text-green-400';
    if (member.netBalance < -0.01) balanceColor = 'text-red-600 dark:text-red-400';
    
    const balanceAmount = `${t('currencySymbol')}${Math.abs(member.netBalance).toFixed(2)}`;
    const balanceText = member.netBalance > 0.01 
        ? t('isOwedMoney', { amount: balanceAmount })
        : member.netBalance < -0.01
        ? t('owesMoney', { amount: balanceAmount })
        : t('settledUp');

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 flex justify-between items-center">
            <div>
                <p className="text-lg font-semibold">{member.name}</p>
                <p className={`text-sm font-medium ${balanceColor}`}>{balanceText}</p>
            </div>
            <div className="text-end">
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('paid')}: {t('currencySymbol')}{member.totalExpenses.toFixed(2)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('reimbursed')}: {t('currencySymbol')}{(-member.totalPayments).toFixed(2)}</p>
            </div>
        </div>
    );
};

export const MemberList: React.FC = () => {
    const { t } = useTranslation();
    const [members, setMembers] = useState<GlobalMemberBalance[]>([]);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    const refreshMembers = useCallback(() => {
        setMembers(db.getGlobalMemberBalances());
    }, []);

    useEffect(() => {
        refreshMembers();
    }, [refreshMembers]);

    const handleCreate = () => {
        setError('');
        if (!newName.trim()) {
            setError(t('errorNameEmpty'));
            return;
        }
        try {
            db.createGlobalMember(newName);
            refreshMembers();
            setCreateModalOpen(false);
            setNewName('');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                setError(t('errorMemberExists', { name: newName }));
            } else {
                setError(e.message);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold">{t('allMembers')}</h2>
                <Button onClick={() => setCreateModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                    {t('newMember')}
                </Button>
            </div>
            {members.length > 0 ? (
                <div className="space-y-3">
                    {members.map(m => (
                        <BalanceCard key={m.id} member={m} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    <h3 className="text-xl font-medium">{t('noMembers')}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">{t('noMembersHint')}</p>
                </div>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title={t('createMemberTitle')}>
                <div className="space-y-4">
                    <Input label={t('newMemberName')} placeholder={t('memberNamePlaceholder')} value={newName} onChange={(e) => setNewName(e.target.value)} />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2 flex justify-end">
                        <Button onClick={handleCreate}>{t('createMember')}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};