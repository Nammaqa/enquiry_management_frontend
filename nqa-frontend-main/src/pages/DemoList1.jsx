import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './acc_demolist.css';
import { Search } from 'lucide-react';
import TablePagination from '@mui/material/TablePagination';

const DemoList1 = () => {
  const [backendData, setBackendData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editableField, setEditableField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchBackendData();
  }, []);

  const fetchBackendData = async () => {
    const token = localStorage.getItem('access');

    if (!token) {
      console.error('No access token found. Please login.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:8000/api/enquiries/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched data for DemoList1:", response.data);
      const mapped = response.data.filter(
        item =>
          (item.move_to_acc === true || item.move_to_acc === 1) &&
          (item.move_to_class !== true && item.move_to_class !== 1)
      );
      setBackendData(mapped);
      setFiltered(mapped);
      setPage(0); // Reset to first page when data is fetched
    } catch (error) {
      console.error('Error fetching backend data:', error.response?.data || error.message);
    }
  };

  // Search Filter
  useEffect(() => {
    const filtered_data = backendData.filter((item) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      const fullName = (item.fullName || item.full_name || item.name || '').toLowerCase();
      const phone = (item.phone || item.phone_number || '').toString();
      const email = (item.email || '').toLowerCase();
      const packageCode = (item.batch_code || '').toLowerCase();

      return fullName.includes(searchLower) || 
             phone.includes(searchTerm) || 
             email.includes(searchLower) || 
             packageCode.includes(searchLower);
    });
    setFiltered(filtered_data);
    setPage(0); // Reset to first page when search term changes
  }, [searchTerm, backendData]);

  const handleMoveToClassList = async (id) => {
    const token = localStorage.getItem('access');
    const payload = {
      move_to_class: true,
      demo_class_status: 'Completed',
    };

    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBackendData((prev) => prev.filter((u) => u.id !== id));
      setFiltered((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Failed to move to class list:', error.response?.data || error.message);
    }
  };

  // Inline Edit
  const handleEditClick = (id, field, value) => {
    setEditableField(`${id}-${field}`);
    setEditValue(value || '');
  };

  const handleSave = async (id, field, value) => {
    const token = localStorage.getItem('access');
    
    // Validation for numeric fields
    if (['packageCost', 'amountPaid', 'discount'].includes(field)) {
      const numValue = parseFloat(value) || 0;
      if (numValue < 0) {
        alert("Value must be non-negative.");
        return;
      }

      // Get current row data
      const currentRow = backendData.find(item => item.id === id);
      const cost = field === 'packageCost' ? numValue : (parseFloat(currentRow.packageCost || currentRow.package_cost) || 0);
      const paid = field === 'amountPaid' ? numValue : (parseFloat(currentRow.amountPaid || currentRow.amount_paid) || 0);
      const disc = field === 'discount' ? numValue : (parseFloat(currentRow.discount) || 0);

      if (paid + disc > cost) {
        alert("Amount Paid + Discount cannot exceed Package Cost.");
        return;
      }

      const balance = cost - paid - disc;

      try {
        await axios.patch(
          `http://localhost:8000/api/enquiries/${id}/`,
          {
            [field]: numValue,
            packageCost: cost,
            amountPaid: paid,
            discount: disc,
            balanceAmount: balance,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setBackendData((prev) =>
          prev.map((item) => 
            item.id === id 
              ? { ...item, [field]: numValue, packageCost: cost, amountPaid: paid, discount: disc, balanceAmount: balance } 
              : item
          )
        );
        setEditableField(null);
      } catch (error) {
        console.error('Error updating field:', error);
      }
    } else {
      // For text fields like batch_code
      try {
        await axios.patch(
          `http://localhost:8000/api/enquiries/${id}/`,
          { [field]: value },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBackendData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
        setEditableField(null);
      } catch (error) {
        console.error('Error updating field:', error);
      }
    }
  };

  const renderEditableCell = (id, field, value, isNumeric = false) => {
    const key = `${id}-${field}`;
    if (editableField === key) {
      return (
        <td className="editable-cell">
          <input
            type={isNumeric ? "number" : "text"}
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
          <span>{isNumeric ? `₹ ${value || 0} /-` : (value || "-")}</span>
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

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calculate paginated data
  const paginatedData = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
                <th>Package Cost</th>
                <th>Amount Paid</th>
                <th>Discount</th>
                <th>Balance Amount</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fullName || item.full_name || item.name || ''}</td>
                    <td>{item.phone || item.phone_number || ''}</td>
                    <td>{item.email || ''}</td>
                    {renderEditableCell(item.id, 'batch_code', item.batch_code, false)}
                    <td>{item.module || item.package || item.batch_subject || ''}</td>
                    {renderEditableCell(item.id, 'packageCost', item.packageCost || item.package_cost, true)}
                    {renderEditableCell(item.id, 'amountPaid', item.amountPaid || item.amount_paid, true)}
                    {renderEditableCell(item.id, 'discount', item.discount, true)}
                    <td style={{ color: (item.balanceAmount || item.balance_amount || 0) > 0 ? 'red' : 'inherit' }}>
                      {`₹ ${(item.balanceAmount || item.balance_amount || 0)} /-`}
                    </td>
                    <td>
                      <button
                        className="move-btn"
                        onClick={() => handleMoveToClassList(item.id)}
                      >
                        Move to Class List
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    No demo records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Component */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>
    </div>
  );
};

export default DemoList1;
