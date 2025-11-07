import React, { useEffect, useState } from "react";
import axios from "axios";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./EnquiryList.css";

const EnquiryList = ({ isSidebarOpen }) => {
  const [enquiries, setEnquiries] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [batchSubject, setBatchSubject] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [success, setSuccess] = useState(false);
  const [editableField, setEditableField] = useState(null);
  const [editValue, setEditValue] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // ✅ Fetch Enquiries
  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    const token = localStorage.getItem("access");
    try {
      const res = await axios.get("http://localhost:8000/api/enquiries/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data.filter(
        (e) => e.move_to_demo === false || e.move_to_demo === 0
      );

      const mapped = data.map((item) => ({
        id: item.id,
        full_name: item.fullName || item.name || "",
        phone_number: item.phone || "",
        email: item.email || "",
        current_location: item.location || "",
        module: item.module || "",
        training_mode: item.timing || "",
        training_timings: item.trainingTime || "",
        start_time: item.startTime || "",
        calling1: item.calling1 || "",
        calling2: item.calling2 || "",
        calling3: item.calling3 || "",
        calling4: item.calling4 || "",
        calling5: item.calling5 || "",
        previous_interaction:
          item.previousInteraction || item.previous_interaction || "",
      }));

      setEnquiries(mapped);
      setFiltered(mapped);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
    }
  };

  // ✅ Search Filter
  useEffect(() => {
    const filteredResults = enquiries.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.phone_number?.includes(search)
    );
    setFiltered(filteredResults);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [search, enquiries]);

  // ✅ Selection Logic
  const toggleSelect = (id) => {
    if (mode === "single") {
      setSelected([id]);
    } else {
      setSelected((prev) =>
        prev.includes(id)
          ? prev.filter((sid) => sid !== id)
          : [...prev, id]
      );
    }
  };

  const selectAll = (checked) => {
    setSelected(checked ? currentRows.map((e) => e.id) : []);
  };

  // ✅ Enable Move only if any calling field has "interested"
  const isMoveEnabled = (row) => {
    const callings = [
      row.calling1,
      row.calling2,
      row.calling3,
      row.calling4,
      row.calling5,
    ];
    return callings.some((c) => c && c.toLowerCase().includes("interested"));
  };

  // ✅ Inline Edit
  const handleEditClick = (id, field, value) => {
    setEditableField(`${id}-${field}`);
    setEditValue(value);
  };

  const handleSave = async (id, field, value) => {
    const token = localStorage.getItem("access");
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${id}/`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnquiries((prev) =>
        prev.map((enq) => (enq.id === id ? { ...enq, [field]: value } : enq))
      );
      setEditableField(null);
    } catch (error) {
      console.error("Error updating field:", error);
    }
  };

  const renderEditableCell = (id, field, value) => {
    const key = `${id}-${field}`;
    if (editableField === key) {
      return (
        <td className="editable-cell">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => handleSave(id, field, editValue)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSave(id, field, editValue)
            }
            autoFocus
          />
        </td>
      );
    }

    return (
      <td onClick={() => handleEditClick(id, field, value)}>
        <div className="cell-content">
          <span>{value || "-"}</span>
          <svg
            className="edit-icon"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
          >
            <path
              d="M10.586 1.586a2 2 0 0 1 2.828 2.828l-8 8-3.414.586.586-3.414 8-8z"
              stroke="#5B8DEF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </td>
    );
  };

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setSelected([]); // Clear selections when changing pages
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
    setSelected([]); // Clear selections when changing rows per page
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // ✅ Handle Move (both single & batch)
  const handleMoveClick = () => {
    if (selected.length === 0) {
      alert("Please select at least one enquiry!");
      return;
    }
    setShowMoveModal(true);
  };

  // ✅ Submit Move to Demo
  const submitMove = async () => {
    const token = localStorage.getItem("access");
    if (!batchSubject.trim() || !batchCode.trim()) {
      alert("Please fill both fields");
      return;
    }

    try {
      await Promise.all(
        selected.map((id) =>
          axios.patch(
            `http://localhost:8000/api/enquiries/${id}/`,
            {
              batch_code: batchCode,
              package_code: batchCode,
              batch_subject: batchSubject,
              module: batchSubject,
              package: batchSubject,
              move_to_demo: true,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setEnquiries((prev) => prev.filter((e) => !selected.includes(e.id)));
      setShowMoveModal(false);
      setBatchSubject("");
      setBatchCode("");
      setSelected([]);
      setMode(null);
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        navigate("/demo-list");
      }, 2500);
    } catch (error) {
      console.error("Move failed:", error);
    }
  };

  return (
    <div className="enquiry-page">
      {/* Header Container */}
      <div className="enquiry-header-container">
        <div className="enquiry-header">
          <h2 className="enquiry-title">Enquiry List</h2>
          <div className="enquiry-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="search-icon" />
            </div>

            <button
              className={`mode-btn ${mode === "single" ? "active" : ""}`}
              onClick={() => {
                setMode("single");
                setSelected([]);
              }}
            >
              Single Mode
            </button>

            <button
              className={`mode-btn yellow ${mode === "batch" ? "active" : ""}`}
              onClick={() => {
                setMode("batch");
                setSelected([]);
              }}
            >
              Batch Mode
            </button>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="enquiry-content-container">
        {/* Table */}
        <div className="table-wrapper">
          <table className="enquiry-table">
            <thead>
              <tr>
                {(mode === "batch" || mode === "single") && (
                  <th className="checkbox-col">
                    {mode === "batch" && (
                      <label className="select-all">
                        <input
                          type="checkbox"
                          onChange={(e) => selectAll(e.target.checked)}
                          checked={
                            selected.length === currentRows.length &&
                            currentRows.length > 0
                          }
                        />
                        <span>Select all</span>
                      </label>
                    )}
                  </th>
                )}
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Current Location</th>
                <th>Subject / Module</th>
                <th>Training Mode</th>
                <th>Training Timings</th>
                <th>Start Time</th>
                <th>Calling 1</th>
                <th>Calling 2</th>
                <th>Calling 3</th>
                <th>Calling 4</th>
                <th>Calling 5</th>
                <th>Previous Interaction</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((row) => (
                  <tr key={row.id}>
                    {(mode === "batch" || mode === "single") && (
                      <td className="checkbox-col">
                        {mode === "batch" ? (
                          <input
                            type="checkbox"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                          />
                        ) : (
                          <input
                            type="radio"
                            name="singleSelect"
                            checked={selected.includes(row.id)}
                            onChange={() => toggleSelect(row.id)}
                          />
                        )}
                      </td>
                    )}

                    {renderEditableCell(row.id, "full_name", row.full_name)}
                    {renderEditableCell(row.id, "phone_number", row.phone_number)}
                    {renderEditableCell(row.id, "email", row.email)}
                    {renderEditableCell(row.id, "current_location", row.current_location)}
                    {renderEditableCell(row.id, "module", row.module)}
                    {renderEditableCell(row.id, "training_mode", row.training_mode)}
                    {renderEditableCell(row.id, "training_timings", row.training_timings)}
                    {renderEditableCell(row.id, "start_time", row.start_time)}
                    {renderEditableCell(row.id, "calling1", row.calling1)}
                    {renderEditableCell(row.id, "calling2", row.calling2)}
                    {renderEditableCell(row.id, "calling3", row.calling3)}
                    {renderEditableCell(row.id, "calling4", row.calling4)}
                    {renderEditableCell(row.id, "calling5", row.calling5)}
                    {renderEditableCell(row.id, "previous_interaction", row.previous_interaction)}

                    <td>
                      <button
                        className={`move-btn ${isMoveEnabled(row) ? "" : "disabled"}`}
                        disabled={!isMoveEnabled(row)}
                        onClick={() => {
                          if (isMoveEnabled(row)) {
                            setSelected([row.id]);
                            setShowMoveModal(true);
                          }
                        }}
                      >
                        Move to Demo List
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="16" className="no-data">
                    No enquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span className="pagination-text">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filtered.length)} of {filtered.length} entries
              </span>
              <div className="rows-per-page">
                <label>Rows per page:</label>
                <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <div className="page-numbers">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Move Footer */}
        {(mode === "batch" || mode === "single") && (
          <div className="batch-footer">
            <button className="batch-move-btn" onClick={handleMoveClick}>
              Move
            </button>
          </div>
        )}
      </div>

      {/* Move Modal */}
      {showMoveModal && (
        <div className="modal">
          <div className="modal-box">
            <h3>Move</h3>
            <p>Enter details to move selected students to Demo List.</p>

            <input
              type="text"
              placeholder="Subject"
              value={batchSubject}
              onChange={(e) => setBatchSubject(e.target.value)}
            />

            <input
              type="text"
              placeholder="Package Code"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
            />

            <div className="modal-actions">
              <button className="cancel" onClick={() => setShowMoveModal(false)}>
                Cancel
              </button>
              <button className="confirm" onClick={submitMove}>
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {success && (
        <div className="success-modal">
          <div className="success-box">
            <div className="success-circle"></div>
            <h3>Move Successful</h3>
            <p>Students moved to Demo List</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryList;
