import React from "react";
import Header from "@/components/Header";

const Page = () => {
  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "40vh",
        }}
      >
        <h1>Categories</h1>
      </div>
    </>
  );
};

export default Page;
