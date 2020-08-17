import { useState } from "react";
import Point from "../types/Point";
import PointWithId from "../types/PointWithId";

const SVGRect = ({
  dataRef,
  id,
  x,
  y,
  scale,
  origin,
  text,
  cardInMotion,
  drawingFrom,
  setDrawingFrom,
  setDrawingTo,
  setCardInMotion,
}: {
  dataRef: firebase.database.Reference;
  id: string;
  x: number;
  y: number;
  scale: number;
  origin: Point;
  text: string;
  cardInMotion: PointWithId;
  drawingFrom: string;
  setDrawingFrom: React.Dispatch<React.SetStateAction<string>>;
  setDrawingTo: React.Dispatch<React.SetStateAction<string>>;
  setCardInMotion: React.Dispatch<React.SetStateAction<PointWithId>>;
}) => {
  const width = 250 * scale;
  const height = 100 * scale;
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);

  const update = () => {
    setIsMouseDown(false);
    if (cardInMotion.x === 0 && cardInMotion.y === 0) return;
    dataRef.child(`cards/${id}`).update({
      x: cardInMotion.x / scale - origin.x,
      y: cardInMotion.y / scale - origin.y,
    });
    setCardInMotion({ x: 0, y: 0, id: null });
  };

  const gx = (cardInMotion.id === id ? cardInMotion.x : x) - width / 2;
  const gy = (cardInMotion.id === id ? cardInMotion.y : y) - height / 2;

  return (
    <g
      transform={`translate(${gx} ${gy})`}
      onMouseDown={(e) => {
        setIsMouseDown(true);
        if (e.shiftKey) {
          setDrawingFrom(id);
        } else {
          setCardInMotion({ x, y, id });
        }
      }}
      onMouseMove={(e) => {
        if (!isMouseDown) return;
        e.stopPropagation();
        if (e.shiftKey) {
        } else {
          setCardInMotion({
            x: cardInMotion.x + e.movementX,
            y: cardInMotion.y + e.movementY,
            id,
          });
        }
      }}
      onMouseUp={() => {
        update();
        if (drawingFrom) {
          setDrawingTo(id);
        }
      }}
      onMouseLeave={() => isMouseDown && update()}
    >
      <rect
        {...{ width, height }}
        strokeWidth={1}
        stroke="#fff"
        fill={isMouseDown ? "#224" : "#000"}
      ></rect>
      <text
        fill="#fff"
        transform={`translate(${width / 2} ${height / 2})`}
        textAnchor="middle"
        alignmentBaseline="middle"
        style={{ userSelect: "none" }}
      >
        {text}
      </text>
    </g>
  );
};

export default SVGRect;
