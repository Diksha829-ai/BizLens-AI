import React, { useState } from "react";
import { Store, MapPin } from "lucide-react";
import Pagination from "./Pagination";

function CompetitorList({ competitors = [] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!Array.isArray(competitors) || competitors.length === 0) {
    return null;
  }

  const totalItems = competitors.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Paginated slice
  const startIndex = (currentPage - 1) * pageSize;
  const currentCompetitors = competitors.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="biz-competitor-list-card">
      <div className="biz-competitor-list-header">
        <div className="biz-competitor-list-header-left">
          <div className="biz-metric-icon-wrap competitor-list-icon-wrap">
            <Store size={22} className="biz-metric-header-icon" />
          </div>
          <div>
            <h3 className="biz-metric-card-title">Nearby Competitors</h3>
            <span className="biz-metric-card-sub">
              Detailed list of detected competitors ({totalItems} found)
            </span>
          </div>
        </div>
      </div>

      <div className="biz-competitor-table-container">
        <table className="biz-competitor-table">
          <thead>
            <tr>
              <th scope="col" className="col-num">#</th>
              <th scope="col" className="col-business">Business Name</th>
              <th scope="col" className="col-category">Category</th>
              <th scope="col" className="col-distance">Distance</th>
            </tr>
          </thead>
          <tbody>
            {currentCompetitors.map((competitor, index) => {
              const globalIndex = startIndex + index + 1;
              const dist =
                competitor.distance !== undefined && competitor.distance !== null
                  ? `${Number(competitor.distance).toFixed(2)} km`
                  : "N/A";

              return (
                <tr key={competitor.id || competitor._id || `comp-${globalIndex}`}>
                  <td className="col-num">{globalIndex}</td>
                  <td className="col-business">
                    <div className="biz-comp-name-wrap">
                      <span className="biz-comp-icon-mini">
                        <Store size={15} />
                      </span>
                      <strong>{competitor.name || "Unnamed Competitor"}</strong>
                    </div>
                  </td>
                  <td className="col-category">
                    <span className="biz-comp-badge">
                      {competitor.category || "General Business"}
                    </span>
                  </td>
                  <td className="col-distance">
                    <span className="biz-comp-dist">
                      <MapPin size={14} />
                      {dist}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={pageSize}
        itemLabel="competitors"
      />
    </div>
  );
}

<<<<<<< HEAD
export default CompetitorList;
=======
export default CompetitorList;
>>>>>>> b2e1095 (Components added)
