import type { AppState, ActivityLog } from '../types';

const convertToCSV = (data: any[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // header row
    ...data.map(row => 
      headers.map(fieldName => 
        JSON.stringify(row[fieldName], (_, value) => value === undefined || value === null ? '' : value)
      ).join(',')
    )
  ];
  return csvRows.join('\r\n');
};

const downloadCSV = (csvString: string, filename: string) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Helper to find details for a task or subtask
const findItemDetails = (log: ActivityLog, state: AppState) => {
    const { projects, tasks, subtasks } = state;
    if (log.itemType === 'task') {
        const task = tasks.find(t => t.id === log.taskOrSubtaskId);
        if (!task) return { title: 'Unknown Task', projectName: 'Unknown', estDuration: undefined };
        const project = projects.find(p => p.id === task.projectId);
        return { title: task.title, projectName: project?.name || 'Unknown', estDuration: task.estDuration };
    } 
    
    // else: subtask
    const subtask = subtasks.find(s => s.id === log.taskOrSubtaskId);
    if (!subtask) return { title: 'Unknown Subtask', projectName: 'Unknown', estDuration: undefined };
    
    const task = tasks.find(t => t.id === subtask.taskId);
    // A subtask might be orphaned if its parent task is deleted.
    if (!task) return { title: subtask.title, projectName: 'Unknown', estDuration: subtask.estDuration };

    const project = projects.find(p => p.id === task.projectId);
    return { title: subtask.title, projectName: project?.name || 'Unknown', estDuration: subtask.estDuration };
};

export const exportToCSV = (state: AppState) => {
  const { activityLogs } = state;
  
  const enrichedActivity = activityLogs.map(log => {
    const details = findItemDetails(log, state);
    
    return {
        date: log.date,
        project: details.projectName,
        item_title: details.title.replace(/,/g, ''), // remove commas to avoid csv issues
        item_type: log.itemType,
        start_time_24h: `${Math.floor(log.start / 60).toString().padStart(2, '0')}:${(log.start % 60).toString().padStart(2, '0')}`,
        end_time_24h: `${Math.floor(log.end / 60).toString().padStart(2, '0')}:${(log.end % 60).toString().padStart(2, '0')}`,
        duration_minutes: log.end - log.start,
        estimated_duration_minutes: details.estDuration || '',
    };
  });

  if (enrichedActivity.length === 0) {
      alert("No activity to export.");
      return;
  }

  const csvString = convertToCSV(enrichedActivity);
  downloadCSV(csvString, `lifeos_activity_export_${new Date().toISOString().slice(0,10)}.csv`);
};