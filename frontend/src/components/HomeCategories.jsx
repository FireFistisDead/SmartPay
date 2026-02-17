import React from "react";
import classes from "@/styles/HomeCategories.module.css";
import CategorieSlider from "./CategorieSlider";

const dataToshow = {
  heading: "Logos, Websites, T-shirts Graphic Design & More.",
  short_about:
    "Connect with skilled freelancers and get work done efficiently. FreelancerHub is a platform that facilitates collaboration between freelancers and clients by providing a seamless process for posting and completing projects.",
  short_motivation:
    "Empower your freelance journey with FreelancerHub. Whether you're looking for freelance work or seeking talented freelancers, our platform is designed to streamline the process and make your experience enjoyable and productive.",
};

const HomeCategories = () => {
  return (
    <div className={classes.container}>
      <div className={classes.box}>
        <div className={classes.heading}>{dataToshow.heading}</div>
        {/* <div className={classes.short_about}>{dataToshow.short_about}</div> */}
        <div className={classes.short_motivation}>
          {dataToshow.short_motivation}
        </div>
      </div>
      <div className={classes.slider}>
        <CategorieSlider />
      </div>
    </div>
  );
};

export default HomeCategories;
