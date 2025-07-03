// TaskList.jsx
import React, { useState, useCallback, useRef, useMemo } from "react";
import { ReactSortable } from "react-sortablejs";
import "./TaskList.css"; // Custom styles
import TaskItem from "./TaskItem";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import CategoryIcon from '@mui/icons-material/Category';
import FlagIcon from '@mui/icons-material/Flag';
import EventIcon from '@mui/icons-material/Event';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { updateTask } from '../../api/tasks';
import type { Task as TaskType } from '../../api/tasks';

interface SortableEvent {
  type: string;
  from: HTMLElement;
  to: HTMLElement;
  item: HTMLElement;
}

export type TasksBySortingKey = {
  [sectionName: string]: TaskType[];
};

// Helper to format minutes as HH:MM:SS
function formatDuration(minutes?: number): string {
  if (!minutes) return '00:30:00';
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = Math.floor(minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

export default function TaskList({ tasksBySortingKey }: { tasksBySortingKey: TasksBySortingKey }) {
  const [sortKey, setSortKey] = useState<string>(() => localStorage.getItem('taskListSortKey') || 'category');
  // Flatten all tasks from the initial prop for a source-of-truth state
  const initialTasks: TaskType[] = useMemo(() => Object.values(tasksBySortingKey).flat(), [tasksBySortingKey]);
  const [baseTasks, setBaseTasks] = useState<TaskType[]>(initialTasks);
  const processingMoveRef = useRef(false);

  // Grouping function: always groups from baseTasks
  const groupTasks = useCallback((allTasks: TaskType[], sortKey: string): TasksBySortingKey => {
    if (sortKey === 'category') {
      const grouped: TasksBySortingKey = {};
      allTasks.forEach(task => {
        const displayName = (task.category && task.category.name) || 'Uncategorized';
        if (!grouped[displayName]) grouped[displayName] = [];
        grouped[displayName].push(task);
      });
      return grouped;
    } else if (sortKey === 'priority') {
      const priorities = ['Urgent', 'High', 'Medium', 'Low'];
      const grouped: TasksBySortingKey = {};
      priorities.forEach(priority => {
        grouped[priority] = allTasks.filter((t: TaskType) => (t.priority || '').toLowerCase() === priority.toLowerCase());
      });
      return grouped;
    } else if (sortKey === 'status') {
      const statuses = ['To Do', 'In Progress', 'Completed', 'Blocked', 'Cancelled'];
      const grouped: TasksBySortingKey = {};
      statuses.forEach(status => {
        const statusKey = status.toLowerCase().replace(/ /g, '_');
        grouped[status] = allTasks.filter((t: TaskType) => (t.status || '').toLowerCase() === statusKey);
      });
      return grouped;
    } else if (sortKey === 'deadline') {
      const withDeadline = allTasks.filter((t: TaskType) => t.deadline).sort((a: TaskType, b: TaskType) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline! < b.deadline! ? -1 : a.deadline! > b.deadline! ? 1 : 0;
      });
      const withoutDeadline = allTasks.filter((t: TaskType) => !t.deadline);
      return {
        'All Tasks': [...withDeadline, ...withoutDeadline]
      };
    }
    // fallback
    return {};
  }, [tasksBySortingKey]);

  // Regroup tasks for rendering
  const groupedTasks = useMemo(() => groupTasks(baseTasks, sortKey), [baseTasks, sortKey, groupTasks]);

  // Handle sort key change
  const handleSortKeyChange = (_: React.MouseEvent<HTMLElement>, newKey: string) => {
    if (!newKey) return;
    setSortKey(newKey);
    localStorage.setItem('taskListSortKey', newKey);
  };

  // Move handler: update baseTasks, then regroup
  const handleTaskMove = useCallback(async (sectionName: string, newTasks: TaskType[]) => {
    if (processingMoveRef.current) return;
    setBaseTasks((prevBaseTasks) => {
      // Remove all tasks that are in the affected section
      const tasksToRemove = groupedTasks[sectionName]?.map(t => t.task_id) || [];
      const filtered = prevBaseTasks.filter(t => !tasksToRemove.includes(t.task_id));
      // Add the new tasks for this section
      return [...filtered, ...newTasks];
    });
  }, [groupedTasks]);

  // Enhanced DnD handler for updating backend
  const handleSortableEvent = useCallback(async (evt: SortableEvent) => {
    if (evt.type === 'add' && evt.from !== evt.to) {
      if (processingMoveRef.current) return;
      processingMoveRef.current = true;
      const movedTaskId = evt.item.getAttribute('data-task-id');
      const fromSectionName = evt.from.closest('.task-section')?.getAttribute('data-section-name');
      const toSectionName = evt.to.closest('.task-section')?.getAttribute('data-section-name');
      if (fromSectionName && toSectionName && movedTaskId) {
        // Find the moved task
        const movedTask = groupedTasks[fromSectionName]?.find((task: TaskType) => task.task_id === movedTaskId);
        if (movedTask) {
          // Update backend according to sortKey
          const updates: Partial<import('../../api/tasks').TaskInput> = {};
          if (sortKey === 'category') {
            updates.category_id = toSectionName;
          } else if (sortKey === 'priority') {
            updates.priority = toSectionName as 'low' | 'medium' | 'high' | 'urgent';
          }
          if (Object.keys(updates).length > 0) {
            try {
              await updateTask(movedTaskId, updates);
            } catch {
              // Optionally handle error (e.g., revert UI)
            }
          }
          // Move the task in baseTasks
          setBaseTasks((prevBaseTasks) => {
            // Remove the moved task from its old place
            const filtered = prevBaseTasks.filter(t => t.task_id !== movedTaskId);
            // Place it at the end of the new section
            return [...filtered, { ...movedTask, ...updates }];
          });
        }
      }
      setTimeout(() => {
        processingMoveRef.current = false;
      }, 50);
    }
  }, [groupedTasks, sortKey]);

  // Define a local type for sortable items
  type SortableTask = TaskType & { id: string };

  // Print the fetched tasks to the console for debugging
  React.useEffect(() => {
    console.log('Fetched tasks from backend:', initialTasks);
  }, [initialTasks]);

  return (
    <div className="task-list-container" id="task-list">
      <div className="task-list-header">
        <input className="search-box" placeholder="Search for something..." />
        <div className="segmented-controls">
          <button className="filter-btn">☰</button>
        </div>
      </div>
      <div className="sorting-controls" style={{ margin: '8px 0 16px 0' }}>
        <ToggleButtonGroup
          value={sortKey}
          exclusive
          onChange={handleSortKeyChange}
          aria-label="Task sorting controls"
          size="small"
        >
          <Tooltip title="Sort by Category" placement="top">
            <ToggleButton value="category" aria-label="Sort by Category">
              <CategoryIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Sort by Priority" placement="top">
            <ToggleButton value="priority" aria-label="Sort by Priority">
              <FlagIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Sort by Status" placement="top">
            <ToggleButton value="status" aria-label="Sort by Status">
              <EventIcon />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Sort by Deadline" placement="top">
            <ToggleButton value="deadline" aria-label="Sort by Deadline">
              <ScheduleIcon />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </div>
      {Object.entries(groupedTasks).map(([sectionName, tasks]) => (
        <div className="task-section" key={sectionName} data-section-name={sectionName}>
          <div className="section-header">
            <span>{sectionName}</span>
            <span className="badge">{tasks.length}</span>
            <a href="#" className="task-section-collapse">▲</a>
          </div>
          <ReactSortable
            list={tasks.map(task => ({ ...task, id: task.task_id }))}
            setList={(newItems: SortableTask[]) => {
              const newTasks: TaskType[] = newItems.map((item) => {
                const { id, ...rest } = item;
                return { ...rest, task_id: item.task_id ?? id };
              });
              handleTaskMove(sectionName, newTasks);
            }}
            group={{
              name: 'tasks',
              pull: sortKey === 'deadline' ? false : true,
              put: sortKey === 'deadline' ? false : true
            }}
            sort={sortKey !== 'deadline'}
            animation={150}
            ghostClass="sortable-ghost"
            chosenClass="sortable-chosen"
            dragClass="sortable-drag"
            onAdd={sortKey !== 'deadline' ? handleSortableEvent : undefined}
            onRemove={sortKey !== 'deadline' ? handleSortableEvent : undefined}
            disabled={sortKey === 'deadline'}
          >
            {tasks.map((task: TaskType) => (
              <TaskItem key={task.task_id} task={{ ...task, duration: formatDuration(task.estimated_duration_minutes) }} />
            ))}
          </ReactSortable>
        </div>
      ))}
    </div>
  );
}