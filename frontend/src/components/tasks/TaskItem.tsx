import React from "react";
import type { Task } from "./TaskList";

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  return (
    <div
      className="task-item"
      data-title={task.title}
      data-duration={task.duration}
    >
      {/* Task content here */}
      <span className="task-title">{task.title}</span>
      {/* ...other task details */}
    </div>
  );
};

export default TaskItem; 