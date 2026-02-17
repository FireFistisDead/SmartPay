import React from "react";
import classes from "@/styles/CategorieSlider.module.css";
import Image from "next/image";
import Link from "next/link";

const CategorieSliderItem = ({ data, height }) => {
  return (
    <Link href={`/categories/${data.a_tag}`}>
      <div className={classes.item_container}>
        <Image
          src={`/image/homepage/categories/${data.image}`}
          width={1000}
          height={height}
          alt={data.unique_uuid}
        />
        <div className={classes.backdrop}></div>
        <div className={classes.paragraph}>{data.paragraph}</div>
        <div className={classes.description}>{data.heading}</div>
      </div>
    </Link>
  );
};

export default CategorieSliderItem;
