import loadingImage from "../assets/nurigo-loading.png";
import "./StartupSplash.css";

function StartupSplash({ durationMs }) {
  return (
    <div
      className="startup-splash"
      role="status"
      aria-label="누리고를 준비하고 있어요"
      style={{ "--splash-duration": `${durationMs}ms` }}
    >
      <img
        className="startup-splash__image"
        src={loadingImage}
        alt="누리고, 전통시장에서 만나는 우리 동네의 즐거움"
        width="1308"
        height="681"
        fetchPriority="high"
        draggable="false"
      />
      <div className="startup-splash__loading" aria-hidden="true">
        <div className="startup-splash__track">
          <span className="startup-splash__progress" />
        </div>
        <p>우리 동네의 즐거움을 준비하고 있어요</p>
      </div>
    </div>
  );
}

export default StartupSplash;
