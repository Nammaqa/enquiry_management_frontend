import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Class_List.css";
import { IoSearch } from "react-icons/io5";

const Class_List = () => {
  const navigate = useNavigate();
  const [backendData, setBackendData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchClassList = async () => {
      const token = localStorage.getItem("access");
      try {
        const res = await axios.get("http://localhost:8000/api/enquiries/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filtered = res.data
          .filter((i) => i.move_to_hr && !i.move_to_placements)
          .map((i) => ({
            ...i,
            name: i.fullName || i.name || "-",
            packageCode: i.packageCode || i.batch_code || "-",
            package: i.package || i.packageName || i.batch_subject || "-",
            placement: i.placement || "",
            dataLink: i.data_link || "",
            dataUpdated: i.data_updated || "",
            moveToPlacements: Boolean(i.move_to_placements),
          }));

        setBackendData(filtered);
      } catch (err) {
        console.error(err);
      }
    };

    fetchClassList();
  }, []);

  // Move to placement
  const handleMoveToPlacement = async (item) => {
    const token = localStorage.getItem("access");
    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${item.id}/`,
        { move_to_placements: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      navigate("/placement-list", { state: { user: item } });
    } catch (err) {
      console.error(err);
    }
  };

  // Dropdown change handler (auto-save)
  const handleDropdownChange = async (id, field, value, otherValue = "") => {
    const token = localStorage.getItem("access");

    const updatedData = backendData.map((row) =>
      row.id === id
        ? {
            ...row,
            [field]: value === "Other" ? otherValue : value,
          }
        : row
    );

    setBackendData(updatedData);

    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${id}/`,
        {
          [field]: value === "Other" ? otherValue : value,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  // Handle link input change
  const handleLinkChange = async (id, value) => {
    const token = localStorage.getItem("access");

    const updatedData = backendData.map((row) =>
      row.id === id ? { ...row, dataLink: value } : row
    );

    setBackendData(updatedData);

    try {
      await axios.patch(
        `http://localhost:8000/api/enquiries/${id}/`,
        { data_link: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update link:", err);
    }
  };

  const filteredData = backendData.filter(
    (item) =>
      (item.name &&
        item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.email &&
        item.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="class-list-container">
      <div className="demo-header-container">
        <div className="demo-header">
          <h2>Class List</h2>
          <div className="demo-controls">
            <form onSubmit={(e) => e.preventDefault()} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-button">
                  <IoSearch />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="demo-content-container">
        <div className="demo-table-wrapper">
          <table className="demo-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Package Code</th>
                <th>Package</th>
                <th>Placement?</th>
                <th>Link</th>
                <th>Data Updated?</th>
                <th>Placement List?</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item) => {
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.phone}</td>
                    <td>{item.email}</td>
                    <td>{item.packageCode}</td>
                    <td>{item.package}</td>

                    {/* Placement Dropdown */}
                    <td>
                      <select
                        value={
                          ["Yes", "No"].includes(item.placement)
                            ? item.placement
                            : "Other"
                        }
                        onChange={(e) =>
                          handleDropdownChange(item.id, "placement", e.target.value)
                        }
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Other">Other</option>
                      </select>
                      {item.placement !== "Yes" &&
                        item.placement !== "No" &&
                        item.placement && (
                          <input
                            type="text"
                            placeholder="Specify..."
                            value={item.placement}
                            onChange={(e) =>
                              handleDropdownChange(
                                item.id,
                                "placement",
                                "Other",
                                e.target.value
                              )
                            }
                            style={{ marginLeft: "8px", width: "120px" }}
                          />
                        )}
                    </td>

                    {/* Link Input Field */}
                    <td>
                      <input
                        type="text"
                        placeholder="Enter link..."
                        value={item.dataLink}
                        onChange={(e) => handleLinkChange(item.id, e.target.value)}
                        style={{
                          width: "200px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          fontSize: "13px",
                        }}
                      />
                      {item.dataLink && (
                        <a
                          href={item.dataLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginLeft: "8px",
                            color: "#2563eb",
                            textDecoration: "underline",
                            fontSize: "12px",
                          }}
                        >
                          Open
                        </a>
                      )}
                    </td>

                    {/* Data Updated Dropdown */}
                    <td>
                      <select
                        value={
                          ["Yes", "No"].includes(item.dataUpdated)
                            ? item.dataUpdated
                            : "Other"
                        }
                        onChange={(e) =>
                          handleDropdownChange(item.id, "dataUpdated", e.target.value)
                        }
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Other">Other</option>
                      </select>
                      {item.dataUpdated !== "Yes" &&
                        item.dataUpdated !== "No" &&
                        item.dataUpdated && (
                          <input
                            type="text"
                            placeholder="Specify..."
                            value={item.dataUpdated}
                            onChange={(e) =>
                              handleDropdownChange(
                                item.id,
                                "dataUpdated",
                                "Other",
                                e.target.value
                              )
                            }
                            style={{ marginLeft: "8px", width: "120px" }}
                          />
                        )}
                    </td>

                    <td>
                      <button
                        className="move-btn"
                        onClick={() => handleMoveToPlacement(item)}
                      >
                        Move to Placement
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Class_List;