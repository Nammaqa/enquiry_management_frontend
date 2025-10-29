// ---------------- Class_List.jsx ----------------
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DemoList.css';
import { IoSearch } from 'react-icons/io5';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave } from '@fortawesome/free-solid-svg-icons';

// 👉 import the dialog component you posted
import StudentDetailsDialog from './StudentDetailsDialog';
const Class_List = () => {
  const navigate = useNavigate();
  const [backendData, setBackendData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ---------------- fetch ----------------
  useEffect(() => {
    const fetchClassList = async () => {
      const token = localStorage.getItem('access');
      try {
        const res = await axios.get('http://localhost:8000/api/enquiries/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filtered = res.data
          .filter((i) => i.move_to_hr && !i.move_to_placements)
          .map((i) => ({
            ...i, //  keep everything from the backend

            //  aliases for easy rendering in table
            name: i.fullName || i.name || "",
            packageCode: i.packageCode || i.batch_code || "",
            package: i.package || i.packageName || i.batch_subject || "",
            dataLink: i.data_link || "",
            dataUpdated: i.data_updated || "",
            moveToPlacements: Boolean(i.move_to_placements),
            detailsDone: Boolean(i.details_done),
          }));


        setBackendData(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    fetchClassList();
  }, []);

  // ---------------- search ----------------
  const filteredData = backendData.filter(
    (item) =>
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ---------------- placement list move ----------------
  const handleMoveToPlacement = async (item) => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${item.id}/`,
        { move_to_placements: true },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      navigate('/placement-list', { state: { user: item } });
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- inline edit (placement, link, date) ----------------
  const handleEditClick = (idx) => {
    setEditIndex(idx);
    setEditData(filteredData[idx]);
  };

  const handleChange = (field, val) => {
    setEditData((p) => ({ ...p, [field]: val }));
  };

  const handleSaveInline = async () => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${editData.id}/`,
        {
          placement: editData.placement,
          data_link: editData.dataLink,
          data_updated: editData.dataUpdated,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const upd = [...backendData];
      upd[backendData.findIndex((i) => i.id === editData.id)] = editData;
      setBackendData(upd);
      setEditIndex(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- Add / View link handling ----------------
  const handleAddLink = async (item, idx) => {
    const url = prompt('Paste the URL:');
    if (!url) return;
    const token = localStorage.getItem('access');
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${item.id}/`,
        { data_link: url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const upd = [...backendData];
      upd[idx] = { ...upd[idx], dataLink: url };
      setBackendData(upd);
    } catch (err) {
      console.error(err);
    }
  };
  // ---------------- save full dialog ----------------
/* ---------- helpers (define once, above handleSaveDetails) ---------- */
const intOrNull = (v) => (v ? parseInt(v, 10) : null);
const strOrNull = (v) => (v?.trim() ? v.trim() : null);

/* ---------- save full dialog ---------- */
const handleSaveDetails = async (data) => {
  const token = localStorage.getItem('access');

  const processedData = {
    ...data,

    // mandatory years
    s10_year: parseInt(data.s10Year, 10),
    ug_year:  parseInt(data.ugYear, 10),

    // 12th (optional)
    s12_college: strOrNull(data.s12College),
    s12_board:   strOrNull(data.s12Board),
    s12_year:    intOrNull(data.s12Year),
    s12_score:   strOrNull(data.s12Score),

    // Diploma (optional)
    dip_college: strOrNull(data.dipCollege),
    dip_board:   strOrNull(data.dipBoard),
    dip_year:    intOrNull(data.dipYear),
    dip_score:   strOrNull(data.dipScore),

    // PG (optional)
    pg_college: strOrNull(data.pgCollege),
    pg_board:   strOrNull(data.pgBoard),
    pg_year:    intOrNull(data.pgYear),
    pg_score:   strOrNull(data.pgScore),
  };

  try {
    await axios.patch(
      `http://localhost:8000/api/enquiries/${data.id}/`,
      {
        ...processedData,
        details_done: true, //  set this when saved
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // mark row as saved (green button)
    setBackendData((prev) =>
      prev.map((r) => (r.id === data.id ? { ...r, detailsDone: true } : r))
    );
    alert("Details saved");
  } catch (err) {
    console.error(err.response?.data || err.message);
    alert("Failed to save\n" + JSON.stringify(err.response?.data, null, 2));
  }
};   // ← make sure this closing brace exists
  // ---------------- UI ----------------
  return (
    <div className="demo-list-container" style={{ width: "100%" }}>
      <div className="header">
        <h2>Class List</h2>
        <div className="search-box">
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
      </div>

      <div
        className="demo-table-wrapper"
        style={{ width: "100%", overflowX: "auto" }}
      >
        <table className="demo-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Package Code</th>
              <th>Package</th>
              <th>Placement</th>
              <th>Resume Link</th>
              <th>Data Updated</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.phone}</td>
                <td>{item.email}</td>
                <td>{item.packageCode || "N/A"}</td>
                <td>{item.package || "N/A"}</td>

                {/* placement (inline edit) */}
                <td>
                  {editIndex === idx ? (
                    <input
                      value={editData.placement}
                      onChange={(e) =>
                        handleChange("placement", e.target.value)
                      }
                    />
                  ) : (
                    item.placement
                  )}
                </td>

                {/* link add / view */}
                <td>
                  <button
                    className="icon-btn"
                    onClick={() => handleAddLink(item, idx)}
                  >
                    {item.dataLink ? "Change" : "Add"}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => window.open(item.dataLink, "_blank")}
                    disabled={!item.dataLink}
                    style={{ marginLeft: 4 }}
                  >
                    View
                  </button>
                </td>

                {/* date (inline edit) */}
                <td>
                  {editIndex === idx ? (
                    <input
                      type="date"
                      value={editData.dataUpdated || ""}
                      onChange={(e) =>
                        handleChange("dataUpdated", e.target.value)
                      }
                      max={new Date().toISOString().split("T")[0]}
                    />
                  ) : (
                    item.dataUpdated || "N/A"
                  )}
                </td>

                {/* action buttons */}
                <td>
                  {editIndex === idx ? (
                    <span className="icon-btn" onClick={handleSaveInline}>
                      <FontAwesomeIcon icon={faSave} />
                    </span>
                  ) : (
                    <>
                      <span
                        className="icon-btn"
                        onClick={() => handleEditClick(idx)}
                        style={{ marginRight: 6 }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </span>

                      {/* Add full‑details dialog */}
                      <button
                        className={`icon-btn ${
                          item.detailsDone ? "details-saved" : ""
                        }`}
                        onClick={() => {
                          setSelectedStudent(item);
                          setDialogOpen(true);
                        }}
                        title={
                          item.detailsDone
                            ? "View / Update Details"
                            : "Add Details"
                        }
                        style={{ marginRight: 6 }}
                      >
                        {item.detailsDone ? "Edit Details" : "Add Details"}
                      </button>

                      <button
                        className="move-btn"
                        onClick={() => handleMoveToPlacement(item)}
                      >
                        Move to Placement
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- dialog instance ---- */}
      {selectedStudent && (
        <StudentDetailsDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSave={handleSaveDetails}
          student={selectedStudent}
        />
      )}
    </div>
  );
};

export default Class_List;
