import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  Box,
  InputLabel,
  Select,
  FormControl,
  OutlinedInput,
  ListItemText,
  Typography,
  Alert,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { createTask, fetchCategories } from "../../api/tasks";
import type { Category, TaskInput as TaskInputBase, RecurringPattern } from "../../api/tasks";

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const ENVIRONMENTS = ["home", "office", "outdoors", "hybrid", "any"] as const;

interface NewTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated?: (task: unknown) => void;
}

interface TaskInput extends Omit<TaskInputBase, 'deadline' | 'recurring_pattern'> {
  deadline: Date | null;
  recurring_pattern?: Omit<RecurringPattern, 'end_date'> & { end_date?: Date | null };
}

export default function NewTaskDialog({ open, onClose, onTaskCreated }: NewTaskDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<TaskInput>({
    title: "",
    description: "",
    category_id: undefined,
    priority: "medium",
    estimated_duration_minutes: 30,
    deadline: null,
    fitting_environments: [],
    requires_focus: false,
    requires_deep_work: false,
    can_be_interrupted: true,
    requires_meeting: false,
    is_endless: false,
    is_recurring: false,
    recurring_pattern: undefined,
  });

  useEffect(() => {
    if (open) {
      setLoadingCategories(true);
      fetchCategories()
        .then(setCategories)
        .catch(() => setCategories([]))
        .finally(() => setLoadingCategories(false));
    }
  }, [open]);

  const handleChange = (field: keyof TaskInput, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Title is required.";
    if (!form.estimated_duration_minutes || form.estimated_duration_minutes <= 0)
      return "Estimated duration must be positive.";
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const payload: TaskInputBase = {
        ...form,
        fitting_environments: Array.isArray(form.fitting_environments) ? form.fitting_environments : [],
        deadline: form.deadline ? form.deadline.toISOString() : undefined,
        recurring_pattern: form.is_recurring && form.recurring_pattern ? {
          ...form.recurring_pattern,
          end_date: form.recurring_pattern.end_date ? form.recurring_pattern.end_date.toISOString() : undefined,
        } : undefined,
      };
      const task = await createTask(payload);
      if (onTaskCreated) onTaskCreated(task);
      onClose();
      setForm({
        title: "",
        description: "",
        category_id: undefined,
        priority: "medium",
        estimated_duration_minutes: 30,
        deadline: null,
        fitting_environments: [],
        requires_focus: false,
        requires_deep_work: false,
        can_be_interrupted: true,
        requires_meeting: false,
        is_endless: false,
        is_recurring: false,
        recurring_pattern: undefined,
      });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data && err.response.data.error && typeof err.response.data.error === 'object' && 'message' in err.response.data.error) {
        setError((err.response.data.error as { message: string }).message);
      } else {
        setError("Failed to create task.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Recurring pattern fields (simple example)
  const RecurringFields = () => (
    <Box mt={2}>
      <Typography variant="subtitle2">Recurring Pattern</Typography>
      <TextField
        label="Frequency"
        fullWidth
        margin="dense"
        value={form.recurring_pattern?.frequency || ""}
        onChange={(e) =>
          handleChange("recurring_pattern", {
            ...form.recurring_pattern,
            frequency: e.target.value,
          })
        }
        placeholder="e.g. weekly, daily"
      />
      <TextField
        label="Interval"
        type="number"
        fullWidth
        margin="dense"
        value={form.recurring_pattern?.interval || ""}
        onChange={(e) =>
          handleChange("recurring_pattern", {
            ...form.recurring_pattern,
            interval: Number(e.target.value),
          })
        }
        placeholder="e.g. 1"
      />
      <TextField
        label="Days of Week"
        fullWidth
        margin="dense"
        value={form.recurring_pattern?.days_of_week?.join(",") || ""}
        onChange={(e) =>
          handleChange("recurring_pattern", {
            ...form.recurring_pattern,
            days_of_week: e.target.value.split(",").map((d: string) => d.trim()),
          })
        }
        placeholder="e.g. MO,WE,FR"
      />
      <DateTimePicker
        label="End Date"
        value={form.recurring_pattern?.end_date || null}
        onChange={(date: Date | null) =>
          handleChange("recurring_pattern", {
            ...form.recurring_pattern,
            end_date: date,
          })
        }
        slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
      />
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12}}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              fullWidth
              required
              margin="dense"
            />
          </Grid>
          <Grid size={{ xs: 12}}>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              fullWidth
              multiline
              minRows={2}
              margin="dense"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6}}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category_id || ""}
                onChange={(e) => handleChange("category_id", e.target.value || undefined)}
                input={<OutlinedInput label="Category" />}
                disabled={loadingCategories}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.category_id} value={cat.category_id}>
                    <Chip label={cat.name} size="small" sx={{ bgcolor: cat.color_hex + '20', color: cat.color_hex, borderColor: cat.color_hex, mr: 1 }} />
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6}}>
            <TextField
              select
              label="Priority"
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              fullWidth
              margin="dense"
            >
              {PRIORITIES.map((p) => (
                <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6}}>
            <TextField
              label="Estimated Duration (minutes)"
              type="number"
              value={form.estimated_duration_minutes}
              onChange={(e) => handleChange("estimated_duration_minutes", Number(e.target.value))}
              fullWidth
              required
              margin="dense"
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6}}>
            <DateTimePicker
              label="Deadline"
              value={form.deadline}
              onChange={(date: Date | null) => handleChange("deadline", date)}
              slotProps={{ textField: { fullWidth: true, margin: "dense" } }}
            />
          </Grid>
          <Grid size={{ xs: 12}}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Fitting Environments</InputLabel>
              <Select
                multiple
                value={Array.isArray(form.fitting_environments) ? form.fitting_environments : []}
                onChange={(e) => handleChange("fitting_environments", Array.isArray(e.target.value) ? e.target.value : typeof e.target.value === 'string' ? e.target.value.split(',') : [])}
                input={<OutlinedInput label="Fitting Environments" />}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {ENVIRONMENTS.map((env) => (
                  <MenuItem key={env} value={env}>
                    <Checkbox checked={form.fitting_environments?.includes(env)} />
                    <ListItemText primary={env.charAt(0).toUpperCase() + env.slice(1)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6}}>
            <FormControlLabel
              control={<Checkbox checked={form.requires_focus} onChange={(e) => handleChange("requires_focus", e.target.checked)} />}
              label="Requires Focus"
            />
            <FormControlLabel
              control={<Checkbox checked={form.requires_deep_work} onChange={(e) => handleChange("requires_deep_work", e.target.checked)} />}
              label="Requires Deep Work"
            />
            <FormControlLabel
              control={<Checkbox checked={form.can_be_interrupted} onChange={(e) => handleChange("can_be_interrupted", e.target.checked)} />}
              label="Can Be Interrupted"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6}}>
            <FormControlLabel
              control={<Checkbox checked={form.requires_meeting} onChange={(e) => handleChange("requires_meeting", e.target.checked)} />}
              label="Requires Meeting"
            />
            <FormControlLabel
              control={<Checkbox checked={form.is_endless} onChange={(e) => handleChange("is_endless", e.target.checked)} />}
              label="Is Endless"
            />
            <FormControlLabel
              control={<Checkbox checked={form.is_recurring} onChange={(e) => handleChange("is_recurring", e.target.checked)} />}
              label="Is Recurring"
            />
          </Grid>
          {form.is_recurring && (
            <Grid size={{ xs: 12}}>
              <RecurringFields />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>Create</Button>
      </DialogActions>
    </Dialog>
  );
} 