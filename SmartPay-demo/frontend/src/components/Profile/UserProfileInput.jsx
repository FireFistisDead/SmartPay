"use client";
import classes from "@/styles/Profile/UserProfileInput.module.css";
import styles from "@/styles/Profile/Profile.module.css";
import ProfileIconUpload from "@/components/Profile/ProfileIconUpload";
import { useState, useEffect } from "react";
import { useMetamask } from "@/hooks/useMetamask";
import { useNotification } from "@/hooks/useNotification";
var new_wallet = "";
const UserProfileInput = () => {
  const { NotificationHandler } = useNotification();
  const {
    dispatch,
    state: { wallet },
  } = useMetamask();
  new_wallet = wallet;

  const [file, setFile] = useState(null);
  const [values, setValues] = useState({
    firstName: "John",
    lastName: "dev",
    description: "We enjoyed this hackthon!",
    credits: 0,
  });

  const { firstName, lastName, description } = values;
  const valueChangeHandler = (name) => (event) => {
    setValues({ ...values, [name]: event.target.value });
  };

  const sendProfile = async () => {
    const sendingData = {
      firstName,
      lastName: lastName,
      description,
      walletAddress: wallet,
    };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/update`,
      {
        method: "post",
        body: JSON.stringify(sendingData),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const resData = await response.json();
    console.log(resData);
    if (resData.message == "User Updated Sucessfully!") {
      NotificationHandler(
        "SmartPay",
        "Profile Updated Successfully!",
        "Success"
      );
    }
  };

  useEffect(() => {
    const getProfile = async () => {
      try {
        const headers = new Headers({
          "Content-Type": "application/json",
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/${new_wallet}`,
          {
            method: "get",
            headers: headers,
          }
        );
        const resData = await response.json();
        console.log(resData);
        if (resData.message == "User Found!") {
          setValues({
            firstName: resData.response[0].firstName,
            lastName: resData.response[0].lastName,
            description: resData.response[0].description,
            credits: resData.response[0].credits,
          });
        }
      } catch (err) {
        console.log(err);
        setValues({
          firstName: "",
          lastName: "",
          description: "",
          credits: 0,
        });
      }
    };
    setTimeout(() => {
      if (wallet) getProfile();
    }, 3000);
  }, [wallet]);

  console.log(file);
  return (
    <div className={classes["three-cols"]}>
      <div className={classes["image-selector"]}>
        <ProfileIconUpload setFile={setFile} />
        <p className={classes["light-text"]}>
          We recomment an image of at least 400X400. GIFs work too.
        </p>
      </div>
      <div className={classes["input-field-container"]}>
        <h1>Personal Detail:</h1>
        <div className={styles.row}>
          <div className={styles.col}>
            {" "}
            <lable className={styles.label}>First Name:</lable>
            <input
              placeholder="First Name"
              value={firstName}
              onChange={valueChangeHandler("firstName")}
              className={styles["user-input"]}
            />
          </div>
          <div className={styles.col}>
            <lable className={styles.label}>Second Name:</lable>
            <input
              value={lastName}
              onChange={valueChangeHandler("lastName")}
              placeholder="Second Name "
              className={styles["user-input"]}
            />
          </div>
        </div>
        <div>
          <div className={styles.col}>
            <lable className={styles.label}>Description :</lable>
            <textarea
              value={description}
              onChange={valueChangeHandler("description")}
              placeholder="Description"
              className={styles["user-input"]}
            />
          </div>
        </div>
        <div>
          <div className={styles.col}>
            <lable className={styles.label}>Credits Left : </lable>
            <input
              value={values.credits}
              className={styles["user-input"]}
              disabled
            />
          </div>
        </div>
        <button
          style={{ width: "fit-content", padding: "0.5rem 1.25rem" }}
          className={styles["upload-btn"]}
          onClick={sendProfile}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default UserProfileInput;
