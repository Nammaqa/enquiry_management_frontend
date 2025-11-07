import React from 'react';
import './InterviewList.css';

const InterviewList = () => {
  return (
    <div className="interview-list-container">
      <div className="coming-soon-wrapper">
        <div className="icon-placeholder">⏳</div>
        <h1>Interview List</h1>
        <p className="coming-soon-text">Coming Soon</p>
        <p className="description-text">
          This feature is under development and will be available soon.
        </p>
      </div>
    </div>
  );
};

export default InterviewList;
