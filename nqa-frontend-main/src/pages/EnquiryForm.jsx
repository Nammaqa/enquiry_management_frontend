import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const modules = [
  'Professional Starter Testing', 'Cypress', 'Professional Experts with Java Automation', 'Python Development Full Stack', 'Professional Experts with Python Automation',
  'Java Full Stack Development', 'Professional Experts with Mobile Automation', 'MERN Stack', 'Professional Experts with API Automation', 'UI/UX Designing', 'SDET Xpert',
  'AI/ML Engineering', 'Individual Courses', 'Data Analytics', 'AI Testing', 'Diploma in Software Engineering at Testing', 'Playwright', 'Diploma in Software Engineering of Development','Other'
];

const FloatingLabelInput = ({ label, value, onChange, error, type = 'text' }) => {
  const [isFocused, setIsFocused] = useState(false);
  const showFloating = isFocused || value;
  return (
    <div style={{ position: 'relative', marginBottom: '2rem' }}>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          width: '100%',
          padding: '18px 20px 10px 20px',
          borderRadius: '10px',
          border: '1px solid #ccc',
          fontSize: '1rem',
          fontFamily: "'Afacad', sans-serif",
          outline: showFloating ? '2px solid #031D4E' : 'none',
          transition: 'border 0.2s, outline 0.2s',
          background: '#fff',
        }}
        placeholder={showFloating ? '' : label}
      />
      <label
        style={{
          position: 'absolute',
          left: 20,
          top: showFloating ? 2 : '50%',
          fontSize: showFloating ? 13 : 16,
          color: showFloating ? '#003366' : '#888',
          background: '#fff',
          padding: showFloating ? '0 4px' : '0',
          pointerEvents: 'none',
          transform: showFloating ? 'translateY(-50%) scale(0.95)' : 'translateY(-50%)',
          transition: 'all 0.2s',
        }}
      >
        {label}
      </label>
      {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
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

  const middleIndex = Math.ceil(modules.length / 2);
  const column1 = modules.slice(0, middleIndex);
  const column2 = modules.slice(middleIndex);

  return (
    <div style={{
      width: '100%',
      maxWidth: '1140px',
      margin: '0 auto',
      padding: '2rem',
      paddingTop: '0.5rem',
      background: '#fff',
      flex: 1,
      fontFamily: "'Afacad', sans-serif"
    }}>
      <h1 style={{
        fontSize: '48px',
        marginBottom: '1rem',
        borderBottom: '2px solid #ccc',
        paddingBottom: '0.5rem',
        color: '#003366'
      }}>Student Enquiry Form</h1>
      <form onSubmit={handleSubmit}>
        <FloatingLabelInput label="Student's Full Name *" value={formData.name} onChange={val => handleInputChange('name', val)} error={errors.name} />
        <FloatingLabelInput label="Student's Phone Number *" value={formData.phone} onChange={val => handleInputChange('phone', val)} error={errors.phone} type="tel" />
        <FloatingLabelInput label="Student's Email Address *" value={formData.email} onChange={val => handleInputChange('email', val)} error={errors.email} type="email" />
        <FloatingLabelInput label="Student's Current Location *" value={formData.current_location} onChange={val => handleInputChange('current_location', val)} error={errors.current_location} />

        <div style={{ marginTop: '2rem' }}>
          <label style={{ fontWeight: 600, color: '#003366', marginBottom: '0.5rem', display: 'block' }}>
            Enquiry for which module *
          </label>
          <hr />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: '0 0 45%' }}>
              {column1.map((mod, i) => (
                <label key={i} style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input
                    type="radio"
                    name="module"
                    value={mod}
                    checked={formData.module === mod}
                    onChange={() => handleRadioChange('module', mod)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {mod}
                </label>
              ))}
            </div>
            <div style={{ flex: '0 0 45%' }}>
              {column2.map((mod, i) => (
                <label key={i} style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input
                    type="radio"
                    name="module"
                    value={mod}
                    checked={formData.module === mod}
                    onChange={() => handleRadioChange('module', mod)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {mod}
                </label>
              ))}
            </div>
          </div>
          {lastClicked.module === 'Other' && (
            <FloatingLabelInput 
              label="Other (Specify)" 
              value={otherValues.module} 
              onChange={val => handleOtherChange('module', val)} 
            />
          )}
          {errors.module && <div style={{ color: 'red', marginTop: '0.5rem' }}>{errors.module}</div>}
        </div>

        <RadioGroup label="Preferred Training Mode *" name="timing" selected={formData.timing} options={['Offline', 'Online', 'Hybrid']} onChange={handleRadioChange} error={errors.timing} />
        <RadioGroup label="Preferred Training Timings *" name="trainingTime" selected={formData.trainingTime} options={['Morning (7AM Batch)', 'Evening (6PM Batch)', 'Anytime in Weekdays', 'Weekends']} onChange={handleRadioChange} error={errors.trainingTime} />
        <RadioGroup label="How soon will the student be able to start? *" name="startTime" selected={formData.startTime} options={['Immediate', 'After 10 days', 'After 15 days', 'After 1 Month']} onChange={handleRadioChange} error={errors.startTime} />
        <RadioGroup label="Student's Professional Situation? *" name="profession" selected={formData.profession} options={['Fresher', 'Currently Working', 'Willing to Switch from Another Domain', 'Other']} onChange={handleRadioChange} error={errors.profession} />
        {lastClicked.profession === 'Other' && (
          <FloatingLabelInput label="Other Professional Situation (Specify)" value={otherValues.profession} onChange={val => handleOtherChange('profession', val)} />
        )}
        <RadioGroup label="Student's Highest Qualification? *" name="qualification" selected={formData.qualification} options={['Diploma', "Bachelor's Degree", "Master's Degree", 'Other']} onChange={handleRadioChange} error={errors.qualification} />
        {lastClicked.qualification === 'Other' && (
          <FloatingLabelInput label="Other Qualification (Specify)" value={otherValues.qualification} onChange={val => handleOtherChange('qualification', val)} />
        )}
        <RadioGroup label="Student's Experience (In Years)? *" name="experience" selected={formData.experience} options={['Less than 1 Year or Fresher', '1-3 Years', '3-5 Years', '5+ Years']} onChange={handleRadioChange} error={errors.experience} />
        <RadioGroup label="How did the student get to know about NammaQA? *" name="referral" selected={formData.referral} options={['Instagram', 'Youtube', 'Whatsapp Channel', 'Friend Reference', 'Facebook', 'College Reference', 'Linkedin', 'Other Social Network', 'Other']} onChange={handleRadioChange} error={errors.referral} />
        {lastClicked.referral === 'Other' && (
          <FloatingLabelInput label="Other Source (Specify)" value={otherValues.referral} onChange={val => handleOtherChange('referral', val)} />
        )}
        <CheckboxGroup label="Consent to Contact *" name="consent" options={["I agree to be contacted via phone, WhatsApp, email, Newsletters regarding NammaQA Training Community program and offers. Terms & Conditions applied."]} selected={formData.consent} onChange={handleCheckboxChange} error={errors.consent} />

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" onClick={clearForm} style={buttonStyle('outline')}>Clear Form</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={clearForm} style={buttonStyle('ghost')}>Cancel</button>
            <button type="submit" style={buttonStyle('primary')}>Save</button>
          </div>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

const RadioGroup = ({ label, name, options, selected, onChange, error }) => (
  <div style={{ marginTop: '2rem' }}>
    <label style={{ fontWeight: 600, color: '#003366', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
    <hr />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      {options.map((opt, i) => (
        <label key={i} style={{ flex: '0 0 45%' }}>
          <input type="radio" name={name} value={opt} checked={selected === opt} onChange={() => onChange(name, opt)} style={{ marginRight: '0.5rem' }} />
          {opt}
        </label>
      ))}
    </div>
    {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
  </div>
);

const CheckboxGroup = ({ label, name, options, selected = false, onChange, error }) => (
  <div style={{ marginTop: '2rem' }}>
    <label style={{ fontWeight: 600, color: '#003366', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
    <hr />
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
      {options.map((opt, i) => (
        <label key={i} style={{ flex: '0 0 100%' }}>
          <input type="checkbox" name={name} checked={selected} onChange={() => onChange(name)} style={{ marginRight: '0.5rem' }} />
          {opt}
        </label>
      ))}
    </div>
    {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
  </div>
);

const buttonStyle = (variant) => {
  switch (variant) {
    case 'primary':
      return {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        color: '#FFFFFF',
        backgroundColor: '#003366',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer',
      };
    case 'outline':
      return {
        padding: '10px 20px',
        border: '2px solid #003366',
        borderRadius: '5px',
        color: '#003366',
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer',
      };
    case 'ghost':
      return {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        color: '#003366',
        backgroundColor: 'transparent',
        fontWeight: 'bold',
        fontSize: '16px',
        cursor: 'pointer',
      };
    default:
      return {};
  }
};

export default StudentEnquiryForm;