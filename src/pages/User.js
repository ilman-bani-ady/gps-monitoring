import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './User.css';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function User() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role: '' });
  const [addForm, setAddForm] = useState({ username: '', password: '', full_name: '', role: 'user' });
  const [addError, setAddError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const addUserModalRef = useRef();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:3013/api/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditUserId(user.id);
    setEditForm({ full_name: user.full_name, role: user.role });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`http://localhost:3013/api/user/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      setEditUserId(null);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`http://localhost:3013/api/user/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddChange = (e) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError(null);
    try {
      const response = await fetch('http://localhost:3013/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(addForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add user');
      }
      setAddForm({ username: '', password: '', full_name: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      setAddError(err.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="error">Access denied. Only admin can view this page.</div>;
  }

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6 d-flex align-items-center">
              <h2 className="mb-0">User Management</h2>
            </div>
            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addUserModal">
                Add User
              </button>
            </div>
          </div>
          {/* Modal Add User */}
          <div className="modal fade" id="addUserModal" tabIndex="-1" aria-labelledby="addUserModalLabel" aria-hidden="true" ref={addUserModalRef}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="addUserModalLabel">Add New User</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form onSubmit={handleAddUser}>
                  <div className="modal-body row g-3">
                    <div className="col-12">
                      <input type="text" name="username" className="form-control" placeholder="Username" value={addForm.username} onChange={handleAddChange} required />
                    </div>
                    <div className="col-12">
                      <input type="password" name="password" className="form-control" placeholder="Password" value={addForm.password} onChange={handleAddChange} required />
                    </div>
                    <div className="col-12">
                      <input type="text" name="full_name" className="form-control" placeholder="Full Name" value={addForm.full_name} onChange={handleAddChange} required />
                    </div>
                    <div className="col-12">
                      <select name="role" className="form-select" value={addForm.role} onChange={handleAddChange}>
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                      </select>
                    </div>
                    {addError && <div className="alert alert-danger py-2">{addError}</div>}
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" className="btn btn-success">Add User</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.username}</td>
                    <td>
                      {editUserId === u.id ? (
                        <input name="full_name" className="form-control" value={editForm.full_name} onChange={handleEditChange} />
                      ) : (
                        u.full_name
                      )}
                    </td>
                    <td>
                      {editUserId === u.id ? (
                        <select name="role" className="form-select" value={editForm.role} onChange={handleEditChange}>
                          <option value="admin">admin</option>
                          <option value="user">user</option>
                        </select>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td>{new Date(u.last_login).toLocaleString()}</td>
                    <td>
                      {editUserId === u.id ? (
                        <>
                          <button className="btn btn-success btn-sm me-2" onClick={() => handleEditSave(u.id)}>Save</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditUserId(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditClick(u)}>Edit</button>
                      )}
                      {user && user.role === 'admin' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* {user && user.role === 'admin' && (
        <Link to="/user" className="sidebar-button">
          <span className="icon">👤</span>
          User
        </Link>
      )} */}
    </div>
  );
}

export default User; 