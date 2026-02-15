import classes from './churches_page.module.less';
import { AdminApi, CreateChurchParams, UpdateChurchParams } from '@admin-client/api/admin_api';
import { Church } from '@common/server-api/types/churches';
import { useCallback, useEffect, useState } from 'react';

type ChurchFormData = CreateChurchParams & { county?: string };

const emptyForm: ChurchFormData = { name: '', address: '', city: '', state: '', zip: '', county: '', email: '' };

export function ChurchesPage() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState<ChurchFormData>(emptyForm);
  const [formError, setFormError] = useState('');

  const fetchChurches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminApi.listChurches();
      setChurches(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChurches();
  }, [fetchChurches]);

  const handleCreate = async () => {
    setFormError('');
    try {
      await AdminApi.createChurch({
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        email: formData.email,
      });
      setShowCreate(false);
      setFormData(emptyForm);
      await fetchChurches();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleEdit = (church: Church) => {
    setEditingId(church.churchId);
    setFormData({
      name: church.name,
      address: church.address,
      city: church.city,
      state: church.state,
      zip: church.zip,
      county: church.county,
      email: church.email,
    });
    setShowCreate(false);
    setFormError('');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setFormError('');
    try {
      await AdminApi.updateChurch(editingId, formData as UpdateChurchParams);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchChurches();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleDelete = async (churchId: string) => {
    if (!confirm('Are you sure you want to delete this church?')) return;
    try {
      await AdminApi.deleteChurch(churchId);
      await fetchChurches();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowCreate(false);
    setFormData(emptyForm);
    setFormError('');
  };

  const openCreate = () => {
    setShowCreate(true);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const updateField = (field: keyof ChurchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className={classes.page}>Loading...</div>;
  }

  if (error) {
    return (
      <div className={classes.page}>
        <div className={classes.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={classes.page}>
      <div className={classes.header}>
        <h1 className={classes.title}>Churches</h1>
        <button className={classes.addButton} onClick={openCreate}>
          Add Church
        </button>
      </div>

      {(showCreate || editingId) && (
        <div className={classes.formCard}>
          <h3 className={classes.formTitle}>{editingId ? 'Edit Church' : 'Add Church'}</h3>
          <div className={classes.formGrid}>
            <input
              className={classes.input}
              placeholder="Name"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="Address"
              value={formData.address}
              onChange={e => updateField('address', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="City"
              value={formData.city}
              onChange={e => updateField('city', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="State"
              value={formData.state}
              onChange={e => updateField('state', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="ZIP"
              value={formData.zip}
              onChange={e => updateField('zip', e.target.value)}
            />
            {editingId && (
              <input
                className={classes.input}
                placeholder="County"
                value={formData.county || ''}
                onChange={e => updateField('county', e.target.value)}
              />
            )}
          </div>
          {formError && <div className={classes.formError}>{formError}</div>}
          <div className={classes.formActions}>
            <button className={classes.saveButton} onClick={editingId ? handleUpdate : handleCreate}>
              {editingId ? 'Save' : 'Create'}
            </button>
            <button className={classes.cancelButton} onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <table className={classes.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>City</th>
            <th>State</th>
            <th>ZIP</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {churches.length === 0 ? (
            <tr>
              <td colSpan={6} className={classes.emptyRow}>
                No churches found.
              </td>
            </tr>
          ) : (
            churches.map(church => (
              <tr key={church.churchId}>
                <td>{church.name}</td>
                <td>{church.city}</td>
                <td>{church.state}</td>
                <td>{church.zip}</td>
                <td>{church.email}</td>
                <td>
                  <button className={classes.actionButton} onClick={() => handleEdit(church)}>
                    Edit
                  </button>
                  <button
                    className={`${classes.actionButton} ${classes.deleteButton}`}
                    onClick={() => handleDelete(church.churchId)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
