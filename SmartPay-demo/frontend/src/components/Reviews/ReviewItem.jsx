import React from "react";
import Star from "./Star";
import Image from "next/image";
import classes from "@/styles/Reviews.module.css";

const ReviewsItem = ({ data }) => {
  return (
    <div className={classes.container_item}>
      <div className={classes.top}>
        <div className={classes.top_left}>
          <Image
            src={`/${data.image}`}
            alt={data.image}
            width="40"
            height="40"
          />
          <div className={classes.top_left_right}>
            <Star index={data.star} />
            <p>{data.date}</p>
          </div>
        </div>
        <div className={classes.top_right}>
          <Image
            src={`/${data.image}`}
            alt={data.image}
            width="25"
            height="25"
          />
        </div>
      </div>
      <div className={classes.bottom}>{data.description}</div>
    </div>
  );
};

export default ReviewsItem;
