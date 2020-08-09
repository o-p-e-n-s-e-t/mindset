import { useEffect, useState, useRef } from "react";

import * as firebase from "firebase/app";
import "firebase/database";

let database: firebase.database.Database = null;
let ref: firebase.database.Reference;

interface Point {
  x: number;
  y: number;
}

interface Card extends Point {
  text: string;
}

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_URL,
};

const Index = () => {
  const [cards, setCards] = useState<{ [id: string]: Card }>({});
  const [name, setName] = useState<string>("family tree");
  const [adding, setAdding] = useState<Point>(null);
  const inputRef: React.Ref<HTMLInputElement> = useRef();

  useEffect(() => {
    if (database !== null) return;
    firebase.initializeApp(config);
    database = firebase.database();
    ref = database.ref(`maps/${name}`);
    ref.once("value").then((snapshot) => {
      const _cards: { [id: string]: Card } = snapshot.val().cards;
      console.log("the cards", _cards);
      setCards(_cards);
    });
    ref.child("cards").on("child_added", (snapshot) => {
      const [key, card] = [snapshot.key, snapshot.val()];
      cards[key] = card;
      setCards(cards);
    });
  }, []);

  useEffect(() => {
    if (adding && inputRef && inputRef.current) inputRef.current.focus();
  });

  const makeNewCard = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ): void => {
    setAdding({ x: e.pageX, y: e.pageY });
  };

  const saveCard = (text: string, x: number, y: number): void => {
    ref.child("cards").push({
      text,
      x,
      y,
    });
    setAdding(null);
  };

  const handleInputChange = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    const { key } = e;
    const { value } = e.currentTarget;

    if (key === "Enter") {
      saveCard(value, adding.x, adding.y);
    } else if (key === "Escape") {
      setAdding(null);
    }
  };

  const updateCardText = (id: string, text: string) => {
    ref.child(`cards/${id}`).update({ text });
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
          }
          input {
            background: transparent;
            border: 2px solid #fff;
            color: #fff;
          }
          .card {
            border: 2px solid #fff;
            padding: 10px;
            position: absolute;
            transform: translateX(-50%) translateY(-50%);
          }
        `}
      </style>
      <div
        style={{ width: "100vw", height: "100vh" }}
        onDoubleClick={makeNewCard}
      >
        <input
          defaultValue={name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setName(e.currentTarget.value)}
          type="text"
        />
        {adding && (
          <div className="card" style={{ left: adding.x, top: adding.y }}>
            <input type="text" ref={inputRef} onKeyDown={handleInputChange} />
          </div>
        )}
        {Object.keys(cards).map((id) => {
          const card = cards[id];
          return (
            <div
              key={id}
              className="card"
              style={{ left: card.x, top: card.y }}
            >
              <span
                contentEditable
                onInput={(e) => updateCardText(id, e.currentTarget.innerText)}
                suppressContentEditableWarning
              >
                {card.text}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Index;
