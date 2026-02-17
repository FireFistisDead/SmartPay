"use client";
import classes from "@/styles/page.module.css";
import Header from "@/components/Header";
import HomeCategories from "@/components/HomeCategories";
import OurServices from "@/components/OurServices";
import AboutHome from "@/components/AboutHome";

export default function App() {
  return (
    <main>
      <Header />
      <div className={classes.container}>
        <div className={classes.box}>
          <HomeCategories />
          <OurServices />
          <AboutHome />
        </div>
      </div>
    </main>
  );
}
