import { useEffect, useState, useRef } from "react";
import firebase from "../utils/firebase";
import SVGRect from "../components/SVGRect";
import SVGLine from "../components/SVGLine";
import Point from "../types/Point";
import PointWithId from "../types/PointWithId";

interface Card extends Point {
  connections: { [id: string]: string };
  text: string;
}

interface Connection {
  from: string;
  to: string;
}

const mapToScreen = (p: Point, scale: number, origin: Point): Point => {
  return { x: origin.x + scale * p.x, y: origin.y + scale * p.y };
};

const screenToMap = (p: Point, scale: number, origin: Point): Point => {
  return { x: p.x / scale - origin.x, y: p.y / scale - origin.y };
};

const Index = () => {
  const [dataRef, setDataRef] = useState<firebase.database.Reference>(null);
  const [drawingFrom, setDrawingFrom] = useState<string>(null);
  const [drawingTo, setDrawingTo] = useState<string>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(null);
  const [cards, setCards] = useState<{ [id: string]: Card }>({});
  const [connections, setConnections] = useState<{ [id: string]: Connection }>(
    {}
  );
  const [name, setName] = useState<string>("family tree");
  const [cursor, setCursor] = useState<Point>({ x: 0, y: 0 });
  const [adding, setAdding] = useState<Point>(null);
  const [cardInMotion, setCardInMotion] = useState<PointWithId>({
    x: 0,
    y: 0,
    id: null,
  });
  const inputRef: React.Ref<HTMLInputElement> = useRef();
  const [width, setWidth] = useState<number>(800);
  const [height, setHeight] = useState<number>(800);
  const [scale, setScale] = useState<number>(1);
  // offset relative to upper-left corner in *map space*
  const [origin, setOrigin] = useState<Point>({ x: 0, y: 0 });

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === "Backspace" && cardInMotion.id) {
      const cardID = cardInMotion.id;
      // remove connections from this card
      const cardConnections = cards[cardID].connections;
      cardConnections &&
        Object.keys(cardConnections).forEach((toCard) => {
          dataRef.child(`cards/${cardID}/connections/${toCard}`).set(null);
          dataRef.child(`cards/${toCard}/connections/${cardID}`).set(null);
        });
      // remove card
      dataRef.child(`cards/${cardID}`).remove();
      // remove top-level connections
      for (let id in connections) {
        if (
          connections[id].from === cardInMotion.id ||
          connections[id].to === cardInMotion.id
        ) {
          dataRef.child(`connections/${id}`).remove();
        }
      }
    }
  };

  // do this once on page load
  useEffect(() => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
    const database = firebase.database();
    setDataRef(database.ref(`maps/${name}`));
  }, []);

  useEffect(() => {
    document.addEventListener("keyup", onKeyUp);
    return () => document.removeEventListener("keyup", onKeyUp);
  }, [cardInMotion]);

  useEffect(() => {
    if (dataRef === null) return;
    dataRef.child("cards").on("value", (snapshot) => {
      const _cards: { [id: string]: Card } = snapshot.val() || {};
      setCards(_cards);
    });
    dataRef.child("cards").on("child_added", (snapshot) => {
      const [key, card] = [snapshot.key, snapshot.val()];
      cards[key] = card;
      setCards(cards);
    });
    dataRef.child("connections").on("value", (snapshot) => {
      const _connections: { [id: string]: Connection } = snapshot.val() || {};
      setConnections(_connections);
    });
  }, [dataRef]);

  useEffect(() => {
    if (drawingFrom && drawingTo) {
      if (
        // don't draw connection to self
        drawingFrom === drawingTo ||
        // if already a connection, don't create a new one
        (cards[drawingFrom].connections &&
          drawingTo in cards[drawingFrom].connections)
      ) {
        setDrawingFrom(null);
        setDrawingTo(null);
        return;
      }
      dataRef.child(`cards/${drawingFrom}/connections/${drawingTo}`).set(true);
      dataRef.child(`cards/${drawingTo}/connections/${drawingFrom}`).set(true);
      dataRef.child("connections").push({
        from: drawingFrom,
        to: drawingTo,
      });
      setDrawingFrom(null);
      setDrawingTo(null);
    }
  }, [drawingFrom, drawingTo]);

  useEffect(() => {
    if (adding && inputRef && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const makeNewCard = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    setAdding({ x: e.pageX, y: e.pageY });
  };

  const saveCard = (text: string, p: Point): void => {
    dataRef.child("cards").push({
      connections: [],
      text,
      ...screenToMap(p, scale, origin),
    });
    setAdding(null);
  };

  const handleInputChange = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const { key } = e;
    const { value } = e.currentTarget;

    if (key === "Enter") {
      saveCard(value, adding);
    } else if (key === "Escape") {
      setAdding(null);
    }
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setCursor({ x: e.pageX, y: e.pageY });
    if (drawingFrom) return;
    if (!isMouseDown) return;
    setOrigin({
      x: origin.x + e.movementX / scale,
      y: origin.y + e.movementY / scale,
    });
  };

  return (
    <>
      <style jsx global>
        {`
          html,
          body {
            margin: 0;
            padding: 0;
          }
          body {
            background: #112;
            color: #fff;
            font-size: 18px;
            height: 100vh;
            width: 100vw;
            overflow: hidden;
          }
          input {
            background: transparent;
            border: 2px solid #fff;
            color: #fff;
          }
          #map {
            position: absolute;
            top: 0;
            left: 0;
          }
          .card {
            border: 2px solid #fff;
            padding: 10px;
            position: absolute;
            transform: translateX(-50%) translateY(-50%);
          }
          .card button {
            display: none;
          }
          .card:hover button {
            display: block;
          }
        `}
      </style>
      <div
        style={{ width: "100vw", height: "100vh" }}
        onDoubleClick={makeNewCard}
        onMouseDown={(e) => setIsMouseDown(true)}
        onMouseUp={(e) => {
          setIsMouseDown(false);
          console.log(cardInMotion);
        }}
        onMouseMove={onMouseMove}
        onWheel={(e) => {
          const newScale = scale * (1 - e.deltaY / 1000);
          const dx = (e.pageX / scale) * (1 - scale / newScale);
          const dy = (e.pageY / scale) * (1 - scale / newScale);
          const newOrigin = {
            x: origin.x - dx,
            y: origin.y - dy,
          };
          setOrigin(newOrigin);
          setScale(newScale);
        }}
      >
        <input
          defaultValue={name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setName(e.currentTarget.value)}
          type="text"
        />
        <svg id="map" height={height} width={width}>
          {Object.keys(connections).map((id) => {
            const { from, to } = connections[id];
            const cardFrom = cards[from];
            const cardTo = cards[to];
            if (!cardFrom || !cardTo) return null;
            return (
              <SVGLine
                key={id}
                cardInMotion={cardInMotion}
                from={from}
                to={to}
                x1={scale * (origin.x + cardFrom.x)}
                y1={scale * (origin.y + cardFrom.y)}
                x2={scale * (origin.x + cardTo.x)}
                y2={scale * (origin.y + cardTo.y)}
              />
            );
          })}
          {drawingFrom && (
            <SVGLine
              cardInMotion={cardInMotion}
              from={drawingFrom}
              to=""
              x1={scale * (origin.x + cards[drawingFrom].x)}
              y1={scale * (origin.y + cards[drawingFrom].y)}
              x2={cursor.x}
              y2={cursor.y}
            />
          )}
          {Object.keys(cards).map((id) => {
            const card = cards[id];
            return (
              <SVGRect
                dataRef={dataRef}
                key={id}
                id={id}
                x={scale * (origin.x + card.x)}
                y={scale * (origin.y + card.y)}
                scale={scale}
                origin={origin}
                text={card.text}
                drawingFrom={drawingFrom}
                setDrawingFrom={setDrawingFrom}
                setDrawingTo={setDrawingTo}
                cardInMotion={cardInMotion}
                setCardInMotion={setCardInMotion}
              />
            );
          })}
        </svg>
        {adding && (
          <div
            className="card"
            style={{
              left: adding.x,
              top: adding.y,
            }}
          >
            <input type="text" ref={inputRef} onKeyDown={handleInputChange} />
          </div>
        )}
      </div>
      <div style={{ position: "fixed", bottom: 20, left: 20 }}>
        Scale: {((scale * 100) | 0) / 100}
        <br />
        Origin: {origin.x | 0}, {origin.y | 0}
      </div>
    </>
  );
};

export default Index;
