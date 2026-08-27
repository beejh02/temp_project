import { useNavigate } from "react-router-dom";

import MissionIcon from "./MissionIcon";

function MissionPageHeader({ eyebrow, title, description }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/missions");
  };

  return (
    <header className="mission-subpage-header">
      <button type="button" onClick={handleBack} aria-label="이전 화면으로 돌아가기">
        <MissionIcon type="arrow" />
      </button>
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}

export default MissionPageHeader;
