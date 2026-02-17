import React from "react";
import { IoIosStar } from "react-icons/io";
import classes from "@/styles/Reviews.module.css";

const StarReviews = ({ index, setCountStar }) => {
  const newIndex = Math.trunc(index);
  const maxStars = 5;
  const coloredStarArray = Array(newIndex)
    .fill()
    .map((_, i) => (
      <div
        style={{ display: "inline" }}
        onClick={() => {
          setCountStar(i);
        }}
        key={`colored-${i}`}
      >
        <IoIosStar color="var(--primary-color)" size={20} />
      </div>
    ));
  const whiteStarArray = Array(maxStars - newIndex)
    .fill()
    .map((_, i) => (
      <div
        style={{ display: "inline" }}
        onClick={() => {
          setCountStar(index + i + 1);
        }}
        key={`white-${i}`}
      >
        <IoIosStar color="black" size={20} />
      </div>
    ));
  return (
    <div className={classes.containerStars}>
      {coloredStarArray}
      {whiteStarArray}
    </div>
  );
};

export default StarReviews;
