import React, { useEffect, useRef, memo } from "react";
import { Draggable } from "@fullcalendar/interaction";
import type { Task } from "./TaskList";

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = memo(({ task }) => {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const draggable = new Draggable(elRef.current!, {
      eventData: function (eventEl) {
        return {
          title: eventEl.getAttribute("data-title"),
          duration: eventEl.getAttribute("data-duration"),
        };
      },
    });

    // a cleanup function
    return () => draggable.destroy();
  });

  return (
    <div
      ref={elRef}
      className="task-item"
      data-title={task.title}
      data-duration={task.duration}
    >
      {/* Task content here */}
      <span className="task-title">{task.title}</span>
      {/* ...other task details */}
    </div>
  );
});

export default TaskItem; 