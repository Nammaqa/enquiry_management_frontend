import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AccountsDemoList = ({ isSidebarOpen }) => {
  const [accountsData, setAccountsData] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const token = localStorage.getItem('access');
      try {
        const res = await axios.get('http://localhost:8000/api/enquiries/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Filter for move_to_acc === true
        const filtered = res.data.filter(item => item.move_to_acc === true);
        setAccountsData(filtered);
      } catch (err) {
        setAccountsData([]);
        console.error('Failed to fetch accounts demo list:', err);
      }
    };
    fetchAccounts();
  }, []);

  return (
    <div className={`accounts-demo-list-container ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <h2>Accounts Demo List</h2>
      <table>
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Phone Number</th>
            <th>Email Address</th>
            <th>Package Code</th>
            <th>Package</th>
          </tr>
        </thead>
        <tbody>
          {accountsData.map((item) => (
            <tr key={item.id}>
              <td>{item.name || item.fullName || ''}</td>
              <td>{item.phone || item.phone_number || ''}</td>
              <td>{item.email || ''}</td>
              <td>{item.batch_code || item.package_code || ''}</td>
              <td>{item.module || item.package || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AccountsDemoList;