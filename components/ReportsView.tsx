import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAppState } from '../hooks/useAppContext';
import { exportToCSV } from '../services/exportService';
import type { Project } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

export const ReportsView: React.FC = () => {
  const state = useAppState();
  const { projects, tasks, subtasks, scheduledBlocks, activityLogs } = state;

  // Data processing
  const projectTime = projects.map(p => {
    const projectTasks = tasks.filter(t => t.projectId === p.id);
    const projectTaskIds = projectTasks.map(t => t.id);
    const projectSubtasks = subtasks.filter(st => projectTaskIds.includes(st.taskId));
    const projectSubtaskIds = projectSubtasks.map(s => s.id);
    const allItemIds = [...projectTaskIds, ...projectSubtaskIds];

    const actual = activityLogs
      .filter(log => allItemIds.includes(log.taskOrSubtaskId))
      .reduce((acc, log) => acc + (log.end - log.start), 0);
      
    const planned = scheduledBlocks
      .filter(block => allItemIds.includes(block.taskOrSubtaskId))
      .reduce((acc, block) => acc + (block.end - block.start), 0);

    return { name: p.name, actual, planned, project: p };
  });

  const pieData = projectTime.filter(p => p.actual > 0).map(p => ({ name: p.name, value: p.actual }));

  const totalActual = projectTime.reduce((sum, p) => sum + p.actual, 0);
  const totalPlanned = projectTime.reduce((sum, p) => sum + p.planned, 0);

  const handleExport = () => {
    exportToCSV(state);
  }

  return (
    <div className="p-6 bg-gray-900 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Reports</h1>
        <button
          onClick={handleExport}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl text-center">
            <h3 className="text-gray-400 font-semibold">Total Time Planned</h3>
            <p className="text-3xl font-bold text-white">{(totalPlanned / 60).toFixed(1)} hrs</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl text-center">
            <h3 className="text-gray-400 font-semibold">Total Time Actual</h3>
            <p className="text-3xl font-bold text-green-400">{(totalActual / 60).toFixed(1)} hrs</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl text-center">
            <h3 className="text-gray-400 font-semibold">Plan Adherence</h3>
            <p className="text-3xl font-bold text-cyan-400">{totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(0) : 0}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Actual Time by Project</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8" label>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-gray-400 h-[300px] flex items-center justify-center">No actual time logged yet.</p>}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Planned vs. Actual by Project</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" label={{ value: 'Minutes', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}/>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}/>
              <Legend />
              <Bar dataKey="planned" fill="#4f46e5" name="Planned" />
              <Bar dataKey="actual" fill="#22c55e" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};