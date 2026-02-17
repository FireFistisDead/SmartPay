import React from "react";
import Header from "@/components/Header";
const Loading = () => {
  return (
    <>
      <Header />
      <div
        className="loading"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="spin-wrapper">
          <div
            className="spin"
            style={{
              height: "50px",
              width: "50px",
            }}
          ></div>
        </div>
      </div>
    </>
  );
};

export default Loading;
