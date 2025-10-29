import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DemoList.css';
import { IoSearch } from "react-icons/io5";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave } from '@fortawesome/free-solid-svg-icons';

const DemoList1 = () => {
  const [backendData, setBackendData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
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
        console.log("Fetched data for DemoList1:", response.data); // Debug log
        const mapped = response.data.filter(
          item =>
            (item.move_to_acc === true || item.move_to_acc === 1) &&
            (item.move_to_class !== true && item.move_to_class !== 1)
        );
        setBackendData(mapped);
      } catch (error) {
        console.error('Error fetching backend data:', error.response?.data || error.message);
      }
    };

    fetchBackendData();
  }, []);

  const filteredData = backendData.filter(
    (item) =>
      (item.fullName && item.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  const handleMoveToClassList = async (id) => {
    const token = localStorage.getItem('access');
    const payload = {
      move_to_class: true, //  Only this is needed to move to class list
      demo_class_status: 'Completed', // Optional, if you're using this field
    };
  
    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      //  Remove the student from DemoList1 after moving
      setBackendData((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error('Failed to move to class list:', error.response?.data || error.message);
    }
  };
  
  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditData(backendData[index]);
  };

  const handleSaveClick = async () => {
    const token = localStorage.getItem('access');
    const updatedRow = editData;
  
    const cost = parseFloat(updatedRow.packageCost) || 0;
    const paid = parseFloat(updatedRow.amountPaid) || 0;
    const disc = parseFloat(updatedRow.discount) || 0;
  
    // Calculated balance (read-only)
    const balance = cost - paid - disc;
  
    // Validation
    if (cost < 0 || paid < 0 || disc < 0) {
      alert("All values must be non-negative.");
      return;
    }
  
    if (paid + disc > cost) {
      alert("Amount Paid + Discount cannot exceed Package Cost.");
      return;
    }
  
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${updatedRow.id}/`,
        {
          packageCost: cost,
          amountPaid: paid,
          discount: disc,
          balanceAmount: balance,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const updatedData = [...backendData];
      updatedData[editIndex] = {
        ...updatedRow,
        packageCost: cost,
        amountPaid: paid,
        discount: disc,
        balanceAmount: balance,
      };
  
      setBackendData(updatedData);
      setEditIndex(null);
    } catch (error) {
      console.error('Error saving data:', error.response?.data || error.message);
      alert("Failed to save. Check permissions or data.");
    }
  };
  

  const handleChange = (field, value) => {
    const newEditData = {
      ...editData,
      [field]: Number(value),
    };
  
    const cost = parseFloat(newEditData.packageCost) || 0;
    const paid = parseFloat(newEditData.amountPaid) || 0;
    const disc = parseFloat(newEditData.discount) || 0;
  
    const balance = cost - paid - disc;
    newEditData.balanceAmount = balance;
  
    setEditData(newEditData);
  };
  
  return (
    <div className="demo-list-container" style={{ width: '100%' }}>
      <div className="header">
        <h2>Demo List</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search"
            aria-label="Search"
            role="searchbox"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            tabIndex={0}
          />
          <button className="search-button" tabIndex={0} aria-label="Search">
            <IoSearch />
          </button>
        </div>
      </div>

      <div className="demo-table-wrapper" style={{ width: '100%', overflowX: 'auto' }}>
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
              <th>Class List?</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td>{item.fullName || item.full_name || item.name || ''}</td>
                <td>{item.phone || item.phone_number || ''}</td>
                <td>{item.email || ''}</td>
                <td>{item.batch_code || ''}</td>
                <td>{item.module || item.package || item.batch_subject || ''}</td>

                {/* Package Cost */}
                <td>
                  {editIndex === index ? (
                    <input
                      type="number"
                      className="wide-input"
                      value={editData.packageCost || editData.package_cost || ''}
                      onChange={(e) => handleChange('packageCost', e.target.value)}
                    />
                  ) : (
                    `₹ ${item.packageCost || item.package_cost || 0} /-`
                  )}
                </td>

                {/* Amount Paid */}
                <td>
                  {editIndex === index ? (
                    <input
                      type="number"
                      className="wide-input"
                      value={editData.amountPaid || editData.amount_paid || ''}
                      onChange={(e) => handleChange('amountPaid', e.target.value)}
                    />
                  ) : (
                    `₹ ${item.amountPaid || item.amount_paid || 0} /-`
                  )}
                </td>

                {/* Discount */}
                <td>
                  {editIndex === index ? (
                    <input
                      type="number"
                      className="wide-input"
                      value={editData.discount || ''}
                      onChange={(e) => handleChange('discount', e.target.value)}
                    />
                  ) : (
                    `₹ ${item.discount || 0} /-`
                  )}
                </td>

                {/* Balance Amount */}
                <td style={{ color: (editIndex === index ? (editData.balanceAmount || editData.balance_amount) : (item.balanceAmount || item.balance_amount)) > 0 ? 'red' : 'inherit' }}>
                  {editIndex === index
                    ? `₹ ${(editData.balanceAmount || editData.balance_amount || 0)} /-`
                    : `₹ ${(item.balanceAmount || item.balance_amount || 0)} /-`}
                </td>


                <td>
                  {editIndex === index ? (
                    <span className="icon-btn save-btn" onClick={handleSaveClick}>
                      <FontAwesomeIcon icon={faSave} />
                    </span>
                  ) : (
                    <>
                      <span
                        className="icon-btn edit-btn"
                        onClick={() => handleEditClick(index)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </span>
                      <button
  className="move-btn"
  onClick={() => handleMoveToClassList(item.id)}
>
  Move to Class list
</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DemoList1;
