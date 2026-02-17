"use client";
import React from "react";
import classes from "@/styles/CreateNewJob.module.css";
import JobForm from "@/components/JobForm";
import Header from "@/components/Header";
import useGetTask from "@/hooks/useGetTask";
import useGetAllTasks from "@/hooks/useGetAllTasks";

const Page = () => {
  const { handleGetAllTasks } = useGetAllTasks();
  const { handleGetTask } = useGetTask();

  const handleGetAllTask = async () => {
    try {
      const tx = await handleGetAllTasks();
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      throw err;
    }
  };

  const handleGetTaskbutton = async () => {
    try {
      const tx = await handleGetTask(1);
    } catch (err) {
      console.log("Error during task creating : ", err.message);
      throw err;
    }
  };

  return (
    <>
      {/* <button onClick={handleGetAllTask}>handleGetAllTask</button> */}
      {/* <button onClick={handleGetTaskbutton}>handleGetTaskbutton</button> */}
      <Header />
      <div className={classes.container}>
        <div className={classes.box}>
          <div className={classes.top_description}>
            <div className={classes.description_box}>
              <h1>Post a job on SmartPay</h1>
              <p>
                The job board for hiring designers, developers and creative
                professionals
              </p>
            </div>
          </div>
          <div className={classes.middle_background}></div>
          <div className={classes.bottom_form}>
            <div className={classes.box_form}>
              <JobForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
