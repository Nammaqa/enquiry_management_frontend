import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DemoList.css';
import { IoSearch } from "react-icons/io5";

const DemoList = ({ isSidebarOpen }) => {
  const [demoData, setDemoData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDemoList();
  }, []);

  const fetchDemoList = async () => {
    const token = localStorage.getItem('access');
    try {
      const response = await axios.get('http://localhost:8000/api/enquiries/', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mapped = response.data
        .filter(item => (item.move_to_demo === true || item.move_to_demo === 1) && item.move_to_acc !== true)
        .map((item) => ({
          id: item.id,
          fullName: item.fullName || item.full_name || item.name || '',
          phone: item.phone || item.phone_number || '',
          email: item.email || '',
          code: item.batch_code || '',
          package: item.module || item.package || '',
          status: item.demo_class_status || '',
          move_to_demo: item.move_to_demo || false,
          move_to_acc: item.move_to_acc || false,
        }));

      setDemoData(mapped);
    } catch (error) {
      setDemoData([]);
      console.error('Failed to fetch:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const token = localStorage.getItem('access');
    const user = demoData.find((u) => u.id === id);
    if (!user) return;

    const payload = {
      demo_class_status: newStatus,
    };

    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDemoData((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: newStatus } : u))
      );
    } catch (error) {
      console.error('Failed to update status:', error.response?.data || error.message);
    }
  };

  const handleMoveToAccounts = async (id) => {
    const token = localStorage.getItem('access');
    const payload = {
      move_to_demo: true,
      move_to_acc: true,
      demo_class_status: 'Completed',
    };
    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDemoData((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Failed to move to accounts:', error.response?.data || error.message);
    }
  };

  const handleMoveBackToEnquiryList = async (id) => {
    const token = localStorage.getItem('access');
    // Only update the necessary fields, leave others untouched
    const payload = {
      move_to_demo: false,
      move_to_acc: false,
      demo_class_status: 'Not Interested', // or keep as user.status if you want
    };

    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDemoData((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Failed to move back to enquiry:', error.response?.data || error.message);
    }
  };

  const filteredData = demoData.filter((user) =>
    (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`demo-list-container ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <div className="header">
        <h2>Demo List</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button">
            <IoSearch />
          </button>
        </div>
      </div>

      <table className="demo-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Phone Number</th>
            <th>Email Address</th>
            <th>Package Code</th>
            <th>Package</th>
            <th>Demo Class Status</th>
            <th>Move?</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((user, index) => (
            <tr key={index}>
              <td>{user.fullName}</td>
              <td>{user.phone}</td>
              <td>{user.email}</td>
              <td>{user.code}</td>
              <td>{user.package}</td>
              <td>
                <select
                  className="demo-status-select"
                  value={user.status}
                  onChange={(e) => handleStatusChange(user.id, e.target.value)}
                  style={{
                    width: '150px',
                    height: '35px',
                    padding: '5px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                  }}
                >
                  <option value="Not yet started">Not yet started</option>
                  <option value="In progress">In progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Not Interested">Not Interested</option>
                </select>
              </td>
              <td>
                {user.status === 'Completed' && (
                  <button className="move-btn" onClick={() => handleMoveToAccounts(user.id)}>
                    Move to Accounts DL
                  </button>
                )}
                {user.status === 'Not Interested' && (
                  <button className="move-btn" onClick={() => handleMoveBackToEnquiryList(user.id)}>
                    Back to Enquiry List
                  </button>
                )}
                {(user.status !== 'Completed' && user.status !== 'Not Interested') && (
                  <button className="move-btn disabled-btn" disabled>
                    Move
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DemoList;
