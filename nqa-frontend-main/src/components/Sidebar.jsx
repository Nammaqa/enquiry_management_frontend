import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { HiOutlineClipboardList } from "react-icons/hi";
import { MdOutlineListAlt, MdOutlineTableChart, MdOutlineArticle } from "react-icons/md";
import { BiSolidSpreadsheet } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";
import { TbLayoutSidebarLeftCollapse, TbLayoutSidebarLeftExpand } from "react-icons/tb";
import { CgProfile } from "react-icons/cg";
import { PiListMagnifyingGlass } from "react-icons/pi";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: "/enquiry-form", name: "Enquiry Form", icon: <HiOutlineClipboardList className="profile-icon-container" /> },
    { path: "/enquiry-list", name: "Enquiry List", icon: <MdOutlineListAlt className="profile-icon-container" /> },
    { path: "/demo-list", name: "Demo List", icon: <MdOutlineTableChart className="profile-icon-container" /> },
    { path: "/demo-list-1", name: "Demo_List", icon: <MdOutlineTableChart className="profile-icon-container" />, section: "separate" },
    { path: "/class-list", name: "Class List", icon: <MdOutlineArticle className="profile-icon-container" />, section: "separate" },
    { path: "/class_list", name: "class_List", icon: <MdOutlineArticle className="profile-icon-container" />, section: "separate" },
    { path: "/placement-list", name: "Placement List", icon: <PiListMagnifyingGlass className="profile-icon-container" />, section: "separate" },
    { path: "/interview-list", name: "Interview List", icon: <BiSolidSpreadsheet className="profile-icon-container" />, section: "separate" },
  ];

  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username') || 'Profile';

  const roleAccess = {
    counsellor: ['/enquiry-form', '/enquiry-list', '/demo-list'],
    accounts: ['/demo-list-1', '/class-list'],
    hr: ['/class_list', '/placement-list', '/interview-list'],
    admin: 'all',
  };

  const filteredMenuItems =
    role === 'admin'
      ? menuItems
      : menuItems.filter(item => (roleAccess[role] || []).includes(item.path));

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="sidebar-wrapper">
        <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <img
              src={isOpen ? "/fullimage.png" : "/smallimage.png"}
              alt="Logo"
              className="logo"
            />

            <button className="toggle-btn" onClick={() => setIsOpen(!isOpen)}>
              <h4>{isOpen ? <TbLayoutSidebarLeftCollapse /> : <TbLayoutSidebarLeftExpand />}</h4>
            </button>

            <ul className="sidebar-menu">
              {filteredMenuItems.map((item, index) => (
                <li
                  key={index}
                  className={location.pathname === item.path ? "active" : ""}
                >
                  <Link to={item.path}>
                    {/* {React.cloneElement(item.icon, { className: "profile-icon" })} */}
                    {item.icon}
                    {isOpen && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer with Username Display */}
          <div className="sidebar-menu">
            {/* Username Display Frame - Always Horizontal */}
            <div className={`username-display ${isOpen ? "open" : "closed"}`}>
              {/* <div className="profile-icon-container"> */}
              <CgProfile className="profile-icon" />
              {/* </div> */}
              {isOpen && <span className="username-text">{username}</span>}
            </div>

            {/* Logout Button */}
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut className="profile-icon" style={{ paddingLeft: 4 }} /> {isOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content flex-1 ${isOpen ? '' : 'sidebar-closed'}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;