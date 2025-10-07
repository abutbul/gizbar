
import { AppData, Gathering, GatheringStatus, GlobalMember, GatheringMember, Expense, Payment, MemberBalance, GatheringTotals, GlobalMemberBalance } from '../types.ts';

const DB_KEY = 'gatheringsDB_v2'; // New key for the new data structure

// --- Data Persistence ---

const loadData = (): AppData => {
    try {
        const data = localStorage.getItem(DB_KEY);
        if (data) {
            const parsedData = JSON.parse(data);
            // Ensure both keys exist for backward compatibility with empty state
            return {
                gatherings: parsedData.gatherings || [],
                globalMembers: parsedData.globalMembers || [],
            };
        }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
    }
    // Default structure
    return { gatherings: [], globalMembers: [] };
};

const saveData = (data: AppData): void => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
};

// --- Calculation Helpers ---

export const getGatheringTotals = (gathering: Gathering): GatheringTotals => {
    const totalExpenses = gathering.members.reduce((sum, member) => {
        return sum + member.expenses.reduce((memSum, exp) => memSum + exp.amount, 0);
    }, 0);
    const totalPayments = gathering.members.reduce((sum, member) => {
        return sum + member.payments.reduce((memSum, pay) => memSum + pay.amount, 0);
    }, 0);
    const expensePerMember = gathering.members.length > 0 ? totalExpenses / gathering.members.length : 0;

    return { totalExpenses, totalPayments, expensePerMember };
};

export const getGatheringMembersWithBalance = (gathering: Gathering): MemberBalance[] => {
    const data = loadData();
    const { expensePerMember } = getGatheringTotals(gathering);

    return gathering.members.map(gatheringMember => {
        const globalMember = data.globalMembers.find(gm => gm.id === gatheringMember.memberId);
        
        const totalExpenses = gatheringMember.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalPayments = gatheringMember.payments.reduce((sum, pay) => sum + pay.amount, 0);
        const balance = totalExpenses + totalPayments - expensePerMember;

        let status: 'settled' | 'isOwedMoney' | 'owesMoney';
        if (Math.abs(balance) < 0.01) {
            status = 'settled';
        } else if (balance > 0) {
            status = 'isOwedMoney';
        } else {
            status = 'owesMoney';
        }

        return {
            memberId: gatheringMember.memberId,
            name: globalMember?.name || 'Unknown Member',
            totalExpenses,
            totalPayments,
            balance,
            status
        };
    }).sort((a, b) => a.name.localeCompare(b.name));
};

export const getGlobalMemberBalances = (): GlobalMemberBalance[] => {
    const data = loadData();
    if (!data.globalMembers) return [];

    return data.globalMembers.map(globalMember => {
        let totalExpenses = 0;
        let totalPayments = 0;
        let netBalance = 0;

        data.gatherings.forEach(gathering => {
            const gatheringMember = gathering.members.find(m => m.memberId === globalMember.id);
            if (gatheringMember) {
                const { expensePerMember } = getGatheringTotals(gathering);
                const memberTotalExpenses = gatheringMember.expenses.reduce((sum, exp) => sum + exp.amount, 0);
                const memberTotalPayments = gatheringMember.payments.reduce((sum, pay) => sum + pay.amount, 0);

                totalExpenses += memberTotalExpenses;
                totalPayments += memberTotalPayments;
                netBalance += (memberTotalExpenses + memberTotalPayments - expensePerMember);
            }
        });

        return {
            ...globalMember,
            totalExpenses,
            totalPayments,
            netBalance
        };
    });
};


// --- Core API ---

// Global Members
export const listGlobalMembers = (): GlobalMember[] => {
    return loadData().globalMembers.sort((a, b) => a.name.localeCompare(b.name));
};

export const createGlobalMember = (name: string): GlobalMember => {
    const data = loadData();
    if (data.globalMembers.some(m => m.name.toLowerCase() === name.toLowerCase())) {
        throw new Error(`A member named '${name}' already exists.`);
    }
    const newMember: GlobalMember = {
        id: `global-${Date.now()}`,
        name
    };
    data.globalMembers.push(newMember);
    saveData(data);
    return newMember;
};


