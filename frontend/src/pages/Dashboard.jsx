import { useNavigate } from "react-router-dom";


function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    alert("Logged out successfully!");

    navigate("/login");
  };


  const handleNewAnalysis = () => {
    navigate("/location-selection");
  };


  return (
    <div style={{ padding: "20px" }}>

      <h1>BizLens-AI Dashboard</h1>

      <hr />

      <h2>
        Welcome, {user?.name || "User"}!
      </h2>

      <p>
        <strong>Email:</strong>{" "}
        {user?.email || "Not available"}
      </p>

      <p>
        <strong>Role:</strong>{" "}
        {user?.role || "user"}
      </p>

      <hr />


      <h2>
        Business Location Intelligence
      </h2>

      <p>
        Analyze the suitability of a location
        for your proposed business.
      </p>


      <div style={{ marginTop: "20px" }}>

        <button
          onClick={handleNewAnalysis}
          style={{
            padding: "12px 20px",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          New Business Analysis
        </button>


        <button
          onClick={() =>
            alert(
              "Saved analyses will be added later."
            )
          }
          style={{
            padding: "12px 20px",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          Saved Analyses
        </button>


        <button
          onClick={() =>
            alert(
              "Business comparison will be added later."
            )
          }
          style={{
            padding: "12px 20px",
            marginRight: "10px",
            cursor: "pointer",
          }}
        >
          Compare Businesses
        </button>

      </div>


      <br />


      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

    </div>
  );
}


export default Dashboard;