import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlacementList.css';
import { IoSearch } from 'react-icons/io5';
import StudentViewDialog from '../pages/StudentViewDialog';

const PlacementList = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  /* ------------ fetch once ------------ */
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('access');
      try {
        const res = await axios.get('http://localhost:8000/api/enquiries/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // keep entire object so dialog has every field
        const filtered = res.data.filter((i) => i.move_to_placements);
        setData(filtered);
      } catch (err) {
        console.error(
          'Error fetching placement list:',
          err.response?.data || err.message
        );
      }
    })();
  }, []);

  /* ------------ search filter ------------ */
  const filteredData = data.filter(
    (i) =>
      (i.fullName || i.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (i.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ------------ UI ------------ */
  return (
    <div className="placement-list-container">
      <div className="placement-header-container">
        <div className="placement-header">
          <h2>Placement List</h2>
          <div className="placement-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <IoSearch className="search-icon" />
            </div>
          </div>
        </div>
      </div>

      <div className="placement-content-container">
        <div className="placement-table-wrapper">
          <table className="placement-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Package</th>
                <th>Package Code</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={item.id ?? idx}>
                  <td>{item.fullName || item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.email}</td>
                  <td>{item.packageName || item.batch_subject || "N/A"}</td>
                  <td>{item.packageCode || item.batch_code || "N/A"}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => {
                        setViewStudent(item);
                        setViewOpen(true);
                      }}
                    >
                      View More
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="6" className="no-data">
                    No matching students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* dialog */}
      <StudentViewDialog
        open={viewOpen}
        student={viewStudent}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
};

export default PlacementList;