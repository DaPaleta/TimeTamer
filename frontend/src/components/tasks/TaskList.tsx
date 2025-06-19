// TaskList.jsx
import React from "react";
import "./TaskList.css"; // Custom styles
import TaskItem from "./TaskItem";

// Define types for task, section, and tasksByCategory
export interface Task {
  id: string;
  title: string;
  duration?: string;
  // Add other task properties as needed
}

export interface TaskSection {
  name: string;
  tasks: Task[];
}

export type TasksByCategory = {
  [category: string]: TaskSection[];
};

export default function TaskList({ tasksByCategory }: { tasksByCategory: TasksByCategory }) {
  return (
    <div className="task-list-container" id="task-list">
      <div className="task-list-header">
        <input className="search-box" placeholder="Search for something..." />
        <div className="segmented-controls">
          {/* Add segmented controls here */}
        </div>
        <button className="filter-btn">☰</button>
      </div>
      {Object.entries(tasksByCategory).map(([category, sections]) => (
        <div className="task-category" key={category}>
          <div className="category-header">
            <span>{category}</span>
            <a href="#">Collapse</a>
          </div>
          {sections.map((section: TaskSection) => (
            <div className="task-section" key={section.name}>
              <div className="section-header">
                <span>{section.name}</span>
                <span className="badge">{section.tasks.length}</span>
              </div>
              {section.tasks.map((task: Task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}