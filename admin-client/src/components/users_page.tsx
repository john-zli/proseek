import classes from './shared_page.module.less';
import { AdminApi, UpdateUserParams } from '@admin-client/api/admin_api';
import { SanitizedUser } from '@common/server-api/types/users';
import { useCallback, useEffect, useState } from 'react';

const emptyForm: UpdateUserParams = { firstName: '', lastName: '', email: '', gender: 'Male' };

export function UsersPage() {
  const [users, setUsers] = useState<SanitizedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<UpdateUserParams>(emptyForm);
  const [formError, setFormError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AdminApi.listUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEdit = (user: SanitizedUser) => {
    setEditingId(user.userId);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
    });
    setFormError('');
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setFormError('');
    try {
      await AdminApi.updateUser(editingId, formData);
      setEditingId(null);
      setFormData(emptyForm);
      await fetchUsers();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await AdminApi.deleteUser(userId);
      await fetchUsers();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const updateField = (field: keyof UpdateUserParams, value: string) => {
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
        <h1 className={classes.title}>Users</h1>
      </div>

      {editingId && (
        <div className={classes.formCard}>
          <h3 className={classes.formTitle}>Edit User</h3>
          <div className={classes.formGrid}>
            <input
              className={classes.input}
              placeholder="First Name"
              value={formData.firstName}
              onChange={e => updateField('firstName', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="Last Name"
              value={formData.lastName}
              onChange={e => updateField('lastName', e.target.value)}
            />
            <input
              className={classes.input}
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
            />
            <select
              className={classes.input}
              value={formData.gender}
              onChange={e => updateField('gender', e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          {formError && <div className={classes.formError}>{formError}</div>}
          <div className={classes.formActions}>
            <button className={classes.saveButton} onClick={handleUpdate}>
              Save
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
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Gender</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={5} className={classes.emptyRow}>
                No users found.
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.userId}>
                <td className={classes.idCell}>{user.userId}</td>
                <td>
                  {user.firstName} {user.lastName}
                </td>
                <td>{user.email}</td>
                <td>{user.gender}</td>
                <td>
                  <button className={classes.actionButton} onClick={() => handleEdit(user)}>
                    Edit
                  </button>
                  <button
                    className={`${classes.actionButton} ${classes.deleteButton}`}
                    onClick={() => handleDelete(user.userId)}
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