// Gatherings
export const listGatherings = (): Gathering[] => {
    return loadData().gatherings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getGathering = (id: string): Gathering | undefined => {
    const data = loadData();
    return data.gatherings.find(g => g.id === id);
};

export const createGathering = (id: string, description: string): Gathering => {
    const data = loadData();
    if (data.gatherings.some(g => g.id === id)) {
        throw new Error(`Gathering with ID '${id}' already exists`);
    }

    const newGathering: Gathering = {
        id,
        description,
        status: GatheringStatus.OPEN,
        createdAt: new Date().toISOString(),
        members: [],
    };

    data.gatherings.push(newGathering);
    saveData(data);
    return newGathering;
};

export const deleteGathering = (id: string): void => {
    let data = loadData();
    data.gatherings = data.gatherings.filter(g => g.id !== id);
    saveData(data);
};

export const addMemberToGathering = (gatheringId: string, memberId: string): Gathering => {
    const data = loadData();
    const gathering = data.gatherings.find(g => g.id === gatheringId);
    if (!gathering) throw new Error("Gathering not found");
    if (gathering.members.some(m => m.memberId === memberId)) throw new Error("Member already in gathering");

    const newGatheringMember: GatheringMember = {
        memberId,
        expenses: [],
        payments: []
    };
    gathering.members.push(newGatheringMember);
    saveData(data);
    return gathering;
};

export const removeMemberFromGathering = (gatheringId: string, memberId: string): Gathering => {
    const data = loadData();
    const gathering = data.gatherings.find(g => g.id === gatheringId);
    if (!gathering) throw new Error("Gathering not found");
    
    gathering.members = gathering.members.filter(m => m.memberId !== memberId);
    saveData(data);
    return gathering;
}

export const addExpense = (gatheringId: string, memberId: string, amount: number): Gathering => {
    const data = loadData();
    const gathering = data.gatherings.find(g => g.id === gatheringId);
    if (!gathering) throw new Error("Gathering not found");
    if (gathering.status === GatheringStatus.CLOSED) throw new Error("Cannot add expense to closed gathering");
    if (amount <= 0) throw new Error("Expense amount must be positive");

    const member = gathering.members.find(m => m.memberId === memberId);
    if (!member) throw new Error("Member not found in this gathering");

    const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        amount,
        createdAt: new Date().toISOString(),
    };
    member.expenses.push(newExpense);
    saveData(data);
    return gathering;
};

export const recordPayment = (gatheringId: string, memberId: string, amount: number): Gathering => {
    const data = loadData();
    const gathering = data.gatherings.find(g => g.id === gatheringId);
    if (!gathering) throw new Error("Gathering not found");
    if (gathering.status === GatheringStatus.CLOSED) throw new Error("Cannot record payment in closed gathering");
    
    const member = gathering.members.find(m => m.memberId === memberId);
    if (!member) throw new Error("Member not found in this gathering");

    const newPayment: Payment = {
        id: `pay-${Date.now()}`,
        amount,
        createdAt: new Date().toISOString(),
    };
    member.payments.push(newPayment);
    saveData(data);
    return gathering;
};

export const closeGathering = (gatheringId: string): Gathering => {
    const data = loadData();
    const gathering = data.gatherings.find(g => g.id === gatheringId);
    if (!gathering) throw new Error("Gathering not found");
    if (gathering.status === GatheringStatus.CLOSED) return gathering;

    // Settle all balances before closing
    const membersWithBalance = getGatheringMembersWithBalance(gathering);
    membersWithBalance.forEach(memberBalance => {
        if (Math.abs(memberBalance.balance) >= 0.01) {
            const settlementAmount = -memberBalance.balance;
            const memberInGathering = gathering.members.find(m => m.memberId === memberBalance.memberId);
            if (memberInGathering) {
                const settlementPayment: Payment = {
                    id: `settle-${Date.now()}-${memberBalance.memberId}`,
                    amount: settlementAmount,
                    createdAt: new Date().toISOString(),
                };
                memberInGathering.payments.push(settlementPayment);
            }
        }
    });

    gathering.status = GatheringStatus.CLOSED;
    saveData(data);
    return gathering;
};

// Data Import/Export
export const exportData = (): string => {
    const data = loadData();
    const jsonString = JSON.stringify(data);
    // Safely handle UTF-8 strings for btoa by escaping them first.
    return btoa(unescape(encodeURIComponent(jsonString)));
};

export const importData = (base64Data: string): AppData => {
    try {
        // Safely decode base64 that might contain UTF-8 characters.
        const jsonString = decodeURIComponent(escape(atob(base64Data)));
        const data: AppData = JSON.parse(jsonString);
        // Basic validation for the new structure
        if (!data || !Array.isArray(data.gatherings) || !Array.isArray(data.globalMembers)) {
            throw new Error("Invalid data format");
        }
        saveData(data);
        return data;
    } catch (error) {
        console.error("Import failed", error);
        throw new Error("Failed to import data. Please check the format.");
    }
};