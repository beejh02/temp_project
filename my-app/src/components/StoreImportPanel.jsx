import { useRef, useState } from "react";
import "./StoreImportPanel.css";

function StoreImportPanel({ onImported }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage("소상공인시장진흥공단 CSV 파일을 선택해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsImporting(true);
    setMessage("점포 데이터를 가져오고 있습니다.");

    try {
      const response = await fetch("/api/stores/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.detail || `점포 가져오기 실패: ${response.status}`);
      }

      const result = await response.json();
      setMessage(
        `${result.upsertedRows.toLocaleString()}개 저장 · ${result.skippedRows.toLocaleString()}개 제외`,
      );
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onImported?.(result);
    } catch (error) {
      console.error("점포 CSV 가져오기 중 오류:", error);
      setMessage(error.message || "점포 데이터를 가져오지 못했습니다.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="store-import-panel" aria-label="점포 데이터 가져오기">
      <div className="store-import-panel__title">점포 데이터</div>
      <label className="store-import-panel__file">
        <span>{selectedFile ? selectedFile.name : "CSV 파일 선택"}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            setSelectedFile(event.target.files?.[0] || null);
            setMessage("");
          }}
          disabled={isImporting}
        />
      </label>
      <button
        type="button"
        className="store-import-panel__button"
        onClick={handleImport}
        disabled={!selectedFile || isImporting}
      >
        {isImporting ? "가져오는 중..." : "DB에 가져오기"}
      </button>
      {message && <div className="store-import-panel__message">{message}</div>}
    </section>
  );
}

export default StoreImportPanel;
