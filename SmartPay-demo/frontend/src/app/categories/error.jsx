"use client";
import Header from "@/components/Header";

export default function Error({ error, reset }) {
  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          height: "100vh",
          gap: "2rem",
        }}
      >
        <h2
          style={{
            color: "var(--primary-color)",
            fontSize: "2.8rem",
            textTransform: "uppercase",
          }}
        >
          Something went wrong!
        </h2>
        <button
          onClick={() => reset()}
          style={{
            all: "unset",
            padding: "1rem 2rem",
            color: "var(--black-color)",
            fontSize: "1.5rem",
            border: "1px solid var(--black-color)",
            borderRadius: "0.5rem",
            backgroundColor: "var(--primary-color)",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </div>
    </>
  );
}
