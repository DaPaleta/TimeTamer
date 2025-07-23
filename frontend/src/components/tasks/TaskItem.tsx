import React, { memo } from 'react'
import type { Task } from '../../api/tasks'

interface TaskItemProps {
  task: Task & { duration: string }
}

const TaskItem: React.FC<TaskItemProps> = memo(({ task }) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return '#f44336'
      case 'high':
        return '#ff9800'
      case 'medium':
        return '#ffc107'
      case 'low':
        return '#4caf50'
      default:
        return '#9e9e9e'
    }
  }

  return (
    <div
      className="task-item"
      data-title={task.title}
      data-duration={task.duration}
      data-task-id={task.task_id}
      draggable={true}
      data-testid="task-item"
    >
      <div className="task-content" data-testid="task-content">
        <div className="task-header" data-testid="task-header">
          <span className="task-title">{task.title}</span>
          {task.priority && (
            <span
              className="task-priority"
              style={{
                backgroundColor: getPriorityColor(task.priority),
                color: 'white',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              {task.priority}
            </span>
          )}
        </div>
        {task.description && <div className="task-description">{task.description}</div>}
        <div className="task-footer" data-testid="task-footer">
          {task.duration && <span className="task-duration">{task.duration}</span>}
        </div>
      </div>
    </div>
  )
})

export default TaskItem
