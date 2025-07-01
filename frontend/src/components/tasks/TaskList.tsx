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

export interface TaskSection {
  name: string;
  tasks: TaskType[];
}

export type TasksByCategory = {
  [category: string]: TaskSection[];
};

export default function TaskList({ tasksByCategory }: { tasksByCategory: TasksByCategory }) {
  const [sortKey, setSortKey] = useState<string>(() => localStorage.getItem('taskListSortKey') || 'category');
  // Flatten all tasks from the initial prop for a source-of-truth state
  const initialTasks: TaskType[] = useMemo(() => Object.values(tasksByCategory).flatMap(sections => sections.flatMap(section => section.tasks)), [tasksByCategory]);
  const [baseTasks, setBaseTasks] = useState<TaskType[]>(initialTasks);
  const processingMoveRef = useRef(false);

  // Build a map from category_id to display name using the initial tasksByCategory prop
  const categoryIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(tasksByCategory).forEach(([catKey, sections]) => {
      sections.forEach(section => {
        map[catKey] = section.name;
      });
    });
    return map;
  }, [tasksByCategory]);

  // Grouping function: always groups from baseTasks
  const groupTasks = useCallback((allTasks: TaskType[], sortKey: string): TasksByCategory => {
    if (sortKey === 'category') {
      // Group by category_id, robustly using all available info for display name
      const grouped: TasksByCategory = {};
      allTasks.forEach(task => {
        const catId = task.category_id || 'Uncategorized';
        const displayName =
          categoryIdToName[catId] ||
          (task.category && task.category.name) ||
          (catId === 'Uncategorized' ? 'Uncategorized' : catId);
        if (!grouped[catId]) grouped[catId] = [{ name: displayName, tasks: [] }];
        grouped[catId][0].tasks.push(task);
      });
      return grouped;
    } else if (sortKey === 'priority') {
      const priorities = ['urgent', 'high', 'medium', 'low'];
      const grouped: TasksByCategory = {};
      priorities.forEach(priority => {
        grouped[priority] = [
          {
            name: priority.charAt(0).toUpperCase() + priority.slice(1),
            tasks: allTasks.filter((t: TaskType) => (t.priority || '').toLowerCase() === priority) || []
          }
        ];
      });
      return grouped;
    } else if (sortKey === 'status') {
      const statuses = ['todo', 'in_progress', 'completed', 'blocked', 'cancelled'];
      const grouped: TasksByCategory = {};
      statuses.forEach(status => {
        grouped[status] = [
          {
            name: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            tasks: allTasks.filter((t: TaskType) => (t.status || '').toLowerCase() === status) || []
          }
        ];
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
        deadline: [{ name: 'All Tasks', tasks: [...withDeadline, ...withoutDeadline] }]
      };
    }
    // fallback
    return {};
  }, [tasksByCategory, categoryIdToName]);

  // Regroup tasks for rendering
  const groupedTasks = useMemo(() => groupTasks(baseTasks, sortKey), [baseTasks, sortKey, groupTasks]);

  // Handle sort key change
  const handleSortKeyChange = (_: React.MouseEvent<HTMLElement>, newKey: string) => {
    if (!newKey) return;
    setSortKey(newKey);
    localStorage.setItem('taskListSortKey', newKey);
  };

  // Move handler: update baseTasks, then regroup
  const handleTaskMove = useCallback(async (category: string, sectionName: string, newTasks: TaskType[], sectionIndex?: number) => {
    if (processingMoveRef.current) return;
    setBaseTasks((prevBaseTasks) => {
      // Remove all tasks that are in the affected section
      const tasksToRemove = groupedTasks[category]?.[sectionIndex ?? 0]?.tasks.map(t => t.task_id) || [];
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
      const fromCategory = evt.from.closest('.task-category')?.getAttribute('data-category');
      const toCategory = evt.to.closest('.task-category')?.getAttribute('data-category');
      if (fromCategory && toCategory && movedTaskId) {
        // Find the moved task
        const movedTask = groupedTasks[fromCategory]?.flatMap((section: TaskSection) => section.tasks).find((task: TaskType) => task.task_id === movedTaskId);
        if (movedTask) {
          // Update backend according to sortKey
          const updates: Partial<import('../../api/tasks').TaskInput> = {};
          if (sortKey === 'category') {
            updates.category_id = toCategory;
          } else if (sortKey === 'priority') {
            updates.priority = toCategory as 'low' | 'medium' | 'high' | 'urgent';
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
      {Object.entries(groupedTasks).map(([category, sections]) => (
        <div className="task-category" key={category} data-category={category}>
          {(sections ?? []).map((section: TaskSection, sectionIdx: number) => (
            <div className="task-section" key={`${category}-${section.name}`} data-category={category}>
              <div className="section-header">
                <span>{section.name}</span>
                <span className="badge">{section.tasks.length}</span>
                <a href="#" className="task-section-collapse">▲</a>
              </div>
              <ReactSortable
                list={section.tasks.map(task => ({ ...task, id: task.task_id }))}
                setList={(newItems: SortableTask[]) => {
                  // Map back to TaskType by matching id to task_id
                  const newTasks: TaskType[] = newItems.map((item) => {
                    // Remove the injected 'id' property to avoid polluting TaskType
                    const { id, ...rest } = item;
                    return { ...rest, task_id: item.task_id ?? id };
                  });
                  handleTaskMove(category, section.name, newTasks, sectionIdx);
                }}
                group={{
                  name: 'tasks',
                  pull: sortKey === 'deadline' ? false : 'clone',
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
                {section.tasks.map((task: TaskType) => (
                  <TaskItem key={task.task_id} task={task} />
                ))}
              </ReactSortable>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}