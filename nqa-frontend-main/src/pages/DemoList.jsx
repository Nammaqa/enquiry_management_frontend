import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DemoList.css';
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

const DemoList = ({ isSidebarOpen }) => {
  const [demoData, setDemoData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editableField, setEditableField] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    const payload = {
      move_to_demo: false,
      move_to_acc: false,
      demo_class_status: 'Not Interested',
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

  // ✅ Inline Edit Handlers
  const handleEditClick = (id, field, value) => {
    setEditableField(`${id}-${field}`);
    setEditValue(value);
  };

  const handleSave = async (id, field, value) => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${id}/`,
        { [field]: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDemoData((prev) =>
        prev.map((user) => (user.id === id ? { ...user, [field]: value } : user))
      );
      setEditableField(null);
    } catch (error) {
      console.error('Error updating field:', error);
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
              e.key === 'Enter' && handleSave(id, field, editValue)
            }
            autoFocus
          />
        </td>
      );
    }

    return (
      <td onClick={() => handleEditClick(id, field, value)}>
        <div className="cell-content">
          <span>{value || '-'}</span>
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

  // Filter data based on search
  const filteredData = demoData.filter((user) =>
    (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone || '').includes(searchTerm)
  );

  // ✅ Pagination Logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
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

  return (
    <div className="demo-page">
      {/* Header Container */}
      <div className="demo-header-container">
        <div className="demo-header">
          <h2 className="demo-title">Demo List</h2>
          <div className="demo-controls">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="search-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="demo-content-container">
        {/* Table */}
        <div className="table-wrapper">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Package Code</th>
                <th>Package</th>
                <th>Demo Class Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((user) => (
                  <tr key={user.id}>
                    {renderEditableCell(user.id, 'fullName', user.fullName)}
                    {renderEditableCell(user.id, 'phone', user.phone)}
                    {renderEditableCell(user.id, 'email', user.email)}
                    {renderEditableCell(user.id, 'code', user.code)}
                    {renderEditableCell(user.id, 'package', user.package)}
                    
                    <td>
                      <select
                        className="demo-status-select"
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      >
                        <option value="Not yet started">Not yet started</option>
                        <option value="In progress">In progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Not Interested">Not Interested</option>
                      </select>
                    </td>

                    <td>
                      {user.status === 'Completed' && (
                        <button className="move-btn completed" onClick={() => handleMoveToAccounts(user.id)}>
                          Move to Accounts DL
                        </button>
                      )}
                      {user.status === 'Not Interested' && (
                        <button className="move-btn completed" onClick={() => handleMoveBackToEnquiryList(user.id)}>
                          Back to Enquiry List
                        </button>
                      )}
                      {(user.status !== 'Completed' && user.status !== 'Not Interested') && (
                        <button className="move-btn disabled" disabled>
                          Move
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No demo records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span className="pagination-text">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredData.length)} of {filteredData.length} entries
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
      </div>
    </div>
  );
};

export default DemoList;
