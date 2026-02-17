"use client";
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import classes from "@/styles/AllTasks.module.css";
import Link from "next/link";
import useGetAllTasks from "@/hooks/useGetAllTasks";
import { useMetamask } from "@/hooks/useMetamask";

const Page = () => {
  const { handleGetAllTasks, isLoading } = useGetAllTasks();
  const [allTasks, setAllTasks] = useState([]);
  const { state } = useMetamask();

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const tasks = await handleGetAllTasks();
        console.log("Fetched tasks:", tasks);
        
        // Ensure we always set an array
        if (Array.isArray(tasks)) {
          setAllTasks(tasks);
        } else {
          console.warn("Tasks is not an array:", tasks);
          setAllTasks([]);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setAllTasks([]);
      }
    };
    fetchTasks();
  }, []);

  if (isLoading) {
    return (
      <>
        <Header />
        <div className={classes.container}>
          <div className={classes.loading}>Loading tasks...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={classes.container}>
        <div className={classes.header}>
          <h1>All Available Tasks</h1>
          <p>Browse all tasks posted on SmartPay</p>
          <Link href="/createNewJob" className={classes.createButton}>
            + Create New Task
          </Link>
        </div>

        {allTasks.length === 0 ? (
          <div className={classes.emptyState}>
            <h2>No tasks available yet</h2>
            <p>Be the first to create a task!</p>
            <Link href="/createNewJob" className={classes.createButtonLarge}>
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className={classes.tasksGrid}>
            {allTasks.map((task, index) => (
              <div key={index} className={classes.taskCard}>
                <div className={classes.taskHeader}>
                  <h3>{task.title || `Task #${task.id || index + 1}`}</h3>
                  <span className={classes.reward}>
                    {task.reward || 5} ETH
                  </span>
                </div>
                <p className={classes.description}>
                  {task.description || "No description provided"}
                </p>
                <div className={classes.taskMeta}>
                  <span className={classes.category}>
                    {task.majorTypeOfTask || "General"}
                  </span>
                  <span className={classes.subcategory}>
                    {task.minorTypeOfTask || "N/A"}
                  </span>
                </div>
                <div className={classes.taskFooter}>
                  <span className={classes.duration}>
                    ⏱ {task.timeToComplete || 7} days
                  </span>
                  <span className={classes.status}>
                    {task.status === 0 ? "🟢 Open" : "🔴 Assigned"}
                  </span>
                </div>
                <div className={classes.techStack}>
                  <strong>Tech:</strong> {task.teckStack || task.techStack || "Not specified"}
                </div>
                <Link
                  href={`/categories/${task.minorTypeOfTask || "website-making"}/allwork/seework/${task.creator || "demo"}_${task.id || index}`}
                  className={classes.viewButton}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
