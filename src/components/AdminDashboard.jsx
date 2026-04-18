import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      // 보안 규칙이 업데이트되어야 작동합니다.
      const q = query(collection(db, 'users'), limit(50));
      const querySnapshot = await getDocs(q);
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setFetching(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading Auth...</div>;
  if (!isAdmin) return <div className="admin-error">Access Denied. Admin privileges required.</div>;

  return (
    <div className="admin-dashboard" style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh', color: '#333' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>BrioDo Admin Dashboard</h1>
        <p>Welcome, {user?.email}</p>
      </header>

      <section className="stats-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{users.length}+</p>
        </div>
        <div style={cardStyle}>
          <h3>API Usage (Today)</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>-</p>
        </div>
      </section>

      <section className="user-list">
        <h2>Recent Users</h2>
        <button onClick={fetchUsers} disabled={fetching} style={buttonStyle}>
          {fetching ? 'Refreshing...' : 'Refresh List'}
        </button>
        <div style={{ overflowX: 'auto', marginTop: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#white' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={thStyle}>User ID</th>
                <th style={thStyle}>Last Login</th>
                <th style={thStyle}>Achievements</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{u.id}</td>
                  <td style={tdStyle}>{u.lastLogin?.toDate?.().toLocaleString() || 'N/A'}</td>
                  <td style={tdStyle}>{(u.achievements || []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const buttonStyle = {
  padding: '8px 16px',
  background: '#4a90e2',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  marginBottom: '10px'
};

const thStyle = { textAlign: 'left', padding: '12px', color: '#666' };
const tdStyle = { padding: '12px', fontSize: '14px' };

export default AdminDashboard;
