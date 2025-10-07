
import React, { useState } from 'react';
import { Button } from './Button.tsx';
import { Input } from './Input.tsx';
import { useTranslation } from '../i18n/index.ts';
import * as db from '../services/database.ts';
import { Gathering, GatheringStatus } from '../types.ts';

export const Reports: React.FC = () => {
    const { t } = useTranslation();
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    const [csvData, setCsvData] = useState('');

    const generateCSV = () => {
        setError('');
        setCsvData('');

        // Validate date range
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            setError(t('errorInvalidDateRange'));
            return;
        }

        const gatherings = db.listGatherings();
        
        // Filter gatherings by date range
        const filteredGatherings = gatherings.filter(g => {
            const gatheringDate = new Date(g.createdAt);
            const start = startDate ? new Date(startDate) : new Date('1970-01-01');
            const end = endDate ? new Date(endDate) : new Date('2100-12-31');
            return gatheringDate >= start && gatheringDate <= end;
        });

        if (filteredGatherings.length === 0) {
            setError(t('noDataInRange'));
            return;
        }

        // Generate CSV content
        const csvLines: string[] = [];
        
        // CSV Header
        csvLines.push('Gathering ID,Date Opened,Date Closed,Status,Member ID,Member Name,Total Expenses,Total Payments,Balance');

        filteredGatherings.forEach((gathering: Gathering) => {
            // Find the latest date from the gathering's transactions
            let closedDate = '';
            if (gathering.status === GatheringStatus.CLOSED) {
                let latestDate = new Date(gathering.createdAt);
                gathering.members.forEach(member => {
                    member.expenses.forEach(exp => {
                        const expDate = new Date(exp.createdAt);
                        if (expDate > latestDate) latestDate = expDate;
                    });
                    member.payments.forEach(pay => {
                        const payDate = new Date(pay.createdAt);
                        if (payDate > latestDate) latestDate = payDate;
                    });
                });
                closedDate = latestDate.toISOString();
            }
            
            if (gathering.members.length === 0) {
                // Gathering with no members
                csvLines.push(`"${gathering.id}","${gathering.createdAt}","${closedDate}","${gathering.status}",,,,0.00,0.00,0.00`);
            } else {
                // Get member balances
                const membersWithBalance = db.getGatheringMembersWithBalance(gathering);
                
                membersWithBalance.forEach((member, index) => {
                    const row = [
                        index === 0 ? `"${gathering.id}"` : '""', // Only show gathering info on first row
                        index === 0 ? `"${gathering.createdAt}"` : '""',
                        index === 0 ? `"${closedDate}"` : '""',
                        index === 0 ? `"${gathering.status}"` : '""',
                        `"${member.memberId}"`,
                        `"${member.name}"`,
                        member.totalExpenses.toFixed(2),
                        member.totalPayments.toFixed(2),
                        member.balance.toFixed(2)
                    ];
                    csvLines.push(row.join(','));
                });
            }
        });

        const csv = csvLines.join('\n');
        setCsvData(csv);
    };

    const downloadCSV = () => {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const filename = `gathering-report-${startDate || 'all'}-to-${endDate || 'all'}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-4">{t('reportsTitle')}</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input 
                            label={t('startDate')} 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                        <Input 
                            label={t('endDate')} 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="pt-2">
                        <Button onClick={generateCSV}>{t('generateReport')}</Button>
                    </div>
                </div>
            </div>

            {csvData && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 space-y-4">
                    <h3 className="text-lg font-semibold">{t('reportGenerated')}</h3>
                    <textarea 
                        readOnly
                        value={csvData}
                        className="w-full h-64 p-3 border rounded-md bg-slate-100 dark:bg-slate-700 font-mono text-xs overflow-auto"
                    />
                    <div className="flex justify-end">
                        <Button onClick={downloadCSV}>{t('downloadReport')}</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
