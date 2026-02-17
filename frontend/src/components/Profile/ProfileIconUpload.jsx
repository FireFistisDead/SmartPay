"use client";
import { useState } from "react";
import Image from "next/image";
import classes from "@/styles/Profile/UserProfileInput.module.css";

export default function ProfileIconUpload({ setFile }) {
  const [icon, setIcon] = useState("/default-avatar.svg");
  function handleIconUpload(event) {
    const file = event.target.files[0];
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setIcon(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <input
        style={{ display: "none" }}
        type="file"
        accept="image/*"
        id="profile"
        onChange={handleIconUpload}
      />
      <label htmlFor="profile" className={classes["file-input-label"]}>
        <Image
          src={icon}
          width={150}
          alt="profile icon"
          height={150}
          style={{ borderRadius: "100px" }}
        />
      </label>
    </>
  );
}
