"use client";
import React from "react";
import classes from "@/styles/DemoBanner.module.css";

const DemoBanner = () => {
  return (
    <div className={classes.demoBanner}>
      <div className={classes.container}>
        <span className={classes.icon}>🎭</span>
        <span className={classes.text}>
          <strong>DEMO MODE</strong> - No wallet or crypto funds required! Create tasks for free.
        </span>
        <span className={classes.badge}>FREE</span>
      </div>
    </div>
  );
};

export default DemoBanner;
