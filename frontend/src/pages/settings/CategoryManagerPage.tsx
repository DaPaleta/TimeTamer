import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchCategories } from '../../api/tasks';
import type { Category } from '../../api/tasks';
import api from '../../api/tasks';

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E42', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F59E0B', // Yellow
];

const CategoryManagerPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addName, setAddName] = useState('');
  const [addColor, setAddColor] = useState(DEFAULT_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [editDialog, setEditDialog] = useState<null | Category>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(DEFAULT_COLORS[0]);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await api.post('/tasks/categories', { name: addName, color_hex: addColor });
      setAddName('');
      setAddColor(DEFAULT_COLORS[0]);
      loadCategories();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        setError((err.response.data as { detail: string }).detail);
      } else {
        setError('Failed to add category.');
      }
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditDialog(cat);
    setEditName(cat.name);
    setEditColor(cat.color_hex);
  };

  const handleEditSave = async () => {
    if (!editDialog) return;
    setEditSaving(true);
    setError(null);
    try {
      await api.put(`/tasks/categories/${editDialog.category_id}`, { name: editName, color_hex: editColor });
      setEditDialog(null);
      loadCategories();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        setError((err.response.data as { detail: string }).detail);
      } else {
        setError('Failed to update category.');
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteLoading(true);
    setError(null);
    try {
      await api.delete(`/tasks/categories/${id}`);
      loadCategories();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'detail' in err.response.data) {
        setError((err.response.data as { detail: string }).detail);
      } else {
        setError('Failed to delete category.');
      }
    } finally {
      setDeleteId(null);
      setDeleteLoading(false);
    }
  };

  return (
    <Box maxWidth="sm" mx="auto" mt={4}>
      <Typography variant="h4" gutterBottom>Manage Categories</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box mb={3}>
        <Typography variant="h6">Add Category</Typography>
        <Stack direction="row" spacing={2} alignItems="center" mt={1}>
          <TextField
            label="Name"
            value={addName}
            onChange={e => setAddName(e.target.value)}
            size="small"
          />
          <TextField
            select
            label="Color"
            value={addColor}
            onChange={e => setAddColor(e.target.value)}
            size="small"
            sx={{ minWidth: 100 }}
          >
            {DEFAULT_COLORS.map(color => (
              <MenuItem key={color} value={color}>
                <Chip size="small" label={color} sx={{ bgcolor: color, color: '#fff', mr: 1 }} />
                {color}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={handleAdd} disabled={adding || !addName.trim()}>
            {adding ? <CircularProgress size={20} /> : 'Add'}
          </Button>
        </Stack>
      </Box>
      <Typography variant="h6" gutterBottom>Categories</Typography>
      {loading ? <CircularProgress /> : (
        <List>
          {categories.map(cat => (
            <ListItem key={cat.category_id} sx={{ borderBottom: '1px solid #eee' }}>
              <ListItemText
                primary={<>
                  <Chip size="small" label={cat.name} sx={{ bgcolor: cat.color_hex, color: '#fff', mr: 1 }} />
                  {cat.name}
                </>}
                secondary={cat.color_hex}
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => openEdit(cat)}><EditIcon /></IconButton>
                <IconButton edge="end" color="error" onClick={() => handleDelete(cat.category_id)} disabled={deleteId === cat.category_id && deleteLoading}>
                  {deleteId === cat.category_id && deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)}>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            select
            label="Color"
            value={editColor}
            onChange={e => setEditColor(e.target.value)}
            fullWidth
            margin="dense"
          >
            {DEFAULT_COLORS.map(color => (
              <MenuItem key={color} value={color}>
                <Chip size="small" label={color} sx={{ bgcolor: color, color: '#fff', mr: 1 }} />
                {color}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)} disabled={editSaving}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={editSaving || !editName.trim()}>
            {editSaving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManagerPage; 