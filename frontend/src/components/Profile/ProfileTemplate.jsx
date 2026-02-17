"use client";
import classes from "@/styles/Profile/ProfileTemplate.module.css";

const ProfileTemplate = ({ title, children }) => {
  return (
    <div className={classes["page"]}>
      <div className={classes["bg-container"]}>
        <div className={classes["dark-cover"]}></div>
        <h1>{title}</h1>
      </div>
      <div className={classes["main-container"]}>{children}</div>
    </div>
  );
};

export default ProfileTemplate;
