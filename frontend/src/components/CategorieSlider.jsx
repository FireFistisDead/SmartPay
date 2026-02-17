"use client";
import React, { useState } from "react";
import classes from "@/styles/CategorieSlider.module.css";
import CategorieSliderItem from "./CategorieSliderItem";
import CategorieData from "../../public/data/homepage/categories.json";
import Image from "next/image";
import { GrNext } from "react-icons/gr";
import { GrPrevious } from "react-icons/gr";

const CategorieSlider = () => {
  const [classNames, setClassNames] = useState([
    "active",
    "next",
    ...Array(CategorieData.length - 2).fill(""),
  ]);

  const next = () => {
    setClassNames((prev) => {
      prev.unshift("prev");
      prev.pop();
      return [...prev];
    });
  };
  const prev = () => {
    setClassNames((prev) => {
      prev.push("");
      prev.shift();
      return [...prev];
    });
  };

  return (
    <div className={classes.container}>
      <div className={classes.box}>
        <Image
          src="/profile-background-image.jpg"
          width={500}
          height={600}
          alt={"image"}
        />
        {CategorieData.map((item, index) => (
          <div
            className={`${classes.items_container} ${
              classes[classNames[index]]
            }`}
            key={index}
          >
            <CategorieSliderItem
              data={item}
              key={item.unique_uuid}
              height={1000}
            />
          </div>
        ))}
      </div>
      <div className={classes.buttons}>
        <button
          className={classes.button}
          onClick={prev}
          disabled={classNames[2] === ""}
        >
          <GrPrevious width={30} height={30} color="black" />
        </button>
        <button
          className={classes.button}
          onClick={next}
          disabled={classNames[classNames.length - 1] === "next"}
        >
          <GrNext width={30} height={30} color="black" />
        </button>
      </div>
    </div>
  );
};

export default CategorieSlider;
