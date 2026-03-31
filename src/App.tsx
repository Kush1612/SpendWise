import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  History, 
  PlusCircle, 
  BarChart3, 
  User, 
  Bell, 
  X, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  UtensilsCrossed,
  ShoppingCart,
  Plane,
  CreditCard,
  Dumbbell,
  Film,
  MoreHorizontal,
  Car,
  Bolt,
  Laptop,
  DollarSign,
  AlertCircle,
  Download,
  Trash2,
  Plus
} from 'lucide-react';
import { Screen, Transaction, UserProfile, RecurringBill } from './types';
import { CATEGORIES } from './constants';
import { cn } from './lib/utils';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc 
} from './firebase';
import { Timestamp } from 'firebase/firestore';

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="bg-surface-container p-8 rounded-[2rem] border border-secondary/20 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="font-headline text-2xl font-bold">System Error</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-secondary text-black font-headline font-bold rounded-xl uppercase tracking-widest text-xs"
            >
              Restart Session
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

// --- Components ---

const TopNav = ({ screen, onBack, onProfile, photoURL }: { screen: Screen, onBack: () => void, onProfile: () => void, photoURL?: string | null }) => {
  if (screen === 'login') return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex justify-between items-center px-6 h-20">
      <div className="flex items-center gap-4">
        {screen === 'add' ? (
          <button onClick={onBack} className="p-2 hover:bg-white/10 transition-colors rounded-full">
            <X className="w-6 h-6 text-on-surface" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden cursor-pointer" onClick={onProfile}>
            <img 
              src={photoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"} 
              alt="Profile" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="font-headline tracking-tight font-bold text-2xl text-primary-container">SpendWise</h1>
      </div>
      <button className="p-2 hover:bg-white/10 transition-colors rounded-full">
        <Bell className="w-6 h-6 text-primary-container" />
      </button>
    </nav>
  );
};

const BottomNav = ({ currentScreen, onNavigate }: { currentScreen: Screen, onNavigate: (s: Screen) => void }) => {
  if (currentScreen === 'login') return null;

  const navItems: { screen: Screen; icon: any }[] = [
    { screen: 'dashboard', icon: Home },
    { screen: 'history', icon: History },
    { screen: 'add', icon: PlusCircle },
    { screen: 'analytics', icon: BarChart3 },
    { screen: 'profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-8 pb-4 bg-surface/80 backdrop-blur-2xl h-20 rounded-t-[2rem] z-50 shadow-[0_-10px_40px_rgba(204,255,0,0.05)]">
      {navItems.map(({ screen, icon: Icon }) => (
        <button
          key={screen}
          onClick={() => onNavigate(screen)}
          className={cn(
            "p-3 transition-all duration-300 rounded-full",
            currentScreen === screen 
              ? "bg-primary-container text-black scale-110 shadow-[0_0_15px_#CCFF00]" 
              : "text-on-surface-variant hover:text-primary"
          )}
        >
          <Icon className="w-6 h-6" />
        </button>
      ))}
    </nav>
  );
};

// --- Screens ---

const LoginScreen = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden bg-background">
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-tertiary/5 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <header className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(202,253,0,0.25)]">
            <PlusCircle className="w-10 h-10 text-black" />
          </div>
          <h1 className="font-headline font-bold text-4xl tracking-tighter">
            Spend<span className="text-primary-container">Wise</span>
          </h1>
          <p className="font-headline text-[10px] text-on-surface-variant tracking-[0.3em] uppercase mt-3 font-semibold">
            Intelligence in Operations
          </p>
        </header>

        <div className="bg-surface/60 backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/5">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
            <div className="space-y-2">
              <label className="block font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold ml-1">Access ID</label>
              <div className="bg-black/20 border border-outline/20 rounded-2xl flex items-center px-5 py-4 focus-within:border-primary/50 transition-all">
                <span className="text-outline/60 mr-3">@</span>
                <input 
                  type="email" 
                  placeholder="user@spendwise.network" 
                  className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/40 font-headline font-medium tracking-tight text-lg outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Encrypted Key</label>
                <button type="button" className="font-headline text-[9px] uppercase tracking-wider text-primary font-bold">Reset Link</button>
              </div>
              <div className="bg-black/20 border border-outline/20 rounded-2xl flex items-center px-5 py-4 focus-within:border-primary/50 transition-all">
                <Bolt className="w-5 h-5 text-outline/60 mr-3" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline/40 font-headline text-lg outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-br from-primary-dim via-primary-container to-primary-fixed text-black font-headline font-bold py-5 rounded-2xl text-lg uppercase tracking-tight shadow-[0_8px_24px_-6px_rgba(202,253,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Authorize Session
            </button>
          </form>

          <div className="relative flex items-center py-10">
            <div className="flex-grow border-t border-outline-variant/10"></div>
            <span className="flex-shrink mx-4 font-headline text-[9px] uppercase tracking-[0.25em] text-on-surface-variant font-bold">Gateway Sync</span>
            <div className="flex-grow border-t border-outline-variant/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="bg-surface-container/50 hover:bg-surface-container-high border border-white/5 transition-all rounded-2xl py-4 flex items-center justify-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Google</span>
            </button>
            <button className="bg-surface-container/50 hover:bg-surface-container-high border border-white/5 transition-all rounded-2xl py-4 flex items-center justify-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Apple</span>
            </button>
          </div>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            Non-registered entity? 
            <button className="text-primary font-headline font-bold hover:underline ml-1">Create Node</button>
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

const DashboardScreen = ({ transactions, currency = '$' }: { transactions: Transaction[], currency?: string }) => {
  const totalBalance = transactions.reduce((acc, tx) => 
    tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0
  );
  const totalInflow = transactions.filter(tx => tx.type === 'income').reduce((acc, tx) => acc + tx.amount, 0);
  const totalOutflow = transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);

  // Calculate growth vs last month (simulated for now based on current transactions)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthTransactions = transactions.filter(tx => new Date(tx.date) >= new Date(now.getFullYear(), now.getMonth(), 1));
  const lastMonthTransactions = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d >= lastMonth && d < new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const currentMonthBalance = currentMonthTransactions.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0);
  const lastMonthBalance = lastMonthTransactions.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0);
  
  const growth = lastMonthBalance === 0 ? 0 : ((currentMonthBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100;

  // Monthly goal (simulated)
  const monthlyGoal = 5000;
  const goalProgress = Math.min(Math.round((totalInflow / monthlyGoal) * 100), 100);

  // Budget usage (simulated)
  const monthlyBudget = 3000;
  const budgetUsage = Math.min(Math.round((totalOutflow / monthlyBudget) * 100), 100);

  const balanceParts = totalBalance.toFixed(2).split('.');

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-8">
      <section className="bg-surface-container-high p-8 rounded-[2.5rem] space-y-6 border border-white/5">
        <div>
          <p className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] mb-1">Total Net Liquidity</p>
          <h2 className="font-headline text-5xl font-bold tracking-tighter">
            {currency}{parseInt(balanceParts[0]).toLocaleString()}<span className="text-primary-dim">.{balanceParts[1]}</span>
          </h2>
          <p className="text-on-surface-variant text-xs mt-2 leading-relaxed">
            Your total available cash across all connected accounts. All assets are synchronized and up to date.
          </p>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <TrendingUp className={cn("w-4 h-4", growth < 0 && "rotate-180 text-secondary")} />
          <span className={cn("text-sm font-bold", growth < 0 && "text-secondary")}>
            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
          </span>
          <span className="text-on-surface-variant text-[10px] uppercase tracking-widest ml-1">Growth vs last month</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-surface-container p-6 rounded-3xl flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-bright flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary rotate-180" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">Inflow Context</p>
              <h3 className="text-2xl font-headline font-bold">{currency}{totalInflow.toLocaleString()}</h3>
              <p className="text-[10px] text-on-surface-variant">{goalProgress}% of your monthly goal reached</p>
            </div>
          </div>
          <div className="w-24 h-1 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>

        <div className="bg-surface-container p-6 rounded-3xl flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-surface-bright flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">Outflow Control</p>
              <h3 className="text-2xl font-headline font-bold">{currency}{totalOutflow.toLocaleString()}</h3>
              <p className="text-[10px] text-on-surface-variant">{budgetUsage}% of budget used this period</p>
            </div>
          </div>
          <div className="w-24 h-1 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${budgetUsage}%` }} />
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h3 className="font-headline text-3xl font-bold tracking-tight">Pulse Activity</h3>
          <button className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1">
            Archive <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        
        <div className="space-y-3">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="bg-surface-container p-4 rounded-3xl flex items-center gap-4 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-surface-bright flex items-center justify-center">
                {tx.icon === 'Laptop' && <Laptop className="w-6 h-6" />}
                {tx.icon === 'DollarSign' && <DollarSign className="w-6 h-6" />}
                {tx.icon === 'UtensilsCrossed' && <UtensilsCrossed className="w-6 h-6" />}
                {tx.icon === 'Car' && <Car className="w-6 h-6" />}
                {tx.icon === 'ShoppingCart' && <ShoppingCart className="w-6 h-6" />}
                {tx.icon === 'Bolt' && <Bolt className="w-6 h-6" />}
                {tx.icon === 'Plane' && <Plane className="w-6 h-6" />}
                {tx.icon === 'Home' && <Home className="w-6 h-6" />}
                {tx.icon === 'CreditCard' && <CreditCard className="w-6 h-6" />}
                {tx.icon === 'Dumbbell' && <Dumbbell className="w-6 h-6" />}
                {tx.icon === 'Film' && <Film className="w-6 h-6" />}
                {tx.icon === 'MoreHorizontal' && <MoreHorizontal className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-on-surface">{tx.description}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-surface-bright rounded text-on-surface-variant font-bold">{tx.category}</span>
                  <span className="text-[10px] text-on-surface-variant">
                    {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className={cn("font-headline font-bold text-lg", tx.type === 'expense' ? "text-secondary" : "text-primary")}>
                  {tx.type === 'expense' ? '-' : '+'}{currency}{tx.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const AnalyticsScreen = ({ 
  transactions, 
  currency = '$', 
  range, 
  onRangeChange,
  recurringBills,
  onAddRecurringBill,
  onDeleteRecurringBill
}: { 
  transactions: Transaction[], 
  currency?: string,
  range: 'week' | 'month' | 'year',
  onRangeChange: (range: 'week' | 'month' | 'year') => void,
  recurringBills: RecurringBill[],
  onAddRecurringBill: (bill: Omit<RecurringBill, 'id' | 'uid'>) => void,
  onDeleteRecurringBill: (id: string) => void
}) => {
  const [showAddBill, setShowAddBill] = useState(false);
  const [newBill, setNewBill] = useState({ name: '', amount: '', dueDate: '1', category: 'subscriptions' });

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const txTime = txDate.getTime();
      if (range === 'week') {
        const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        return txTime >= weekAgo;
      } else if (range === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
        return txTime >= monthAgo;
      } else {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime();
        return txTime >= yearAgo;
      }
    });
  }, [transactions, range]);

  const expenseTransactions = filteredTransactions.filter(tx => tx.type === 'expense');
  const totalExpense: number = expenseTransactions.reduce((acc: number, tx: Transaction) => acc + tx.amount, 0);

  // Group by category
  const categoryTotals = expenseTransactions.reduce((acc: Record<string, number>, tx: Transaction) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryTotals).map(([name, value]: [string, number]) => ({
    name,
    amount: value,
    value: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
    color: CATEGORIES.find(c => c.name === name)?.color || '#f3ffca'
  })).sort((a, b) => b.value - a.value);

  // Fallback if no expenses
  const displayData = chartData.length > 0 ? chartData : [
    { name: 'No Data', amount: 0, value: 100, color: '#22262f' }
  ];

  const colors = [
    '#f3ffca', // Neon Lime
    '#ff706e', // Coral
    '#8ff5ff', // Cyan
    '#beee00', // Bright Lime
    '#00eefc', // Electric Blue
    '#ff9e7d', // Peach
    '#d4ff5e', // Chartreuse
    '#70ffaf', // Mint
    '#ff70d4', // Pink
    '#7094ff', // Sky Blue
    '#ffdb5e', // Mustard
    '#a8ff70', // Light Green
    '#70fffc', // Light Cyan
    '#ff7070', // Light Coral
    '#7070ff', // Light Blue
    '#d470ff', // Light Purple
    '#ffb870', // Light Orange
    '#70ff70', // Green
    '#70d4ff', // Azure
    '#ff7094', // Rose
    '#b8ff70', // Lime Green
    '#70ffb8', // Aquamarine
    '#70b8ff', // Sky Blue
    '#b870ff', // Purple
    '#ff70b8', // Hot Pink
    '#ffb870', // Apricot
    '#70ffdb', // Turquoise
    '#dbff70', // Pear
    '#70dbff', // Cerulean
    '#ff70db'  // Magenta
  ];

  // Insights logic
  const highestSpend = chartData[0];
  const savingsPotential = totalExpense * 0.15; // 15% optimization potential
  
  // Find a category that is higher than average (simulated)
  const smartSaving = chartData.find(c => c.value > 20) || chartData[0];

  const monthlyTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: Record<string, number> = {};
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      data[key] = 0;
    }

    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
      const d = new Date(tx.date);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (data[key] !== undefined) {
        data[key] += tx.amount;
      }
    });

    return Object.entries(data).map(([name, amount]) => ({ name, amount }));
  }, [transactions]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const handleAddBill = () => {
    const amount = parseFloat(newBill.amount);
    const dueDate = parseInt(newBill.dueDate);
    if (!newBill.name || isNaN(amount) || isNaN(dueDate)) return;

    onAddRecurringBill({
      name: newBill.name,
      amount,
      dueDate,
      category: newBill.category,
      icon: CATEGORIES.find(c => c.id === newBill.category)?.icon || 'Bolt'
    });
    setNewBill({ name: '', amount: '', dueDate: '1', category: 'subscriptions' });
    setShowAddBill(false);
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-12">
      <section className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="w-full">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Financial Overview</p>
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter">Analytics</h1>
        </div>
        <div className="flex bg-surface-container-low p-1.5 rounded-full">
          {(['week', 'month', 'year'] as const).map((r) => (
            <button 
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all",
                range === r ? "bg-primary-container text-black shadow-lg" : "text-on-surface-variant"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-surface-container-high/40 backdrop-blur-3xl p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[400px] border border-white/5">
          <div className="relative w-64 h-64 md:w-80 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.name === 'No Data') return null;
                      return (
                        <div className="bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{data.name}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="font-headline text-xl font-bold">{currency}{data.amount?.toLocaleString()}</span>
                            <span className="text-xs text-primary font-bold">{Math.round(data.value)}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={displayData}
                  innerRadius="80%"
                  outerRadius="100%"
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {displayData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || colors[index % colors.length]} 
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                      stroke={activeIndex === index ? '#ffffff' : 'none'}
                      strokeWidth={2}
                      style={{ 
                        transition: 'all 0.3s ease',
                        transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                        transformOrigin: 'center'
                      }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Total Spent</span>
              <span className="font-headline text-4xl font-bold">{currency}{totalExpense.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {displayData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || colors[index % colors.length] }} />
                <span className="text-xs font-medium text-on-surface-variant">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-high p-8 rounded-[2.5rem] relative overflow-hidden border border-white/5">
            <h3 className="font-headline text-2xl font-bold mb-6">Efficiency</h3>
            <div className="space-y-8">
              {displayData.slice(0, 3).map((item, index) => (
                <div key={item.name}>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-on-surface font-medium">{item.name}</span>
                    <span className={cn("font-headline text-xl font-bold")}>{Math.round(item.value)}%</span>
                  </div>
                  <div className="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${item.value}%`, 
                        backgroundColor: item.color || colors[index % colors.length] 
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-container p-8 rounded-[2.5rem] flex items-center justify-between">
            <div>
              <p className="text-black font-headline text-[10px] uppercase font-bold tracking-widest mb-1">Savings Potential</p>
              <h4 className="text-black font-headline text-3xl font-extrabold">{currency}{savingsPotential.toLocaleString()}</h4>
            </div>
            <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-black w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      <section className="bg-surface-container-low/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Outflow Trends</p>
            <h3 className="font-headline text-2xl font-bold">Monthly Spending</h3>
          </div>
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            Last 6 Months
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--on-surface-variant)', fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 12 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-surface-container-highest/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{data.name}</p>
                        <span className="font-headline text-xl font-bold text-primary">{currency}{data.amount.toLocaleString()}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="amount" 
                radius={[12, 12, 12, 12]} 
                barSize={40}
              >
                {monthlyTrend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container p-6 rounded-2xl border-l-4 border-secondary">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Highest Spend</p>
          <h5 className="font-headline text-xl font-bold">{highestSpend?.name || 'N/A'}</h5>
          <p className="text-sm mt-1 text-secondary">Top category this period</p>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl border-l-4 border-primary">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Smart Saving</p>
          <h5 className="font-headline text-xl font-bold">{smartSaving?.name || 'N/A'} Optimization</h5>
          <p className="text-sm mt-1 text-primary">-12% lower than average</p>
        </div>
        <div className="bg-surface-container p-6 rounded-2xl border-l-4 border-tertiary">
          <div className="flex justify-between items-start mb-2">
            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">Recurring Bills</p>
            <button 
              onClick={() => setShowAddBill(!showAddBill)}
              className="w-6 h-6 rounded-full bg-surface-bright flex items-center justify-center hover:bg-surface-container-highest transition-all"
            >
              {showAddBill ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
          </div>
          
          {showAddBill ? (
            <div className="space-y-3 mt-4">
              <input 
                type="text" 
                placeholder="Bill Name"
                value={newBill.name}
                onChange={(e) => setNewBill({...newBill, name: e.target.value})}
                className="w-full bg-surface-lowest border-none rounded-xl py-2 px-3 text-xs outline-none"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amount"
                  value={newBill.amount}
                  onChange={(e) => setNewBill({...newBill, amount: e.target.value})}
                  className="w-1/2 bg-surface-lowest border-none rounded-xl py-2 px-3 text-xs outline-none"
                />
                <input 
                  type="number" 
                  placeholder="Day (1-31)"
                  value={newBill.dueDate}
                  onChange={(e) => setNewBill({...newBill, dueDate: e.target.value})}
                  className="w-1/2 bg-surface-lowest border-none rounded-xl py-2 px-3 text-xs outline-none"
                />
              </div>
              <button 
                onClick={handleAddBill}
                className="w-full py-2 bg-primary text-black rounded-xl text-[10px] font-bold uppercase tracking-widest"
              >
                Save Bill
              </button>
            </div>
          ) : (
            <div className="space-y-3 mt-4 max-h-32 overflow-y-auto custom-scrollbar">
              {recurringBills.length > 0 ? (
                recurringBills.map(bill => (
                  <div key={bill.id} className="flex items-center justify-between group">
                    <div>
                      <h6 className="text-sm font-bold">{bill.name}</h6>
                      <p className="text-[10px] text-on-surface-variant">Due: Day {bill.dueDate} • {currency}{bill.amount}</p>
                    </div>
                    <button 
                      onClick={() => onDeleteRecurringBill(bill.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-secondary"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-on-surface-variant italic">No recurring bills added</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const AddTransactionScreen = ({ onAdd, currency = '$' }: { onAdd: (tx: Omit<Transaction, 'id'>) => void, currency?: string }) => {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [selectedCategory, setSelectedCategory] = useState('shopping');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const category = CATEGORIES.find(c => c.id === selectedCategory);

    onAdd({
      amount: numAmount,
      type,
      category: category?.name || 'Other',
      date: new Date(date).toISOString(),
      description: description || category?.name || 'Transaction',
      icon: category?.icon || 'MoreHorizontal'
    });
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-2xl mx-auto min-h-screen">
      <section className="mb-12 text-center">
        <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-4 block">Enter Amount</label>
        <div className="relative flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-4xl text-primary opacity-50">{currency}</span>
            <input 
              autoFocus 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none text-center font-headline text-7xl md:text-8xl focus:ring-0 text-on-surface placeholder:text-surface-container-highest w-full max-w-md outline-none"
            />
          </div>
          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => setType('expense')}
              className={cn(
                "px-8 py-3 rounded-full font-headline text-sm font-bold transition-all",
                type === 'expense' ? "bg-primary text-black neon-glow-primary scale-105" : "bg-surface-container-high text-on-surface-variant"
              )}
            >
              Expense
            </button>
            <button 
              onClick={() => setType('income')}
              className={cn(
                "px-8 py-3 rounded-full font-headline text-sm font-bold transition-all",
                type === 'income' ? "bg-primary text-black neon-glow-primary scale-105" : "bg-surface-container-high text-on-surface-variant"
              )}
            >
              Income
            </button>
          </div>
        </div>
      </section>

      <div className="bg-surface/40 backdrop-blur-3xl p-8 rounded-[2.5rem] space-y-8 border border-white/5">
        <div>
          <h3 className="text-sm font-bold text-on-surface mb-6 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Select Category
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = {
                UtensilsCrossed, ShoppingCart, Plane, Home, CreditCard, Dumbbell, Film, MoreHorizontal
              }[cat.icon] as any;

              return (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center gap-3 group"
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    selectedCategory === cat.id 
                      ? "bg-primary text-black shadow-[0_0_15px_rgba(243,255,202,0.4)]" 
                      : "bg-surface-lowest text-on-surface-variant group-hover:bg-surface-bright"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider font-bold",
                    selectedCategory === cat.id ? "text-primary" : "text-on-surface-variant"
                  )}>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-2">Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-lowest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-1 focus:ring-primary/30 transition-all outline-none"
              />
              <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant ml-2">Description</label>
            <input 
              type="text" 
              placeholder="Monthly groceries..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-lowest border-none rounded-2xl py-4 px-5 text-on-surface focus:ring-1 focus:ring-primary/30 transition-all outline-none"
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
          className="w-full py-6 rounded-[1.5rem] bg-gradient-to-r from-primary to-primary-dim text-black font-headline font-bold text-lg uppercase tracking-[0.15em] shadow-[0_20px_40px_-10px_rgba(190,238,0,0.3)] hover:-translate-y-1 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Transaction
        </button>
      </div>

      <div className="mt-12 p-6 rounded-2xl bg-surface-container border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Estimated Budget Impact</span>
          <span className="font-headline text-sm text-secondary font-medium">92% Spent</span>
        </div>
        <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
          <div className="h-full bg-secondary rounded-full shadow-[0_0_10px_#ff706e]" style={{ width: '92%' }} />
        </div>
      </div>
    </div>
  );
};

const HistoryScreen = ({ transactions, onDelete, currency = '$' }: { transactions: Transaction[], onDelete: (id: string) => void, currency?: string }) => {
  const [search, setSearch] = useState('');

  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(search.toLowerCase()) ||
    tx.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutflow = filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Group by date
  const groups = filteredTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const exportToCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(tx => [
      new Date(tx.date).toLocaleDateString(),
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.category,
      tx.type,
      tx.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spendwise_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-28 px-6 max-w-2xl mx-auto space-y-12 pb-32">
      <section className="flex justify-between items-start">
        <div>
          <span className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] mb-2 block">Monthly Outflow</span>
          <div className="flex items-baseline gap-4">
            <h2 className="font-headline text-5xl font-bold tracking-tighter">
              {currency}{totalOutflow.toLocaleString()}<span className="text-primary-dim">.00</span>
            </h2>
            <div className="px-3 py-1 bg-secondary-container/20 rounded-full flex items-center gap-1">
              <TrendingUp className="text-secondary w-3 h-3" />
              <span className="text-secondary text-xs font-bold">12%</span>
            </div>
          </div>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-surface-container-high p-4 rounded-2xl flex items-center justify-center hover:bg-surface-bright transition-all active:scale-95 border border-white/5"
          title="Export CSV"
        >
          <Download className="w-5 h-5 text-primary" />
        </button>
      </section>

      <div className="flex gap-3">
        <div className="flex-1 bg-surface-lowest h-12 rounded-xl flex items-center px-4 border border-white/5 focus-within:border-primary/30 transition-all">
          <Search className="text-outline w-5 h-5 mr-2" />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline outline-none"
          />
        </div>
        <button className="bg-surface-container-high h-12 px-4 rounded-xl flex items-center justify-center">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-12">
        {Object.entries(groups).map(([date, items]) => (
          <div key={date} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-headline text-lg font-medium">{date.split(',')[0]}</h3>
              <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">{date.split(',').slice(1).join(',')}</span>
            </div>
            <div className="space-y-3">
              {items.map((item) => {
                const Icon = {
                  UtensilsCrossed, ShoppingCart, Plane, Home, CreditCard, Dumbbell, Film, MoreHorizontal, Car, Bolt, Laptop, DollarSign
                }[item.icon] as any || MoreHorizontal;

                return (
                  <motion.div 
                    layout
                    key={item.id} 
                    className="bg-surface-container p-4 rounded-3xl flex items-center gap-4 relative overflow-hidden border border-white/5 group"
                  >
                    <div className={cn("absolute left-0 top-1/4 bottom-1/4 w-1 rounded-full", item.type === 'income' ? 'bg-primary' : 'bg-secondary')} />
                    <div className="w-12 h-12 rounded-2xl bg-surface-bright flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{item.description}</p>
                      <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">
                        {new Date(item.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} • {item.category}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <p className={cn("font-headline font-bold text-lg", item.type === 'expense' ? "text-secondary" : "text-primary")}>
                        {item.type === 'expense' ? '-' : '+'}{currency}{item.amount.toLocaleString()}
                      </p>
                      <button 
                        onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-secondary/10 rounded-full text-secondary transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <Search className="w-12 h-12 mx-auto mb-4" />
            <p className="font-headline text-lg">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileScreen = ({ user, profile, onLogout, onUpdate, transactions }: { user: any, profile: UserProfile | null, onLogout: () => void, onUpdate: (u: Partial<UserProfile>) => void, transactions: Transaction[] }) => {
  const totalBalance = transactions.reduce((acc, tx) => 
    tx.type === 'income' ? acc + tx.amount : acc - tx.amount, 0
  );
  
  const totalOutflow = transactions.filter(tx => tx.type === 'expense').reduce((acc, tx) => acc + tx.amount, 0);
  const budgetUsage = Math.min(Math.round((totalOutflow / 3000) * 100), 100);

  const currency = profile?.currency || '$';

  return (
    <div className="pt-28 px-6 max-lg mx-auto pb-32">
      <section className="flex flex-col items-center mb-12">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-[3px] border-primary-container p-1 shadow-[0_0_15px_rgba(202,253,0,0.4)]">
            <div className="w-full h-full rounded-full overflow-hidden">
              <img 
                src={user?.photoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="absolute bottom-1 right-1 bg-primary-container text-black p-2 rounded-full shadow-lg">
            <Bolt className="w-4 h-4" />
          </div>
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight mb-1">{user?.displayName || 'Julian Thorne'}</h2>
        <p className="text-on-surface-variant text-sm lowercase">{user?.email || 'julian.thorne@lumina.io'}</p>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-surface-container-high col-span-2 rounded-3xl p-6 border border-white/5 flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">Net Liquidity</span>
            <TrendingUp className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline text-4xl font-bold text-primary-container">{currency}{totalBalance.toLocaleString()}</h3>
            <p className="text-on-surface-variant text-xs mt-1">+12.4% from last month</p>
          </div>
        </div>
        
        <div className="bg-surface-container-high rounded-3xl p-5 border border-white/5">
          <span className="text-on-surface-variant text-[10px] uppercase tracking-widest block mb-4">Linked Accounts</span>
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-surface-bright flex items-center justify-center border-2 border-surface-container-high">
                <CreditCard className="w-3 h-3" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-high rounded-3xl p-5 border border-white/5">
          <span className="text-on-surface-variant text-[10px] uppercase tracking-widest block mb-1">Active Budget</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-headline font-bold">{budgetUsage}%</span>
            <div className="w-full h-1 bg-surface-variant rounded-full mb-2 overflow-hidden">
              <div className="h-full bg-secondary shadow-[0_0_10px_#ff706e]" style={{ width: `${budgetUsage}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 mb-12">
        <h4 className="text-on-surface-variant text-[10px] uppercase tracking-[0.2em] px-2 mb-4">Preferences</h4>
        
        <div className="space-y-3">
          <div className="w-full flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-bright flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <span className="font-medium">App Theme</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-lowest p-1 rounded-full">
              <button 
                onClick={() => onUpdate({ theme: 'dark' })}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", profile?.theme === 'dark' ? "bg-primary text-black" : "text-on-surface-variant")}
              >
                Dark
              </button>
              <button 
                onClick={() => onUpdate({ theme: 'light' })}
                className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", profile?.theme === 'light' ? "bg-primary text-black" : "text-on-surface-variant")}
              >
                Light
              </button>
            </div>
          </div>

          <div className="w-full flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-bright flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="font-medium">Currency</span>
            </div>
            <select 
              value={profile?.currency || '$'}
              onChange={(e) => onUpdate({ currency: e.target.value })}
              className="bg-surface-lowest text-on-surface-variant text-xs font-bold px-4 py-2 rounded-xl border-none focus:ring-1 focus:ring-primary/30 outline-none"
            >
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="¥">JPY (¥)</option>
              <option value="₹">INR (₹)</option>
            </select>
          </div>

          {[
            { label: 'Security & Privacy', icon: Bolt },
            { label: 'Notifications', icon: Bell },
          ].map((item) => (
            <button key={item.label} className="w-full flex items-center justify-between p-4 bg-surface-container rounded-2xl hover:bg-surface-container-high transition-all active:scale-[0.98] border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-surface-bright flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-outline" />
            </button>
          ))}
        </div>
      </section>

      <button 
        onClick={onLogout}
        className="w-full py-5 rounded-full bg-surface-container-lowest border border-secondary/20 flex items-center justify-center gap-3 text-secondary hover:bg-secondary/5 transition-all active:scale-95 group"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-headline font-bold uppercase tracking-widest text-sm">Logout</span>
      </button>
    </div>
  );
};
// --- Main App ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState<'week' | 'month' | 'year'>('month');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setScreen('dashboard');
        
        // Sync profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            theme: 'dark',
            currency: '$',
            createdAt: Timestamp.now(),
            role: 'user'
          };
          await setDoc(userRef, newProfile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setScreen('login');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const profile = doc.data() as UserProfile;
        setUserProfile(profile);
        
        // Apply theme
        if (profile.theme === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        date: (doc.data().date as Timestamp).toDate().toISOString()
      })) as Transaction[];
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'recurringBills'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bills = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as RecurringBill[];
      setRecurringBills(bills);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'recurringBills');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    try {
      const txData = {
        ...newTx,
        uid: user.uid,
        date: Timestamp.fromDate(new Date(newTx.date)),
        id: Math.random().toString(36).substring(2, 9) // Firestore will generate its own ID, but we keep this for local consistency if needed
      };
      await addDoc(collection(db, 'transactions'), txData);
      setScreen('history');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
    }
  };

  const handleAddRecurringBill = async (newBill: Omit<RecurringBill, 'id' | 'uid'>) => {
    if (!user) return;
    try {
      const billData = {
        ...newBill,
        uid: user.uid,
        id: Math.random().toString(36).substring(2, 9)
      };
      await addDoc(collection(db, 'recurringBills'), billData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recurringBills');
    }
  };

  const handleDeleteRecurringBill = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recurringBills', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `recurringBills/${id}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary selection:text-black">
        <TopNav 
          screen={screen} 
          onBack={() => setScreen('dashboard')} 
          onProfile={() => setScreen('profile')} 
          photoURL={userProfile?.photoURL || user?.photoURL}
        />
        
        <main className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {screen === 'login' && <LoginScreen onLogin={handleLogin} />}
              {screen === 'dashboard' && <DashboardScreen transactions={transactions} currency={userProfile?.currency} />}
              {screen === 'analytics' && (
              <AnalyticsScreen 
                transactions={transactions} 
                currency={userProfile?.currency} 
                range={analyticsRange}
                onRangeChange={setAnalyticsRange}
                recurringBills={recurringBills}
                onAddRecurringBill={handleAddRecurringBill}
                onDeleteRecurringBill={handleDeleteRecurringBill}
              />
            )}
              {screen === 'add' && <AddTransactionScreen onAdd={handleAddTransaction} currency={userProfile?.currency} />}
              {screen === 'history' && (
                <HistoryScreen 
                  transactions={transactions} 
                  onDelete={handleDeleteTransaction}
                  currency={userProfile?.currency}
                />
              )}
              {screen === 'profile' && (
                <ProfileScreen 
                  user={user} 
                  profile={userProfile}
                  onLogout={handleLogout} 
                  onUpdate={updateProfile}
                  transactions={transactions} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <BottomNav currentScreen={screen} onNavigate={setScreen} />
        
        {/* Visual Texture Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-[100]">
          <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/stardust.png')" }} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
