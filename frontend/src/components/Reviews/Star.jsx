import React from "react";
import { IoIosStar } from "react-icons/io";
import classes from "@/styles/Reviews.module.css";

const Star = ({ index }) => {
  const newIndex = Math.trunc(index);
  const maxStars = 5;
  const coloredStars = Math.min(newIndex, maxStars);
  const whiteStars = Math.max(maxStars - newIndex, 0);
  const coloredStarArray = Array(coloredStars)
    .fill()
    .map((_, i) => (
      <div style={{ display: "inline" }} key={`colored-${i}`}>
        <IoIosStar color="var(--primary-color)" size={20} />
      </div>
    ));
  const whiteStarArray = Array(whiteStars)
    .fill()
    .map((_, i) => (
      <div style={{ display: "inline" }} key={`white-${i}`}>
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

export default Star;
