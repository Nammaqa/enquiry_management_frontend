import React, { useState, useEffect } from 'react';
import { IoSearch } from "react-icons/io5";
import './ClassList.css';
import axios from 'axios';

const ClassList = ({ isSidebarOpen, role = 'accounts' }) => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const fetchClassList = async () => {
      const token = localStorage.getItem('access');
      if (!token) {
        console.warn('No token found');
        setData([]); // Clear state if unauthenticated
        return;
      }

      try {
        const response = await axios.get('http://localhost:8000/api/enquiries/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const mapped = response.data
          .filter(item => {
            const movedToClass = Boolean(item.move_to_class);
            const paymentStatus = Boolean(item.payment_status); // true = paid

            return movedToClass && !paymentStatus; // only show unpaid & moved-to-class students
          })
          .map(item => {
            const packageCost = parseFloat(item.packageCost) || 0;
            const amountPaid = parseFloat(item.amountPaid) || 0;
            const discount = parseFloat(item.discount) || 0;
            const balanceAmount = packageCost - amountPaid - discount;

            return {
              ...item,
              paymentCalling1: item.pay_calling1 || '',
              paymentCalling2: item.pay_calling2 || '',
              paymentCalling3: item.pay_calling3 || '',
              paymentCalling4: item.pay_calling4 || '',
              paymentCalling5: item.pay_calling5 || '',
              paymentStatus: item.payment_status ? 'Complete' : 'Pending',
              balanceAmount,
            };
          });

  
        setData(mapped);
      } catch (error) {
        console.error('Error fetching class list:', error.response?.data || error.message);
        setData([]); // Clear state on error
      }
    };
  
    fetchClassList();
  }, [role]); // Add role here
  
    

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditData(data[index]);
  };

  const handleInputChange = (field, value) => {
    const updated = { ...editData, [field]: value };
  
    const cost = parseFloat(updated.packageCost) || 0;
    const paid = parseFloat(updated.amountPaid) || 0;
    const disc = parseFloat(updated.discount) || 0;
  
    updated.balanceAmount = cost - paid - disc;
  
    setEditData(updated);
  };
  

  const handleSaveClick = async () => {
    const token = localStorage.getItem('access');
  
    const cost = parseFloat(editData.packageCost) || 0;
    const paid = parseFloat(editData.amountPaid) || 0;
    const disc = parseFloat(editData.discount) || 0;
  
    const balance = cost - paid - disc;
  
    if (cost < 0 || paid < 0 || disc < 0) {
      alert("All values must be non-negative.");
      return;
    }
  
    if (paid + disc > cost) {
      alert("Amount Paid + Discount cannot exceed Package Cost.");
      return;
    }
  
    //  Prevent marking as complete when balance > 0
    if (editData.paymentStatus === 'Complete' && balance > 0) {
      alert("Cannot mark payment as Complete while balance is not 0.");
      return;
    }
  
    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${editData.id}/`, {
        pay_calling1: editData.paymentCalling1,
        pay_calling2: editData.paymentCalling2,
        pay_calling3: editData.paymentCalling3,
        pay_calling4: editData.paymentCalling4,
        pay_calling5: editData.paymentCalling5,
        packageCost: cost,
        amountPaid: paid,
        discount: disc,
        balanceAmount: balance,
        payment_status: editData.paymentStatus === 'Complete' && balance === 0,  // ✅ Only update when balance is 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      const updatedData = [...data];
      updatedData[editIndex] = {
        ...editData,
        packageCost: cost,
        amountPaid: paid,
        discount: disc,
        balanceAmount: balance,
        paymentStatus: (editData.paymentStatus === 'Complete' && balance === 0) ? 'Complete' : 'Pending',
      };
  
      setData(updatedData);
      setEditIndex(null);
    } catch (error) {
      console.error('Save failed:', error.response?.data || error.message);
      alert("Failed to save. Try again.");
    }
  };

  
  const handleMoveToHR = async (id) => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, {
        move_to_hr: true,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update UI (optional: remove student from view)
      setData(prev => prev.filter(item => item.id !== id));
      alert("Moved to HR!");
    } catch (error) {
      console.error("Error moving to HR:", error.response?.data || error.message);
    }
  };
  const handleMoveToAccounts = async (id) => {
    const token = localStorage.getItem('access');
    try {
      await axios.patch(`http://localhost:8000/api/enquiries/${id}/`, {
        move_to_accounts: true, // Update this field based on your backend
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Optional: remove row from list
      setData(prev => prev.filter(item => item.id !== id));
      alert('Moved to Accounts successfully!');
    } catch (error) {
      console.error('Error moving to accounts:', error.response?.data || error.message);
      alert('Failed to move to accounts.');
    }
  };
  

  const filteredData = data.filter(item =>
    (item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  return (
    <div style={{
      width: '1140px',
      padding: '3rem',
      paddingTop: '1.5rem',
      background: '#fff',
      flex: 1,
      fontFamily: "'Afacad', sans-serif"
    }}>
      <div className="class-list-container" style={{ margin: 0, boxShadow: 'none', padding: 0 }}>
        <div className="header">
          <h2>Class List</h2>
          <form className="search-form" onSubmit={(e) => e.preventDefault()}>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Search"
                aria-label="Search"
                role="searchbox"
                className="search-input"
                value={searchTerm}
                onChange={handleSearchChange}
                tabIndex={0}
              />
              <button className="search-button" tabIndex={0} aria-label="Search">
                <IoSearch />
              </button>
            </div>
          </form>
        </div>
        <div className="table-container">
          <table className="class-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Package Code</th>
                <th>Package</th>
                <th>Batch Code</th>
                <th>Package Cost</th>
                <th>Amount Paid</th>
                <th>Discount</th>
                <th>Balance Amount</th>
                <th>Payment Calling 1</th>
                <th>Payment Calling 2</th>
                <th>Payment Calling 3</th>
                <th>Payment Calling 4</th>
                <th>Payment Calling 5</th>
                <th>Payment Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? "alternate-row" : ""}>
                  <td>{item.fullName || item.name || 'N/A'}</td>
                  <td>{item.phone || 'N/A'}</td>
                  <td>{item.email || 'N/A'}</td>
                  <td>{item.packageCode || item.batch_code || 'N/A'}</td>
                  <td>{item.packageName || item.batch_subject || 'N/A'}</td>
                  <td>{item.batchCode || item.batch_code || 'N/A'}</td>
                  <td className="text-right">
                    {editIndex === idx ? (
                      <input
                        type="number"
                        value={editData.packageCost || ''}
                        onChange={(e) => handleInputChange('packageCost', e.target.value)}
                      />
                    ) : (
                      parseFloat(item.packageCost || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })
                    )}
                  </td>
                  <td className="text-right">
                    {editIndex === idx ? (
                      <input
                        type="number"
                        value={editData.amountPaid || ''}
                        onChange={(e) => handleInputChange('amountPaid', e.target.value)}
                      />
                    ) : (
                      parseFloat(item.amountPaid || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })
                    )}
                  </td>
                  <td className="text-right">
                    {editIndex === idx ? (
                      <input
                        type="number"
                        value={editData.discount || ''}
                        onChange={(e) => handleInputChange('discount', e.target.value)}
                      />
                    ) : (
                      parseFloat(item.discount || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })
                    )}
                  </td>
                  <td className="text-right" style={{ color: item.balanceAmount > 0 ? 'red' : 'inherit' }}>
                    {editIndex === idx ? (
                      <input
                        type="number"
                        value={editData.balanceAmount || ''}
                        onChange={(e) => handleInputChange('balanceAmount', e.target.value)}
                      />
                    ) : (
                      parseFloat(item.balanceAmount || 0).toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })
                    )}
                  </td>


                  {[1,2,3,4,5].map(i => (
                    <td key={`calling${i}`}>
                      {editIndex === idx ? (
                        <input
                          type="text"
                          value={editData[`paymentCalling${i}`] || ''}
                          onChange={(e) => handleInputChange(`paymentCalling${i}`, e.target.value)}
                        />
                      ) : (
                        item[`paymentCalling${i}`] || ''
                      )}
                    </td>
                  ))}
                  <td style={{ color: item.paymentStatus === 'Pending' ? 'red' : 'inherit' }}>
                    {editIndex === idx ? (
                      <select
                        value={editData.paymentStatus || 'Pending'}
                        onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      >
                        <option value="Complete">Complete</option>
                        <option value="Pending">Pending</option>
                      </select>
                    ) : (
                      item.paymentStatus || 'Pending'
                    )}
                  </td>

                  <td>
                    {editIndex === idx ? (
                      <>
                        <button onClick={handleSaveClick} style={{ marginRight: '6px' }}>Save</button>
                        <button onClick={() => { setEditIndex(null); setEditData({}); }} style={{ marginRight: '6px' }}>Cancel</button>
                        <button onClick={() => handleMoveToAccounts(item.id)}>Move</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(idx)} style={{ marginRight: '6px' }}>Edit</button>
                        <button onClick={() => handleMoveToHR(item.id)}>Move to HR</button>
                        </>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassList;