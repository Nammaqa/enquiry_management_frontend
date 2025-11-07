import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './EnquiryForm.css';

const modules = [
  'Professional Starter Testing', 'Cypress', 'Professional Experts with Java Automation', 'Python Development Full Stack', 'Professional Experts with Python Automation',
  'Java Full Stack Development', 'Professional Experts with Mobile Automation', 'MERN Stack', 'Professional Experts with API Automation', 'UI/UX Designing', 'SDET Xpert',
  'AI/ML Engineering', 'Individual Courses', 'Data Analytics', 'AI Testing', 'Diploma in Software Engineering at Testing', 'Playwright', 'Diploma in Software Engineering of Development', 'Other'
];

const TextInput = ({ label, value, onChange, error, type = 'text' }) => {
  return (
    <div className="form-field-container">
      <label className="field-label">{label}</label>
      <hr />
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter student's ${label.toLowerCase().replace('student\'s ', '').replace(' *', '')}`}
        style={{
          width: '100%',
          // padding: '12px 16px',
          borderRadius: '6px',
          border: '1px solid #ffffff',
          fontSize: '24px',
          fontFamily: "'Afacad', sans-serif",
          outline: 'none',
          boxSizing: 'border-box',
          // marginBottom: '-10px',
        }}
      />
      {error && <div className="error">{error}</div>}
    </div>
  );
};

const StudentEnquiryForm = ({ isSidebarOpen }) => {
  const initialFormData = {
    name: '',
    phone: '',
    email: '',
    current_location: '',
    module: '',
    timing: '',
    trainingTime: '',
    startTime: '',
    profession: '',
    qualification: '',
    experience: '',
    referral: '',
    consent: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [lastClicked, setLastClicked] = useState({});
  const [otherValues, setOtherValues] = useState({
    module: '',
    profession: '',
    qualification: '',
    referral: ''
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {};
    ['name', 'phone', 'email', 'current_location', 'module', 'timing', 'trainingTime', 'startTime', 'profession', 'qualification', 'experience', 'referral'].forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field} is required`;
        valid = false;
      }
    });
    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailPattern.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      valid = false;
    }
    // Phone number validation
    const phonePattern = /^\d{10}$/;
    if (formData.phone && !phonePattern.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format (10 digits required)';
      valid = false;
    }
    if (!formData.consent) {
      newErrors.consent = 'Consent is required';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRadioChange = (name, value) => {
    if (lastClicked[name] === value) {
      setFormData(prev => ({ ...prev, [name]: '' }));
      setLastClicked(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setLastClicked(prev => ({ ...prev, [name]: value }));
      if (value === 'Other') {
        setFormData(prev => ({ ...prev, [name]: otherValues[name] }));
      }
    }
  };

  const handleCheckboxChange = (name) => {
    setFormData(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleOtherChange = (field, value) => {
    setOtherValues(prev => ({ ...prev, [field]: value }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    const token = localStorage.getItem('access');
    try {
      const response = await axios.post(
        'http://localhost:8000/api/enquiries/',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 201 || response.status === 200) {
        toast.success('Enquiry submitted successfully!');
        setFormData({ ...initialFormData });
        setOtherValues({ module: '', profession: '', qualification: '', referral: '' });
        setLastClicked({});
        window.dispatchEvent(new Event('enquiryAdded'));
      } else {
        toast.error('Failed to submit enquiry');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        toast.error('Error: ' + JSON.stringify(error.response.data));
      } else {
        toast.error('Server error. Please try again later.');
      }
    }
  };

  const clearForm = () => {
    setFormData({ ...initialFormData });
    setErrors({});
    setLastClicked({});
    setOtherValues({ module: '', profession: '', qualification: '', referral: '' });
  };

  // const middleIndex = Math.ceil(modules.length / 2);
  // // const column1 = modules.slice(0, middleIndex);
  // // const column2 = modules.slice(middleIndex);

  return (
    <div style={{
      width: '100%',
      maxWidth: '1140px',
      margin: '0 auto',
      padding: '2rem',
      paddingTop: '0.5rem',
      // background: '#fff',
      flex: 1,
      fontFamily: "'Afacad', sans-serif"
    }}>
      <h1 style={{
        fontSize: '48px',
        marginTop: '0.5rem',
        paddingTop: '10px',
        marginBottom: '2rem',
        borderBottom: '2px solid #003366',
        paddingBottom: '0.5rem',
        color: '#003366',
        fontWeight: 600,
        backgroundColor: '#ffff',
        paddingLeft: '1rem' // added space before the start of the title (left side)
      }}>Student Enquiry Form</h1>
      
      <form onSubmit={handleSubmit}>
        <TextInput 
          label="Student's Full Name *" 
          value={formData.name} 
          onChange={val => handleInputChange('name', val)} 
          error={errors.name} 
        />
        
        <TextInput 
          label="Student's Phone Number*" 
          value={formData.phone} 
          onChange={val => handleInputChange('phone', val)} 
          error={errors.phone} 
          type="tel" 
        />
        
        <TextInput 
          label="Student's Email Address*" 
          value={formData.email} 
          onChange={val => handleInputChange('email', val)} 
          error={errors.email} 
          type="email" 
        />
        
        <TextInput 
          label="Student's Current Location*" 
          value={formData.current_location} 
          onChange={val => handleInputChange('current_location', val)} 
          error={errors.current_location} 
        />

        <div className="form-field-container">
          <label className="field-label">Enquiry for which module*</label>
          <hr />
          <div className="radio-grid">
            {modules.map((mod, i) => (
              <label key={i} className="radio-label">
                <input
                  type="radio"
                  name="module"
                  value={mod}
                  checked={formData.module === mod}
                  onChange={() => handleRadioChange('module', mod)}
                />
                {mod}
              </label>
            ))}
          </div>
          {lastClicked.module === 'Other' && (
            <input
              type="text"
              placeholder="Other (Specify)"
              value={otherValues.module}
              onChange={e => handleOtherChange('module', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginTop: '12px',
                boxSizing: 'border-box',
              }}
            />
          )}
          {errors.module && <div className="error">{errors.module}</div>}
        </div>

        <RadioGroup 
          label="Preferred Training Mode*" 
          name="timing" 
          selected={formData.timing} 
          options={['Offline', 'Online', 'Hybrid']} 
          onChange={handleRadioChange} 
          error={errors.timing} 
        />
        
        <RadioGroup 
          label="Preferred Training Timings*" 
          name="trainingTime" 
          selected={formData.trainingTime} 
          options={['Morning (7AM Batch)', 'Evening (5PM Batch)', 'Anytime in Weekdays', 'Weekends']} 
          onChange={handleRadioChange} 
          error={errors.trainingTime} 
        />
        
        <RadioGroup 
          label="How soon will the student able to start?*" 
          name="startTime" 
          selected={formData.startTime} 
          options={['Immediate', 'After 10 days', 'After 15 days', 'After 1 Month']} 
          onChange={handleRadioChange} 
          error={errors.startTime} 
        />
        
        <div className="form-field-container">
          <label className="field-label">Student's Professional Situation?*</label>
          <hr />
          <div className="radio-grid">
            {['Fresher', 'Currently Working', 'Switching from Another Domain', 'Other'].map((opt, i) => (
              <label key={i} className="radio-label">
                <input
                  type="radio"
                  name="profession"
                  value={opt}
                  checked={formData.profession === opt}
                  onChange={() => handleRadioChange('profession', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          {lastClicked.profession === 'Other' && (
            <input
              type="text"
              placeholder="Other Professional Situation (Specify)"
              value={otherValues.profession}
              onChange={e => handleOtherChange('profession', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginTop: '12px',
                boxSizing: 'border-box',
              }}
            />
          )}
          {errors.profession && <div className="error">{errors.profession}</div>}
        </div>
        
        <div className="form-field-container">
          <label className="field-label">Student's Highest Qualification?*</label>
          <hr />
          <div className="radio-grid">
            {['Diploma', "Bachelor's Degree", "Master's Degree", 'Other'].map((opt, i) => (
              <label key={i} className="radio-label">
                <input
                  type="radio"
                  name="qualification"
                  value={opt}
                  checked={formData.qualification === opt}
                  onChange={() => handleRadioChange('qualification', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          {lastClicked.qualification === 'Other' && (
            <input
              type="text"
              placeholder="Other Qualification (Specify)"
              value={otherValues.qualification}
              onChange={e => handleOtherChange('qualification', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginTop: '12px',
                boxSizing: 'border-box',
              }}
            />
          )}
          {errors.qualification && <div className="error">{errors.qualification}</div>}
        </div>
        
        <RadioGroup 
          label="Student's Experience (In Years)?*" 
          name="experience" 
          selected={formData.experience} 
          options={['Less than 1 Year or Fresher', '1-3 Years', '3-5 Years', '5+ Years']} 
          onChange={handleRadioChange} 
          error={errors.experience} 
        />
        
        <div className="form-field-container">
          <label className="field-label">How did the student get to know about NammaQA?*</label>
          <hr />
          <div className="radio-grid">
            {['Instagram', 'Youtube', 'Whatsapp Channel', 'Friend Reference', 'Facebook', 'College Reference', 'Linkedin', 'Other Social Network', 'Other'].map((opt, i) => (
              <label key={i} className="radio-label">
                <input
                  type="radio"
                  name="referral"
                  value={opt}
                  checked={formData.referral === opt}
                  onChange={() => handleRadioChange('referral', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
          {lastClicked.referral === 'Other' && (
            <input
              type="text"
              placeholder="Other Source (Specify)"
              value={otherValues.referral}
              onChange={e => handleOtherChange('referral', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                marginTop: '12px',
                boxSizing: 'border-box',
              }}
            />
          )}
          {errors.referral && <div className="error">{errors.referral}</div>}
        </div>
        
        <div className="form-field-container">
          <label className="field-label">Consent to Contact*</label>
          <hr />
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="consent"
              checked={formData.consent}
              onChange={() => handleCheckboxChange('consent')}
            />
            I agree to be contacted via phone, WhatsApp, email, Newsletters regarding NammaQA Training Community program and offers. Terms & Conditions applied.
          </label>
          {errors.consent && <div className="error">{errors.consent}</div>}
        </div>

        <div style={{ 
          marginTop: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <button type="button" onClick={clearForm} style={buttonStyle('outline')}>
            Clear Form
          </button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={clearForm} style={buttonStyle('ghost')}>
              Cancel
            </button>
            <button type="submit" style={buttonStyle('primary')}>
              Save
            </button>
          </div>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

const RadioGroup = ({ label, name, options, selected, onChange, error }) => (
  <div className="form-field-container">
    <label className="field-label">{label}</label>
    <hr />
    <div className="radio-grid">
      {options.map((opt, i) => (
        <label key={i} className="radio-label">
          <input 
            type="radio" 
            name={name} 
            value={opt} 
            checked={selected === opt} 
            onChange={() => onChange(name, opt)} 
          />
          {opt}
        </label>
      ))}
    </div>
    {error && <div className="error">{error}</div>}
  </div>
);

const buttonStyle = (variant) => {
  switch (variant) {
    case 'primary':
      return {
        padding: '12px 32px',
        border: 'none',
        borderRadius: '6px',
        color: '#FFFFFF',
        backgroundColor: '#1e40af',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: "'Afacad', sans-serif",
      };
    case 'outline':
      return {
        padding: '12px 32px',
        border: '2px solid #1e40af',
        borderRadius: '6px',
        color: '#1e40af',
        backgroundColor: 'transparent',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: "'Afacad', sans-serif",
      };
    case 'ghost':
      return {
        padding: '12px 32px',
        border: 'none',
        borderRadius: '6px',
        color: '#6b7280',
        backgroundColor: 'transparent',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: "'Afacad', sans-serif",
      };
    default:
      return {};
  }
};

export default StudentEnquiryForm;