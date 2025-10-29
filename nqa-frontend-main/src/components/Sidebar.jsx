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
    { path: "/enquiry-form", name: "Enquiry Form", icon: <HiOutlineClipboardList /> },
    { path: "/enquiry-list", name: "Enquiry List", icon: <MdOutlineListAlt /> },
    { path: "/demo-list", name: "Demo List", icon: <MdOutlineTableChart /> },
    { path: "/demo-list-1", name: "Demo_List", icon: <MdOutlineTableChart />, section: "separate" },
    { path: "/class-list", name: "Class List", icon: <MdOutlineArticle />, section: "separate" },
    { path: "/class_list", name: "class_List", icon: <MdOutlineArticle />, section: "separate" },
    { path: "/placement-list", name: "Placement List", icon: <PiListMagnifyingGlass />, section: "separate" },
    { path: "/interview-list", name: "Interview List", icon: <BiSolidSpreadsheet />, section: "separate" },
  ];

  const role = localStorage.getItem('role');

  // Define allowed paths for each role
  const roleAccess = {
    counsellor: ['/enquiry-form', '/enquiry-list', '/demo-list'],
    accounts: ['/demo-list-1', '/class-list'],
    hr: ['/class_list', '/placement-list', '/interview-list'],
    admin: 'all',
  };

  // Filter menu items based on role
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
      <div className={`flex ${isOpen ? "w-64" : "w-10"} bg-[#002147] h-screen p-3 pt-6 duration-300 relative`}>
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
                    {item.icon}
                    {isOpen && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="sidebar-footer">
            <h2>{isOpen && <CgProfile />}</h2>
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut /> {isOpen && "Logout"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content flex-1 ${isOpen ? '' : 'sidebar-closed'}`}>
        <Outlet /> {/* Render the selected route's content here */}
      </div>
    </div>
  );
};

export default Sidebar;