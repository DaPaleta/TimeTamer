import React, { memo } from "react";
import type { Task } from "./TaskList";

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = memo(({ task }) => {
  return (
    <div
      className="task-item"
      data-title={task.title}
      data-duration={task.duration}
      data-task-id={task.id}
      draggable={true}
    >
      {/* Task content here */}
      <span className="task-title">{task.title}</span>
      {task.duration && (
        <span className="task-duration">{task.duration}</span>
      )}
      {/* ...other task details */}
    </div>
  );
});

export default TaskItem; 