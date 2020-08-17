import PointWithId from "../types/PointWithId";
import { useState } from "react";

const SVGLine = ({
  x1,
  y1,
  x2,
  y2,
  cardInMotion,
  from,
  to,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cardInMotion: PointWithId;
  from: string;
  to: string;
}) => {
  const [stroke, setStroke] = useState<string>("#fff");
  if (cardInMotion.id === from) {
    x1 = cardInMotion.x;
    y1 = cardInMotion.y;
  } else if (cardInMotion.id === to) {
    x2 = cardInMotion.x;
    y2 = cardInMotion.y;
  }
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="transparent"
        strokeWidth={6}
        onClick={() => setStroke("#f00")}
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={2}
        onClick={() => setStroke("#f00")}
      />
    </g>
  );
};

export default SVGLine;
