import { useEffect, useRef, useState } from "react";
import {
  safelyDetachNaverMapObject,
  safelyRemoveNaverMapListener,
} from "../lib/naverMapCleanup";
import "./PolygonEditor.css";
import { apiFetch } from "../utils/api";

function PolygonEditor({
  map,
  name,
  coordinates,
  markets = [],
  selectedMarketId,
  loadError,
  onNameChange,
  onChange,
  onMarketSelect,
  onSaved,
  onDeleted,
}) {
  const markersRef = useRef([]);
  const [pendingAction, setPendingAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const isEditing = selectedMarketId != null;

  useEffect(() => {
    markersRef.current.forEach((marker) => {
      safelyDetachNaverMapObject(marker);
    });
    markersRef.current = [];

    if (!map || !window.naver?.maps) {
      return undefined;
    }

    const markers = coordinates.map(
      ({ lat, lng }) =>
        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map,
        }),
    );

    markersRef.current = markers;

    return () => {
      markers.forEach((marker) => {
        safelyDetachNaverMapObject(marker);
      });
    };
  }, [map, coordinates]);

  useEffect(() => {
    if (!map || !window.naver?.maps) {
      return undefined;
    }

    const eventApi = window.naver.maps.Event;
    const listener = eventApi.addListener(map, "click", (event) => {
      const newPoint = {
        lat: event.coord.lat(),
        lng: event.coord.lng(),
      };

      onChange((previousCoordinates) => [
        ...previousCoordinates,
        newPoint,
      ]);
    });

    return () => {
      safelyRemoveNaverMapListener(eventApi, listener);
    };
  }, [map, onChange]);

  const handleUndo = () => {
    onChange((previousCoordinates) => previousCoordinates.slice(0, -1));
  };

  const handleReset = () => {
    onChange([]);
  };

  const handleMarketSelect = (event) => {
    const value = event.target.value;

    setFeedback(null);
    onMarketSelect(value ? Number(value) : null);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFeedback({ type: "error", message: "시장 이름을 입력해주세요." });
      return;
    }

    if (coordinates.length < 3) {
      setFeedback({
        type: "error",
        message: "Polygon은 최소 3개의 정점이 필요합니다.",
      });
      return;
    }

    const geoJsonCoordinates = coordinates.map(({ lat, lng }) => [lng, lat]);

    geoJsonCoordinates.push([
      geoJsonCoordinates[0][0],
      geoJsonCoordinates[0][1],
    ]);

    const marketData = {
      name: trimmedName,
      boundary: {
        type: "Polygon",
        coordinates: [geoJsonCoordinates],
      },
    };

    try {
      setPendingAction("save");
      setFeedback(null);
      const response = await apiFetch(
        isEditing
          ? `/api/markets/${selectedMarketId}`
          : "/api/markets",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(marketData),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || `시장 저장 실패: ${response.status}`,
        );
      }

      const marketId = isEditing ? data.id : data;

      await onSaved(marketId);
      setFeedback({
        type: "success",
        message: `${trimmedName} ${isEditing ? "수정" : "등록"} 완료`,
      });
    } catch (error) {
      console.error("시장 저장 중 오류:", error);
      setFeedback({
        type: "error",
        message: error.message || "시장 저장에 실패했습니다.",
      });
    } finally {
      setPendingAction("");
    }
  };

  const handleDelete = async () => {
    if (!isEditing) {
      return;
    }

    if (!window.confirm(`${name} 시장을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setPendingAction("delete");
      setFeedback(null);
      const response = await apiFetch(`/api/markets/${selectedMarketId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.message || `시장 삭제 실패: ${response.status}`,
        );
      }

      await onDeleted(selectedMarketId);
      setFeedback({
        type: "success",
        message: `${name} 삭제 완료`,
      });
    } catch (error) {
      console.error("시장 삭제 중 오류:", error);
      setFeedback({
        type: "error",
        message: error.message || "시장 삭제에 실패했습니다.",
      });
    } finally {
      setPendingAction("");
    }
  };

  return (
    <div className="polygon-editor">
      <div className="polygon-editor-name">
        <label htmlFor="market-select">관리할 시장</label>
        <select
          id="market-select"
          value={selectedMarketId ?? ""}
          onChange={handleMarketSelect}
          disabled={pendingAction !== ""}
        >
          <option value="">새 시장 등록</option>
          {markets.map((market) => (
            <option key={market.id} value={market.id}>
              {market.name}
            </option>
          ))}
        </select>

        <label htmlFor="market-name">시장 이름</label>
        <input
          id="market-name"
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="예: 대전 중앙시장"
          maxLength={100}
          disabled={pendingAction !== ""}
        />
      </div>

      <div className="polygon-editor-info">
        {isEditing ? "선택 시장 수정" : "새 시장 등록"} · 정점{
          ` ${coordinates.length}개`
        }
      </div>

      {(loadError || feedback) && (
        <p
          className={`polygon-editor-feedback is-${
            feedback?.type || "error"
          }`}
          role={feedback?.type === "success" ? "status" : "alert"}
        >
          {feedback?.message || loadError}
        </p>
      )}

      <div className="polygon-editor-actions">
        <button
          type="button"
          onClick={handleUndo}
          disabled={coordinates.length === 0 || pendingAction !== ""}
        >
          되돌리기
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={coordinates.length === 0 || pendingAction !== ""}
        >
          초기화
        </button>
        <button
          type="button"
          className="polygon-save-button"
          onClick={handleSave}
          disabled={
            !name.trim()
            || coordinates.length < 3
            || pendingAction !== ""
          }
        >
          {pendingAction === "save"
            ? "저장 중..."
            : isEditing ? "수정" : "등록"}
        </button>
        {isEditing && (
          <button
            type="button"
            className="polygon-delete-button"
            onClick={handleDelete}
            disabled={pendingAction !== ""}
          >
            {pendingAction === "delete" ? "삭제 중..." : "삭제"}
          </button>
        )}
      </div>
    </div>
  );
}

export default PolygonEditor;
