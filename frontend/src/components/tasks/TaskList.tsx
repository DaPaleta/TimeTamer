// TaskList.jsx
import React, { useState, useCallback, useRef } from "react";
import { ReactSortable } from "react-sortablejs";
import "./TaskList.css"; // Custom styles
import TaskItem from "./TaskItem";

// Define types for task, section, and tasksByCategory
export interface Task {
  id: string;
  title: string;
  duration?: string;
  priority?: string;
  description?: string;
  // Add other task properties as needed
}

export interface TaskSection {
  name: string;
  tasks: Task[];
}

export type TasksByCategory = {
  [category: string]: TaskSection[];
};

interface SortableEvent {
  type: string;
  from: HTMLElement;
  to: HTMLElement;
  item: HTMLElement;
}

export default function TaskList({ tasksByCategory }: { tasksByCategory: TasksByCategory }) {
  const [tasksState, setTasksState] = useState<TasksByCategory>(tasksByCategory);
  const processingMoveRef = useRef(false);

  const handleTaskMove = useCallback((category: string, sectionName: string, newTasks: Task[]) => {
    if (processingMoveRef.current) return;
    
    setTasksState(prevState => ({
      ...prevState,
      [category]: prevState[category].map(section => 
        section.name === sectionName 
          ? { ...section, tasks: newTasks }
          : section
      )
    }));
  }, []);

  const handleSortableEvent = useCallback((evt: SortableEvent) => {
    // Handle cross-category moves
    if (evt.type === 'add' && evt.from !== evt.to) {
      if (processingMoveRef.current) return;
      
      processingMoveRef.current = true;
      
      const movedTaskId = evt.item.getAttribute('data-task-id');
      const fromCategory = evt.from.closest('.task-category')?.getAttribute('data-category');
      const toCategory = evt.to.closest('.task-category')?.getAttribute('data-category');
      
      if (fromCategory && toCategory && movedTaskId) {
        // Find the moved task
        const movedTask = tasksState[fromCategory]
          .flatMap(section => section.tasks)
          .find(task => task.id === movedTaskId);
        
        if (movedTask) {
          setTasksState(prevState => {
            const newState = { ...prevState };
            
            // Remove from source category
            newState[fromCategory] = newState[fromCategory].map(section => ({
              ...section,
              tasks: section.tasks.filter(task => task.id !== movedTaskId)
            }));
            
            // Add to target category (first section)
            if (newState[toCategory] && newState[toCategory].length > 0) {
              newState[toCategory] = newState[toCategory].map((section, index) => 
                index === 0 
                  ? { ...section, tasks: [...section.tasks, movedTask] }
                  : section
              );
            }
            
            return newState;
          });
        }
      }
      
      // Reset processing flag after state update
      setTimeout(() => {
        processingMoveRef.current = false;
      }, 50);
    }
  }, [tasksState]);

  return (
    <div className="task-list-container" id="task-list">
      <div className="task-list-header">
        <input className="search-box" placeholder="Search for something..." />
        <div className="segmented-controls">
          {/* Add segmented controls here */}
        </div>
        <button className="filter-btn">☰</button>
      </div>
      {Object.entries(tasksState).map(([category, sections]) => (
        <div className="task-category" key={category} data-category={category}>
          {sections.map((section: TaskSection) => (
            <div className="task-section" key={section.name} data-category={category}>
              <div className="section-header">
                <span>{section.name}</span>
                <span className="badge">{section.tasks.length}</span>
                <a href="#" className="task-section-collapse">▲</a>
              </div>
              <ReactSortable
                list={section.tasks}
                setList={(newTasks) => handleTaskMove(category, section.name, newTasks)}
                group={{
                  name: 'tasks',
                  pull: 'clone',
                  put: true
                }}
                sort={true}
                animation={150}
                ghostClass="sortable-ghost"
                chosenClass="sortable-chosen"
                dragClass="sortable-drag"
                onAdd={handleSortableEvent}
                onRemove={handleSortableEvent}
              >
                {section.tasks.map((task: Task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ReactSortable>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}