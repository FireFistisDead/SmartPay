import React from "react";
import classes from "@/styles/AboutHome.module.css";
import Link from "next/link";

const AboutHome = () => {
  return (
    <div className={classes.container}>
      <div className={classes.box}>
        <h1>Connect with Top Talent Globally</h1>
        <p>
          Hire skilled freelancers and build amazing projects with blockchain-secured payments.
        </p>
        <p>Take control of your project with SmartPay.</p>
        <p>Pay securely, transparently, and instantly with cryptocurrency.</p>
        <Link href="/createNewJob">
          <button>Post a Job Now</button>
        </Link>
      </div>
    </div>
  );
};

export default AboutHome;
