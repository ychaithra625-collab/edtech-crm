
import { useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

// Safely read JSON responses and detect HTML/server errors
const readResponse = async (response) => {
  console.log("API RESPONSE:", response.url, response.status);
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}). Check that the backend API is running and the requested route exists.`
    );
  }
};

function App() {
  // Public inquiry form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    category: "",
    message: ""
  });

  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // Admin login and dashboard
  const [view, setView] = useState("public");
  const [loginData, setLoginData] = useState({
    email: "admin@k12hunar.com",
    password: ""
  });

  const [token, setToken] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [inquiries, setInquiries] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");

  // Dashboard search and filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [userTypeFilter, setUserTypeFilter] = useState("All");

  // Public form input handler
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Submit public inquiry
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setResponseMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_URL}/api/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          user_type: formData.userType,
          category: formData.category,
          message: formData.message
        })
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Submission failed.");
      }

      setResponseMessage(
        result.message || "Inquiry submitted successfully!"
      );

      setFormData({
        name: "",
        email: "",
        phone: "",
        userType: "",
        category: "",
        message: ""
      });
    } catch (error) {
      setIsError(true);
      setResponseMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const handleLogin = async (e) => {
    e.preventDefault();

    setAdminLoading(true);
    setAdminError("");

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginData)
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      if (!result.token || !result.admin?.email) {
        throw new Error("Invalid login response from server.");
      }

      const adminToken = result.token;

      // Load inquiries using the token returned by login
      const inquiryResponse = await fetch(
        `${API_URL}/api/admin/inquiries`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
            Accept: "application/json"
          }
        }
      );

      const inquiryResult = await readResponse(inquiryResponse);

      if (!inquiryResponse.ok) {
        throw new Error(
          inquiryResult.message || "Unable to load inquiries."
        );
      }

      setToken(adminToken);
      setAdminEmail(result.admin.email);
      setInquiries(inquiryResult.inquiries || []);
      setAdminError("");
      setView("dashboard");

    } catch (error) {
      setAdminError(error.message || "Unable to log in.");
    } finally {
      setAdminLoading(false);
    }
  };

  // Refresh dashboard data
  const refreshInquiries = async () => {
    if (!token) {
      setAdminError("Your session has expired. Please log in again.");
      setView("login");
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/inquiries`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setToken("");
          setView("login");
        }

        throw new Error(
          result.message || "Unable to fetch inquiries."
        );
      }

      setInquiries(result.inquiries || []);

    } catch (error) {
      setAdminError(error.message);
    } finally {
      setAdminLoading(false);
    }
  };

  // Update inquiry status
  const updateInquiryStatus = async (inquiryId, newStatus) => {
    setAdminError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/inquiries/${inquiryId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          },
          body: JSON.stringify({
            status: newStatus
          })
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          result.message || "Status update failed."
        );
      }

      setInquiries((previousInquiries) =>
        previousInquiries.map((inquiry) =>
          inquiry.id === inquiryId
            ? {
                ...inquiry,
                status: result.inquiry?.status || newStatus
              }
            : inquiry
        )
      );

    } catch (error) {
      console.error("Status update error:", error);
      setAdminError(error.message || "Unable to update status.");
    }
  };

  // Logout
  const handleLogout = () => {
    setToken("");
    setAdminEmail("");
    setInquiries([]);

    setLoginData({
      email: "admin@k12hunar.com",
      password: ""
    });

    setSearch("");
    setCategoryFilter("All");
    setUserTypeFilter("All");
    setAdminError("");
    setView("public");
  };

  // Filter inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        (inquiry.name || "").toLowerCase().includes(searchText) ||
        (inquiry.phone || "").toLowerCase().includes(searchText);

      const matchesCategory =
        categoryFilter === "All" ||
        inquiry.category === categoryFilter;

      const matchesUserType =
        userTypeFilter === "All" ||
        inquiry.user_type === userTypeFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesUserType
      );
    });
  }, [inquiries, search, categoryFilter, userTypeFilter]);

  // Admin login page
  if (view === "login") {
    return (
      <div className="page">
        <nav className="navbar">
          <h2>K12 Hunar</h2>

          <button
            className="nav-button"
            onClick={() => {
              setAdminError("");
              setView("public");
            }}
          >
            Back to Inquiry Form
          </button>
        </nav>

        <main className="container">
          <div className="form-card admin-login-card">
            <div className="heading">
              <h1>Admin Login</h1>
              <p>Sign in to manage submitted inquiries.</p>
            </div>

            {adminError && (
              <p className="error-message" role="alert">
                {adminError}
              </p>
            )}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>

                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      email: e.target.value
                    })
                  }
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password: e.target.value
                    })
                  }
                  placeholder="Enter admin password"
                  required
                />

              </div>

              <button type="submit" disabled={adminLoading}>
                {adminLoading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Admin dashboard
  if (view === "dashboard") {
    return (
      <div className="page dashboard-page">
        <nav className="navbar">
          <div>
            <h2>K12 Hunar</h2>
            <span>Admin Dashboard</span>
          </div>

          <div className="nav-actions">
            <span className="admin-email">{adminEmail}</span>

            <button
              className="nav-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </nav>

        <main className="dashboard-container">
          <div className="dashboard-heading">
            <div>
              <h1>Inquiry Management</h1>
              <p>View and manage submitted inquiries.</p>
            </div>

            <button
              className="refresh-button"
              onClick={refreshInquiries}
              disabled={adminLoading}
            >
              {adminLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {adminError && (
            <p className="error-message" role="alert">
              {adminError}
            </p>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Inquiries</span>
              <strong>{inquiries.length}</strong>
            </div>

            <div className="stat-card">
              <span>New Inquiries</span>
              <strong>
                {
                  inquiries.filter(
                    (item) => item.status === "New"
                  ).length
                }
              </strong>
            </div>

            <div className="stat-card">
              <span>Resolved Inquiries</span>
              <strong>
                {
                  inquiries.filter(
                    (item) => item.status === "Resolved"
                  ).length
                }
              </strong>
            </div>
          </div>

          <section className="table-card">
            <div className="table-heading">
              <div>
                <h2>All Inquiries</h2>
                <p>{filteredInquiries.length} records found</p>
              </div>
            </div>

            <div className="filters">
              <input
                type="search"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value)
                }
              >
                <option value="All">All Categories</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Concert">Concert</option>
                <option value="Admission">Admission</option>
                <option value="General Query">General Query</option>
              </select>

              <select
                value={userTypeFilter}
                onChange={(e) =>
                  setUserTypeFilter(e.target.value)
                }
              >
                <option value="All">All User Types</option>
                <option value="Parent">Parent</option>
                <option value="Student">Student</option>
                <option value="School">School</option>
              </select>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>User Type</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInquiries.length > 0 ? (
                    filteredInquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td>{inquiry.name}</td>
                        <td>{inquiry.phone}</td>
                        <td>{inquiry.email}</td>
                        <td>{inquiry.user_type}</td>
                        <td>{inquiry.category}</td>

                        <td>
                          {new Date(
                            inquiry.created_at
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          <select
                            className="status-select"
                            value={inquiry.status || "New"}
                            onChange={(e) =>
                              updateInquiryStatus(
                                inquiry.id,
                                e.target.value
                              )
                            }
                          >
                            <option value="New">New</option>
                            <option value="In Progress">
                              In Progress
                            </option>
                            <option value="Resolved">
                              Resolved
                            </option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-message">
                        No inquiries found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // Public inquiry form
  return (
    <div className="page">
      <nav className="navbar">
        <div>
          <h2>K12 Hunar</h2>
          <span>Inquiry Management System</span>
        </div>

        <button
          className="nav-button"
          onClick={() => {
            setAdminError("");
            setView("login");
          }}
        >
          Admin Login
        </button>
      </nav>

      <main className="container">
        <div className="form-card">
          <div className="heading">
            <h1>Submit Your Inquiry</h1>

            <p>
              Have a question? Fill out the form and
              our team will contact you.
            </p>
          </div>

          {responseMessage && (
            <p
              className={
                isError ? "error-message" : "success-message"
              }
              role="status"
            >
              {responseMessage}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>

              <input
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>User Type</label>

              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
              >
                <option value="">Select user type</option>
                <option value="Parent">Parent</option>
                <option value="Student">Student</option>
                <option value="School">School</option>
              </select>
            </div>

            <div className="form-group">
              <label>Inquiry Category</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select category</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Concert">Concert</option>
                <option value="Admission">Admission</option>
                <option value="General Query">General Query</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>

              <textarea
                name="message"
                placeholder="Write your inquiry here..."
                value={formData.message}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Inquiry"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default App;
