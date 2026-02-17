"use client";
import React, { useState } from "react";
import classes from "@/styles/EachWorkitem.module.css";
import { MdOutlineMyLocation } from "react-icons/md";
import { FaRegClock } from "react-icons/fa";
import { FaCalendarAlt } from "react-icons/fa";
import { GiSkills } from "react-icons/gi";
import { GiTakeMyMoney } from "react-icons/gi";
import { MdOutlineWorkHistory } from "react-icons/md";
import { FaFileContract } from "react-icons/fa";
import { useMetamask } from "@/hooks/useMetamask";
import useRequestForTaskToCreator from "@/hooks/useRequestForTaskToCreator";
import useCompleteTask from "@/hooks/useCompleteTask";
import useDeleteTask from "@/hooks/useDeleteTask";
import { useRouter } from "next/navigation";
import useSubmissionLink from "@/hooks/useSubmissionLink";

const EachWorkitem = ({ workitem, projectAddress }) => {
  const router = useRouter();
  const { handleCompleteTask } = useCompleteTask();
  const { handleDeleteTask } = useDeleteTask();
  const { handleRequestForTaskToCreator } = useRequestForTaskToCreator();
  const { submissionLink } = useSubmissionLink();
  const [link, setLink] = useState("");
  const {
    dispatch,
    state: { wallet },
  } = useMetamask();

  const {
    title,
    description,
    reward,
    timeToComplete,
    majorTypeOfTask,
    minorTypeOfTask,
    techStack,
    creator,
    createdAt,
    isUserRequestForTask,
    solver,
    id,
  } = workitem;
  console.log(workitem);
  const date = new Date(createdAt * 1000);
  const techStackArray = techStack.split(",");

  const onclickHandleRequestForTaskToCreator = async () => {
    console.log(workitem.id);
    const result = await handleRequestForTaskToCreator(id);
    console.log(result);
  };

  const onclickHandleSubmitTaskToCreator = async () => {
    const result = await handleCompleteTask(id);
    console.log(result);
    if (result) {
      const data = {
        createrAddress: creator,
        projectAddress: projectAddress,
        solverAddress: wallet,
        subbmissionLink: link,
      };
      const result = await submissionLink(data);
      console.log(result);
    }
  };

  const handleDeleteTaskFromCreator = async () => {
    const result = await handleDeleteTask(id);
    console.log(result);
    router.push(`/categories/${minorTypeOfTask}/allwork`);
  };

  return (
    <div className={classes.container}>
      <div className={classes.box}>
        <div className={classes.delete_project}>
          {creator.toUpperCase() === wallet.toUpperCase() ? (
            <button
              className={classes.delete_project_button}
              onClick={handleDeleteTaskFromCreator}
            >
              Delete Work
            </button>
          ) : (
            <></>
          )}
        </div>
        <div className={classes.details}>
          <div className={classes.title}>
            <h1>{title}</h1>
          </div>
          <div className={classes.time_location}>
            <div>
              <p>Posted At: {date.toUTCString()}</p>
            </div>
            <div className={classes.time_location_inside}>
              <MdOutlineMyLocation /> Worldwide
            </div>
          </div>
          <div className={classes.description}>
            <p>{description}</p>
          </div>
          <div className={classes.different_logo_box}>
            <div className={classes.different_logo}>
              <FaRegClock />
              <p>Less than 30hrs/week</p>
            </div>
            <div className={classes.different_logo}>
              <FaCalendarAlt />
              <p>{timeToComplete} months</p>
            </div>
            <div className={classes.different_logo}>
              <GiSkills />
              <p>Intermediate</p>
            </div>
            <div className={classes.different_logo}>
              <GiTakeMyMoney />
              <p>{reward} ETH</p>
            </div>
            <div className={classes.different_logo}>
              <MdOutlineMyLocation />
              <p>Remote work</p>
            </div>
            <div className={classes.different_logo}>
              <MdOutlineWorkHistory />
              <p>Ongoing project</p>
            </div>
            <div className={classes.different_logo}>
              <FaFileContract />
              <p>Contact to hire</p>
            </div>
          </div>
          <div className={classes.bottom}>
            <div className={classes.majorTypeOfTask}>
              Major Type Of Task: {majorTypeOfTask}
            </div>
            <div className={classes.minorTypeOfTask}>
              Minor Type Of Task: {minorTypeOfTask}
            </div>
            <div className={classes.techStack}>
              <h1>Tech Stack : </h1>
              {techStackArray.map((tech, index) => (
                <div className={classes.techStack_item} key={index}>
                  {tech}
                </div>
              ))}
            </div>
          </div>
          <div className={classes.button}>
            {creator.toUpperCase() == wallet.toUpperCase() ? (
              <button className={classes.button_creater} disabled={true}>
                Creator
              </button>
            ) : isUserRequestForTask ? (
              <>
                {solver.toUpperCase() == wallet.toUpperCase() ? (
                  <>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Enter the link of your work"
                    />
                    <button
                      className={classes.button1}
                      onClick={() => {
                        onclickHandleSubmitTaskToCreator();
                      }}
                    >
                      Submit
                    </button>
                  </>
                ) : (
                  <button className={classes.button1}>Requested</button>
                )}
              </>
            ) : (
              <button
                className={classes.button2}
                onClick={onclickHandleRequestForTaskToCreator}
              >
                Request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EachWorkitem;
