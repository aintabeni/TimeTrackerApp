
import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppProvider';
import { useAppState } from './hooks/useAppContext';
import { TimelineView } from './components/TimelineView';
import { ReportsView } from './components/ReportsView';

type Tab = 'timeline' | 'reports';

const ActiveTimerDisplay: React.FC = () => {
    const { activeTimer, tasks, subtasks } = useAppState();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (activeTimer && !activeTimer.isPaused) {
            const interval = setInterval(() => {
                const totalElapsed = activeTimer.accumulated + (Date.now() - activeTimer.startTime);
                setElapsed(totalElapsed);
            }, 1000);
            return () => clearInterval(interval);
        } else if (activeTimer && activeTimer.isPaused) {
            setElapsed(activeTimer.accumulated);
        }
    }, [activeTimer]);
    
    if(!activeTimer) return null;

    let title = '...';
    if(activeTimer.itemType === 'task') {
        title = tasks.find(t => t.id === activeTimer.taskOrSubtaskId)?.title || '...';
    } else {
        title = subtasks.find(s => s.id === activeTimer.taskOrSubtaskId)?.title || '...';
    }

    const seconds = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60).toString().padStart(2, '0');
    const hours = Math.floor(elapsed / (1000 * 60 * 60)).toString().padStart(2, '0');

    return (
        <div className="bg-green-600/20 border border-green-500 text-green-300 px-4 py-1 rounded-full text-sm">
            <span>Active: {title}</span>
            <span className="font-mono ml-3">{hours}:{minutes}:{seconds}</span>
            {activeTimer.isPaused && <span className="ml-2 font-bold text-yellow-400">(Paused)</span>}
        </div>
    )
}

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');

  return (
    <div className="flex flex-col h-screen">
      <header className="flex-shrink-0 bg-gray-800 shadow-md p-2 flex justify-between items-center h-16">
        <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-white">LifeOS</h1>
            <nav className="flex space-x-2 bg-gray-700/50 p-1 rounded-lg">
                <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                    activeTab === 'timeline' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'
                }`}
                >
                Timeline
                </button>
                <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                    activeTab === 'reports' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600/50'
                }`}
                >
                Reports
                </button>
            </nav>
        </div>
        <ActiveTimerDisplay />
      </header>
      <main className="flex-grow">
        {activeTab === 'timeline' ? <TimelineView /> : <ReportsView />}
      </main>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
