import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Chip, TextField, List, ListItem, ListItemText, Divider, IconButton, Tooltip } from '@mui/material';
import { 
    Close as CloseIcon, 
    Edit as EditIcon, 
    Delete as DeleteIcon, 
    Comment as CommentIcon,
    MeetingRoom as MeetingIcon,
    Psychology as FocusIcon,
    School as DeepWorkIcon,
    Block as InterruptionIcon,
    AllInclusive as EndlessIcon,
    Repeat as RecurringIcon
} from '@mui/icons-material';
import { updateTask } from '../../api/tasks';
import { getTask, addTaskComment, updateTaskComment, deleteTaskComment } from '../../api/tasks';
import NewTaskDialog from '../tasks/NewTaskDialog';
import type { Task, TaskComment } from '../../api/tasks';
import '../../styles/taskDetailsDialog.css';

interface TaskDetailsDialogProps {
    isOpen: boolean;
    taskId: string | null;
    onClose: () => void;
    onTaskUpdated: () => void;
    onTaskUnscheduled: () => void;
}

interface CommentFormData {
    content: string;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
    isOpen,
    taskId,
    onClose,
    onTaskUpdated,
    onTaskUnscheduled
}) => {
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [commentForm, setCommentForm] = useState<CommentFormData>({ content: '' });
    const [commentLoading, setCommentLoading] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentContent, setEditingCommentContent] = useState<string>('');

    // Fetch task details when dialog opens
    useEffect(() => {
        if (isOpen && taskId) {
            fetchTaskDetails();
        }
    }, [isOpen, taskId]);

    const fetchTaskDetails = async () => {
        if (!taskId) return;
        
        setLoading(true);
        try {
            const taskData = await getTask(taskId);
            setTask(taskData);
        } catch (error) {
            console.error('Failed to fetch task details:', error);
            alert('Failed to load task details');
        } finally {
            setLoading(false);
        }
    };

    const handleUnschedule = async () => {
        if (!taskId) return;
        
        setLoading(true);
        try {
            await updateTask(taskId, { scheduled_slots: [] });
            onTaskUnscheduled();
            onClose();
        } catch (error) {
            console.error('Failed to unschedule task:', error);
            alert('Failed to unschedule task');
        } finally {
            setLoading(false);
        }
    };

    const handleEditTask = () => {
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = async (updatedTask?: Task) => {
        setEditDialogOpen(false);
        
        if (updatedTask && task) {
            // If the task duration changed, update the scheduled slot to match
            if (updatedTask.estimated_duration_minutes !== task.estimated_duration_minutes && 
                task.scheduled_slots && task.scheduled_slots.length > 0) {
                
                const slot = task.scheduled_slots[0];
                const startTime = new Date(slot.start_time);
                const newEndTime = new Date(startTime.getTime() + updatedTask.estimated_duration_minutes * 60000);
                
                try {
                    await updateTask(task.task_id, {
                        scheduled_slots: [{
                            start_time: slot.start_time,
                            end_time: newEndTime.toISOString(),
                            calendar_day_id: slot.calendar_day_id
                        }]
                    });
                } catch (error) {
                    console.error('Failed to update scheduled slot duration:', error);
                }
            }
        }
        
        // Refresh task details after edit
        fetchTaskDetails();
        onTaskUpdated();
    };

    const handleAddComment = async () => {
        if (!taskId || !commentForm.content.trim()) return;
        
        setCommentLoading(true);
        try {
            await addTaskComment(taskId, { content: commentForm.content });
            setCommentForm({ content: '' });
            setShowCommentForm(false);
            // Refresh task details to show new comment
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to add comment:', error);
            alert('Failed to add comment');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleEditComment = (comment: TaskComment) => {
        setEditingCommentId(comment.comment_id);
        setEditingCommentContent(comment.content);
    };

    const handleUpdateComment = async () => {
        if (!taskId || !editingCommentId || !editingCommentContent.trim()) return;
        
        setCommentLoading(true);
        try {
            await updateTaskComment(taskId, editingCommentId, { content: editingCommentContent });
            setEditingCommentId(null);
            setEditingCommentContent('');
            // Refresh task details to show updated comment
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to update comment:', error);
            alert('Failed to update comment');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!taskId || !confirm('Are you sure you want to delete this comment?')) return;
        
        setCommentLoading(true);
        try {
            await deleteTaskComment(taskId, commentId);
            // Refresh task details to show updated comments
            fetchTaskDetails();
        } catch (error) {
            console.error('Failed to delete comment:', error);
            alert('Failed to delete comment');
        } finally {
            setCommentLoading(false);
        }
    };

    const handleCancelEditComment = () => {
        setEditingCommentId(null);
        setEditingCommentContent('');
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDateTime = (dateTime: string) => {
        return new Date(dateTime).toLocaleString();
    };

    if (!task && !loading) {
        return null;
    }

    return (
        <>
            <Dialog 
                open={isOpen} 
                onClose={onClose}
                maxWidth="md"
                fullWidth
                className="task-details-dialog"
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">
                            {loading ? 'Loading...' : task?.title}
                        </Typography>
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    {loading ? (
                        <Typography>Loading task details...</Typography>
                    ) : task ? (
                        <Box>
                            {/* Task Details */}
                            <Box mb={3}>
                                <Typography variant="h6" gutterBottom>Task Details</Typography>
                                <Typography variant="body1" paragraph>
                                    <strong>Description:</strong> {task.description || 'No description'}
                                </Typography>
                                
                                <Box display="flex" gap={1} mb={2}>
                                    <Chip 
                                        label={task.category?.name || 'Uncategorized'}
                                        style={{ 
                                            backgroundColor: task.category?.color_hex || '#3B82F6',
                                            color: 'white'
                                        }}
                                        variant="filled"
                                    />
                                    <Chip 
                                        label={`Priority: ${task.priority || 'medium'}`}
                                        color={task.priority === 'high' ? 'error' : task.priority === 'low' ? 'success' : 'warning'}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Duration: ${formatDuration(task.estimated_duration_minutes)}`}
                                        color="info"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>

                            {/* Task Properties */}
                            <Box mb={3}>
                                <Typography variant="h6" gutterBottom>Task Properties</Typography>
                                <Box display="flex" gap={1} flexWrap="wrap">
                                    {task.requires_meeting && (
                                        <Tooltip title="Requires meeting">
                                            <Chip
                                                icon={<MeetingIcon />}
                                                label="Meeting"
                                                color="primary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Tooltip>
                                    )}
                                    {task.requires_focus && (
                                        <Tooltip title="Requires focus time">
                                            <Chip
                                                icon={<FocusIcon />}
                                                label="Focus"
                                                color="secondary"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Tooltip>
                                    )}
                                    {task.requires_deep_work && (
                                        <Tooltip title="Requires deep work">
                                            <Chip
                                                icon={<DeepWorkIcon />}
                                                label="Deep Work"
                                                color="info"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Tooltip>
                                    )}
                                    {!task.can_be_interrupted && (
                                        <Tooltip title="Cannot be interrupted">
                                            <Chip
                                                icon={<InterruptionIcon />}
                                                label="No Interruptions"
                                                color="warning"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Tooltip>
                                    )}
                                    {task.is_endless && (
                                        <Tooltip title="Endless task">
                                            <Chip
                                                icon={<EndlessIcon />}
                                                label="Endless"
                                                color="error"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Tooltip>
                                    )}
                                    {task.is_recurring && (
                                        <Tooltip title="Recurring task">
                                            <Chip
                                                icon={<RecurringIcon />}
                                                label="Recurring"
                                                color="success"
                                                variant="outlined"
                                                size="small"
                                            />
                                        </Tooltip>
                                    )}
                                    {!task.requires_meeting && !task.requires_focus && !task.requires_deep_work && 
                                     task.can_be_interrupted && !task.is_endless && !task.is_recurring && (
                                        <Typography variant="body2" color="text.secondary">
                                            No special properties
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* Scheduled Time */}
                            {task.scheduled_slots && task.scheduled_slots.length > 0 && (
                                <Box mb={3}>
                                    <Typography variant="h6" gutterBottom>Scheduled Time</Typography>
                                    {task.scheduled_slots.map((slot, index) => (
                                        <Box key={index} p={2} bgcolor="grey.50" borderRadius={1}>
                                            <Typography variant="body2">
                                                <strong>Start:</strong> {formatDateTime(slot.start_time)}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>End:</strong> {formatDateTime(slot.end_time)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}

                            {/* Comments */}
                            <Box mb={3}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6">Comments</Typography>
                                    <Button
                                        startIcon={<CommentIcon />}
                                        onClick={() => setShowCommentForm(!showCommentForm)}
                                        size="small"
                                    >
                                        Add Comment
                                    </Button>
                                </Box>
                                
                                {showCommentForm && (
                                    <Box mb={2}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            placeholder="Enter your comment..."
                                            value={commentForm.content}
                                            onChange={(e) => setCommentForm({ content: e.target.value })}
                                            disabled={commentLoading}
                                        />
                                        <Box mt={1} display="flex" gap={1}>
                                            <Button
                                                variant="contained"
                                                onClick={handleAddComment}
                                                disabled={commentLoading || !commentForm.content.trim()}
                                                size="small"
                                            >
                                                {commentLoading ? 'Adding...' : 'Add Comment'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={() => {
                                                    setShowCommentForm(false);
                                                    setCommentForm({ content: '' });
                                                }}
                                                size="small"
                                            >
                                                Cancel
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                                
                                {task.comments && task.comments.length > 0 ? (
                                    <List>
                                        {task.comments.map((comment: TaskComment, index: number) => (
                                            <React.Fragment key={comment.comment_id || index}>
                                                <ListItem alignItems="flex-start">
                                                    {editingCommentId === comment.comment_id ? (
                                                        <Box width="100%">
                                                            <TextField
                                                                fullWidth
                                                                multiline
                                                                rows={2}
                                                                value={editingCommentContent}
                                                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                                                disabled={commentLoading}
                                                                size="small"
                                                            />
                                                            <Box mt={1} display="flex" gap={1}>
                                                                <Button
                                                                    variant="contained"
                                                                    onClick={handleUpdateComment}
                                                                    disabled={commentLoading || !editingCommentContent.trim()}
                                                                    size="small"
                                                                >
                                                                    {commentLoading ? 'Saving...' : 'Save'}
                                                                </Button>
                                                                <Button
                                                                    variant="outlined"
                                                                    onClick={handleCancelEditComment}
                                                                    disabled={commentLoading}
                                                                    size="small"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    ) : (
                                                        <>
                                                            <ListItemText
                                                                primary={comment.content}
                                                                secondary={formatDateTime(comment.created_at)}
                                                            />
                                                            <Box display="flex" gap={1}>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleEditComment(comment)}
                                                                    disabled={commentLoading}
                                                                >
                                                                    <EditIcon fontSize="small" />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeleteComment(comment.comment_id)}
                                                                    disabled={commentLoading}
                                                                    color="error"
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </>
                                                    )}
                                                </ListItem>
                                                {index < (task.comments?.length || 0) - 1 && <Divider />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        No comments yet
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ) : null}
                </DialogContent>
                
                <DialogActions>
                    <Button
                        startIcon={<EditIcon />}
                        onClick={handleEditTask}
                        disabled={loading}
                    >
                        Modify Task
                    </Button>
                    <Button
                        startIcon={<DeleteIcon />}
                        onClick={handleUnschedule}
                        disabled={loading}
                        color="warning"
                    >
                        Unschedule
                    </Button>
                    <Button onClick={onClose} disabled={loading}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Task Dialog */}
            {task && (
                <NewTaskDialog
                    open={editDialogOpen}
                    onClose={handleEditDialogClose}
                    task={task}
                    onTaskUpdated={handleEditDialogClose}
                />
            )}
        </>
    );
};

export default TaskDetailsDialog; 