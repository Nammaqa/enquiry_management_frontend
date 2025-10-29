import './EnquiryList.css';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EnquiryList = ({ isSidebarOpen }) => {
  const [showBatchMove, setShowBatchMove] = useState(false);
  const [batchSubject, setBatchSubject] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [enquiries, setEnquiries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState('single');
  const [editRowId, setEditRowId] = useState(null);
  const [editData, setEditData] = useState({});
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [batchSubjectError, setBatchSubjectError] = useState('');
  const [batchCodeError, setBatchCodeError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnquiries = () => {
      const token = localStorage.getItem('access');
      axios.get('http://localhost:8000/api/enquiries/', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log('API response:', res.data);
  
          const filtered = res.data
            .filter(item => item.move_to_demo === false || item.move_to_demo === 0);  // Filter only non-demo
  
          const mapped = filtered.map((item) => ({
            id: item.id,
            fullName: item.fullName || item.name || '',
            phone: item.phone || '',
            email: item.email || '',
            current_location: item.location || '',
            module: item.module || '',
            trainingMode: item.timing || '',
            trainingTimings: item.trainingTime || '',
            startTime: item.startTime || '',
            calling1: item.calling1 || '',
            calling2: item.calling2 || '',
            calling3: item.calling3 || '',
            calling4: item.calling4 || '',
            calling5: item.calling5 || '',
            previousInteraction: item.previousInteraction || item.previous_interaction || '',
            move_to_demo: item.move_to_demo || 0,
          }));
  
          setEnquiries(mapped);
        })
        .catch(err => {
          console.error('Error fetching enquiries:', err);
        });
    };
  
    fetchEnquiries();
    const handler = () => fetchEnquiries();
    window.addEventListener('enquiryAdded', handler);
    return () => window.removeEventListener('enquiryAdded', handler);
  }, []);
  

  const buttonStyle = (variant) => {
    switch (variant) {
      case 'primary':
        return {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          color: '#FFFFFF',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '1rem',
          fontFamily: "'Afacad', sans-serif",
          backgroundColor: '#031D4E',
          width: '100px',
          height: '44px',
          marginLeft: '-20px'
        };
      case 'ghost':
        return {
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '1rem',
          backgroundColor: '#FFFFFF',
          fontFamily: "'Afacad', sans-serif",
          color: '#031D4E',
          width: '100px',
          height: '44px'
        };
      case 'outline':
      default:
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
          height: '44px'
        };
    }
  };

  const handleMoveToDemoList = (ids) => {
    const selectedEnquiries = enquiries.filter((e) => ids.includes(e.id));
    setSelectedEnquiry(selectedEnquiries);
    setShowBatchMove(true);
  };

  const handleEditClick = (id) => {
    setEditRowId(id);
    const enquiry = enquiries.find((e) => e.id === id);
    setEditData({
      calling1: enquiry.calling1 ?? '',
      calling2: enquiry.calling2 ?? '',
      calling3: enquiry.calling3 ?? '',
      calling4: enquiry.calling4 ?? '',
      calling5: enquiry.calling5 ?? '',
      previousInteraction: enquiry.previousInteraction ?? '',
    });
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    try {
      const token = localStorage.getItem('access');
      const fieldsToSave = {
        calling1: editData.calling1 && editData.calling1.trim() !== '' ? editData.calling1.trim() : null,
        calling2: editData.calling2 && editData.calling2.trim() !== '' ? editData.calling2.trim() : null,
        calling3: editData.calling3 && editData.calling3.trim() !== '' ? editData.calling3.trim() : null,
        calling4: editData.calling4 && editData.calling4.trim() !== '' ? editData.calling4.trim() : null,
        calling5: editData.calling5 && editData.calling5.trim() !== '' ? editData.calling5.trim() : null,
        previous_interaction: editData.previousInteraction && editData.previousInteraction.trim() !== '' ? editData.previousInteraction.trim() : null,
      };
      const response = await axios.patch(
        `http://localhost:8000/api/enquiries/${editRowId}/`,
        fieldsToSave,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === editRowId
            ? {
                ...e,
                ...response.data,
                previousInteraction: response.data.previous_interaction ?? response.data.previousInteraction ?? '',
              }
            : e
        )
      );
      setEditRowId(null);
      setEditData({});
    } catch (error) {
      alert('Failed to save changes.');
    }
  };

  const isSaveDisabled = () => {
    if (!editRowId) return true;
    const original = enquiries.find((e) => e.id === editRowId);
    return (
      original.calling1 === (editData.calling1 ?? '') &&
      original.calling2 === (editData.calling2 ?? '') &&
      original.calling3 === (editData.calling3 ?? '') &&
      original.calling4 === (editData.calling4 ?? '') &&
      original.calling5 === (editData.calling5 ?? '') &&
      original.previousInteraction === (editData.previousInteraction ?? '')
    );
  };

  const handleBatchMoveSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    if (!batchSubject.trim()) {
      setBatchSubjectError('Batch Subject is required');
      hasError = true;
    } else {
      setBatchSubjectError('');
    }
    if (!batchCode.trim()) {
      setBatchCodeError('Batch Code is required');
      hasError = true;
    } else {
      setBatchCodeError('');
    }
    if (hasError) return;
    const token = localStorage.getItem('access');
    try {
      await Promise.all(selectedEnquiry.map(async (enq) => {
        // Only update the necessary fields, leave others untouched
        const payload = {
          batch_code: batchCode,
          package_code: batchCode,
          batch_subject: batchSubject,
          module: batchSubject,
          package: batchSubject,
          move_to_demo: true,
        };
        await axios.patch(`http://localhost:8000/api/enquiries/${enq.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }));
      setEnquiries((prev) => prev.filter((e) =>
        !selectedEnquiry.some(se => se.id === e.id)
      ));
      setBatchSubject("");
      setBatchCode("");
      setShowBatchMove(false);
      navigate('/demo-list');
      window.location.reload();
    } catch (error) {
      let msg = 'Batch move failed.';
      if (error.response && error.response.data) {
        msg += '\n' + JSON.stringify(error.response.data);
        console.error('Batch move error:', error.response.data);
      } else {
        console.error('Batch move error:', error);
      }
      alert(msg);
    }
  };

  const filtered = enquiries.filter((e) =>
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { field: 'fullName', headerName: 'Full Name', width: 180 },
    { field: 'phone', headerName: 'Phone Number', width: 180 },
    { field: 'email', headerName: 'Email Address', width: 250 },
    { field: 'module', headerName: 'Subject / Module', width: 180 },
    { field: 'trainingMode', headerName: 'Training Mode', width: 150 },
    { field: 'trainingTimings', headerName: 'Training Timings', width: 180 },
    { field: 'startTime', headerName: 'Start Time', width: 150 },
    // Custom editable fields
    ...['calling1', 'calling2', 'calling3', 'calling4', 'calling5', 'previousInteraction'].map((field) => ({
      field,
      headerName: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      width: 180,
      renderCell: (params) => editRowId === params.row.id ? (
        <input
          type="text"
          value={editData[field] ?? ''}
          onChange={e => handleInputChange(field, e.target.value)}
          style={{ width: '100%', minWidth: 120, padding: '8px' }}
          placeholder="Update"
        />
      ) : (
        params.value
      )
    })),
    {
      field: 'action',
      headerName: 'Action',
      width: 200,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '5px' }}>
          {editRowId === params.row.id ? (
            <>
              <button style={buttonStyle('outline')} onClick={() => {
                setEditRowId(null);
                setEditData({});
              }}>Cancel</button>
              <button style={buttonStyle('primary')} onClick={handleSaveClick} disabled={isSaveDisabled()}>Save</button>
            </>
          ) : (
            <>
              <button style={buttonStyle('outline')} onClick={() => handleEditClick(params.row.id)}>Edit</button>
              <button style={buttonStyle('primary')} onClick={() => handleMoveToDemoList([params.row.id])}>Move</button>
            </>
          )}
        </div>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <div className={`enquiry-list-page ${!isSidebarOpen ? 'sidebar-closed' : ''}`}>
      <div className="toolbar">
        <div className="title">Enquiry List</div>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="mode-buttons">
          <button
            className={mode === 'single' ? 'active' : ''}
            style={buttonStyle('primary')}
            onClick={() => {
              setMode('single');
              if (selectedRows.length > 0) {
                handleMoveToDemoList(selectedRows);
              }
            }}
          >
            Move .....
          </button>
        </div>
      </div>

      <div className="table-container">
        <Box sx={{ height: 580, width: '100%' }}>
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSize={50}
            rowsPerPageOptions={[50]}
            checkboxSelection
            disableRowSelectionOnClick
            onSelectionModelChange={(newSelection) => {
              setSelectedRows(newSelection);
            }}
          />
        </Box>
      </div>

      {showBatchMove && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Batch Move</h2>
            <p>
              Enter the below details to move the students to the demo list, <br />
              make sure your selected students are of the same batch and <br />
              subject before you batch move.
            </p>
            <form onSubmit={handleBatchMoveSubmit}>
              <div>
                <label htmlFor="batch-subject">Batch Subject</label>
                <select
                  id="batch-subject"
                  value={batchSubject}
                  onChange={(e) => setBatchSubject(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                >
                  <option value="">Select Subject</option>
                  <option value="Python Full Stack">Python Full Stack</option>
                  <option value="Java Full Stack">Java Full Stack</option>
                  <option value="Software Testing">Software Testing</option>
                  <option value="AI and ML">AI and ML</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                </select>
                {batchSubjectError && <div style={{ color: 'red', fontSize: '0.9em' }}>{batchSubjectError}</div>}
              </div>
              <div>
                <label htmlFor="batch-code">Package Batch Code</label>
                <select
                  id="batch-code"
                  value={batchCode}
                  onChange={(e) => setBatchCode(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                >
                  <option value="">Select Batch Code</option>
                  <option value="BATCH01">BATCH01</option>
                  <option value="BATCH02">BATCH02</option>
                  <option value="BATCH03">BATCH03</option>
                  <option value="BATCH04">BATCH04</option>
                  <option value="BATCH05">BATCH05</option>
                </select>
                {batchCodeError && <div style={{ color: 'red', fontSize: '0.9em' }}>{batchCodeError}</div>}
              </div>
              <div>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: '24px' }}>
                  <button type="button" style={{ ...buttonStyle('outline'), width: '100px', paddingTop: '2px', paddingBottom: '8px' }} onClick={() => setShowBatchMove(false)}>Cancel</button>
                  <button type="submit" style={{ ...buttonStyle('primary'), width: '100px', marginLeft: '24px', paddingTop: '2px', paddingBottom: '8px' }} disabled={!batchSubject.trim() || !batchCode.trim()}>Batch Move</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnquiryList;
