"use client";
import React, { useEffect, useState, useRef } from "react";
import ReviewsItem from "./ReviewItem";

import classes from "@/styles/Reviews.module.css";

const Reviews = () => {
  const myref = useRef();
  const [myElementIsVisible, setMyElementIsVisible] = useState();
  const [data, setData] = useState([]);
  useEffect(() => {
    const callFunction = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        const responsedata = await response.json();
        setData(responsedata.response);
      } catch (err) {
        console.log(err.message);
      }
    };
    callFunction();
  }, []);
  console.log(data);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setMyElementIsVisible(entry.isIntersecting);
    });
    observer.observe(myref.current);
  }, []);

  // const setDataInput = (data) => {
  //   setData((prev) => [...prev, data]);
  // };

  return (
    <div className={classes.container} ref={myref}>
      <div className={classes.heading}>Reviews</div>
      <div
        className={!myElementIsVisible ? classes.box : classes.boxVisible}
        ref={myref}
      >
        {data.map((people, index) => (
          <ReviewsItem key={index} data={people} />
        ))}
        {/* <ReviewsInput setDataInput={setDataInput} /> */}
      </div>
    </div>
  );
};

export default Reviews;
