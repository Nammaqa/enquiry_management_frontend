import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlacementList.css';
import { IoSearch } from 'react-icons/io5';
import StudentViewDialog from '../pages/StudentViewDialog'; // adjust if dialog lives elsewhere

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

  /* ------------ btn styling helper ------------ */
  const buttonStyle = (variant) => {
    switch (variant) {
      case 'primary':
        return {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '1rem',
          fontFamily: "'Afacad', sans-serif",
          backgroundColor: '#031D4E',
          width: '100px',
          height: '44px',
          marginLeft: '-20px',
        };
      case 'ghost':
        return {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '1rem',
          backgroundColor: '#fff',
          fontFamily: "'Afacad', sans-serif",
          color: '#031D4E',
          width: '100px',
          height: '44px',
        };
      default: // outline
        return {
          padding: '10px 20px',
          border: '1px solid rgb(3, 29, 78)',
          borderRadius: '5px',
          backgroundColor: 'rgb(226, 236, 255)',
          color: 'rgb(3, 29, 78)',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '1rem',
          fontFamily: "'Afacad', sans-serif",
          width: '123px',
          height: '44px',
        };
    }
  };

  /* ------------ UI ------------ */
  return (
    <div
      style={{
        width: "1140px",
        padding: "3rem",
        paddingTop: "1.5rem",
        background: "#fff",
        flex: 1,
        fontFamily: "'Afacad', sans-serif",
      }}
    >
      <div
        className="placement-list-container"
        style={{ margin: 0, boxShadow: "none", padding: 0 }}
      >
        {/* header */}
        <div className="header">
          <h2>Placement List</h2>
          <form onSubmit={(e) => e.preventDefault()} className="search-form">
            <div className="search-input-container">
              <input
                className="search-input"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-button">
                <IoSearch />
              </button>
            </div>
          </form>
        </div>

        {/* table */}
        <div className="table-container">
          <table className="placement-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Package</th>
                <th>Package Code</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  className={idx % 2 ? "alternate-row" : ""}
                >
                  <td>{item.fullName || item.name}</td>
                  <td>{item.phone}</td>
                  <td>{item.email}</td>
                  <td>{item.packageName || item.batch_subject || "N/A"}</td>
                  <td>{item.packageCode || item.batch_code || "N/A"}</td>
                  <td className="text-right">
                    {item.package || item.packageName}
                  </td>
                  <td>
                    <button
                      style={{ ...buttonStyle("primary"), marginLeft: '0' }}
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
                  <td
                    colSpan="6"
                    style={{ textAlign: "center", padding: "1rem" }}
                  >
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
