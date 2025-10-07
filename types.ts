export enum GatheringStatus {
    OPEN = "open",
    CLOSED = "closed"
}

export interface Expense {
    id: string;
    amount: number;
    createdAt: string;
}

export interface Payment {
    id: string;
    amount: number;
    createdAt: string;
}

// Represents a member's data *within* a specific gathering
export interface GatheringMember {
    memberId: string; // Foreign key to GlobalMember
    expenses: Expense[];
    payments: Payment[];
}

// Represents a member across the entire application
export interface GlobalMember {
    id: string;
    name: string;
}

export interface Gathering {
    id: string;
    description: string;
    status: GatheringStatus;
    createdAt: string;
    members: GatheringMember[];
}

export interface AppData {
    gatherings: Gathering[];
    globalMembers: GlobalMember[];
}

// For displaying member details within a gathering
export interface MemberBalance {
    memberId: string;
    name: string;
    totalExpenses: number;
    totalPayments: number;
    balance: number;
    status: 'settled' | 'isOwedMoney' | 'owesMoney';
}

// For displaying member details on the global members page
export interface GlobalMemberBalance extends GlobalMember {
    totalExpenses: number;
    totalPayments: number;
    netBalance: number;
}


export interface GatheringTotals {
    totalExpenses: number;
    totalPayments: number;
    expensePerMember: number;
}
