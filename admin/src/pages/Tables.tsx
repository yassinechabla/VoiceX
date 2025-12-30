import { useEffect, useState } from 'react';
import { tablesApi, Table } from '../api/tables';
import './Tables.css';

function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 2,
    zone: '',
    isJoinable: true,
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await tablesApi.getAll();
      setTables(data);
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tablesApi.update(editingTable._id, formData);
      } else {
        await tablesApi.create(formData);
      }
      setShowForm(false);
      setEditingTable(null);
      setFormData({ name: '', capacity: 2, zone: '', isJoinable: true });
      loadTables();
    } catch (error) {
      console.error('Failed to save table:', error);
    }
  };

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    setFormData({
      name: table.name,
      capacity: table.capacity,
      zone: table.zone || '',
      isJoinable: table.isJoinable,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await tablesApi.delete(id);
      loadTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading tables...</div>;
  }

  return (
    <div className="tables-page">
      <div className="page-header">
        <h1>Tables Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Table'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="table-form">
          <h2>{editingTable ? 'Edit Table' : 'New Table'}</h2>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="form-group">
            <label>Zone (optional)</label>
            <input
              type="text"
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isJoinable}
                onChange={(e) => setFormData({ ...formData, isJoinable: e.target.checked })}
              />
              Joinable (can be combined with other tables)
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingTable ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTable(null);
                setFormData({ name: '', capacity: 2, zone: '', isJoinable: true });
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="tables-grid">
        {tables.map((table) => (
          <div key={table._id} className="table-card">
            <h3>{table.name}</h3>
            <p><strong>Capacity:</strong> {table.capacity}</p>
            {table.zone && <p><strong>Zone:</strong> {table.zone}</p>}
            <p><strong>Joinable:</strong> {table.isJoinable ? 'Yes' : 'No'}</p>
            <div className="table-actions">
              <button onClick={() => handleEdit(table)} className="btn-edit">
                Edit
              </button>
              <button onClick={() => handleDelete(table._id)} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tables;

