"use client";
import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import classes from "@/styles/SeeWork.module.css";
import EachWorkitem from "@/components/EachWorkitem";
import useGetTask from "@/hooks/useGetTask";
import useGetAllrequestForTaskByTask from "@/hooks/useGetAllrequestForTaskByTask";
import { useMetamask } from "@/hooks/useMetamask";
import ReviewsInput from "@/components/Reviews/ReviewInput";
import ReviewsItem from "@/components/Reviews/ReviewItem";
import { MdDelete } from "react-icons/md";
import { TiTick } from "react-icons/ti";
import useRejectForTaskByCreator from "@/hooks/useRejectForTaskByCreator";
import useAcceptTaskForSolver from "@/hooks/useAcceptTaskForSolver";
import useTransferRewardToSolver from "@/hooks/useTransferRewardToSolver";
import { FaThumbsUp } from "react-icons/fa";
import { FaThumbsDown } from "react-icons/fa";

const MINORWORKS = {
  id: 1,
  title: "Selling Phone Website",
  description:
    "Create an e-commerce website for selling phones. the website should have a login page, a home page, a product page, and a cart page. The website should be responsive and should be able to work on mobile devices. The website should be able to accept payments. The website should be able to send emails to the user. The website should be able to send emails to the admin. The website should be able to send emails to the seller. The website should be able to send emails to the delivery person.",
  reward: 80,
  timeToComplete: 12,
  majorTypeOfTask: "Development",
  minorTypeOfTask: "Website",
  techStack: "Angular, Express.js",
  creator: "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4",
  createdAt: 1619000000,
  isUserRequestForTask: false,
};

const Page = ({ params }) => {
  const {
    dispatch,
    state: { wallet },
  } = useMetamask();
  const MINORWORK = params.job;
  const IMAGEPATH = params.id.split("_")[1];
  const { isLoading, handleGetTask } = useGetTask();
  const { handleGetAllrequestForTaskByTask } = useGetAllrequestForTaskByTask();
  const [eachWorkitem, setEachWorkitem] = useState(MINORWORKS);
  const [allRequestForThisTask, setAllRequestForThisTask] = useState([]);

  const { handleRejectForTaskByCreator } = useRejectForTaskByCreator();
  const { handleAcceptTaskForSolver } = useAcceptTaskForSolver();
  const { handleTransferRewardToSolver } = useTransferRewardToSolver();

  useEffect(() => {
    const getFunction = async () => {
      try {
        const result = await handleGetTask(IMAGEPATH);
        console.log(result);
        setEachWorkitem(result);
      } catch (err) {
        console.log(err.message);
      }
      try {
        const response = await handleGetAllrequestForTaskByTask(IMAGEPATH);
        console.log(response);
        setAllRequestForThisTask(response);
      } catch (err) {
        console.log(err.message);
      }
    };
    if (wallet != null && IMAGEPATH != null) getFunction();
  }, [wallet || IMAGEPATH]);

  const [data, setData] = useState([]);
  useEffect(() => {
    const callFunction = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/reviews/${
            params.id.split("_")[0]
          }`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        const responsedata = await response.json();
        setData(responsedata.response);
      } catch (err) {
        console.log(err.message);
      }
    };
    if (wallet && params.id) callFunction();
  }, [wallet, params.id.split("_")[0]]);

  const setDataInput = (data) => {
    setData((prev) => [...prev, data]);
  };

  const handleDelete = async (user) => {
    try {
      const response = await handleRejectForTaskByCreator(IMAGEPATH, user);
      console.log(response);
      setAllRequestForThisTask((prev) => {
        const new_array = prev.filter((item) => item != user);
        return new_array;
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleAccept = async (user) => {
    try {
      const response = await handleAcceptTaskForSolver(IMAGEPATH, user);
      console.log(response);
      setAllRequestForThisTask((prev) => {
        const new_array = prev.filter((item) => item != user);
        return new_array;
      });
    } catch (err) {
      console.log(err.message);
    }
  };

  const [submissionUser, setSubmissionUser] = useState(null);
  useEffect(() => {
    const handleGetSubmission = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/submission/${IMAGEPATH}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );
        const responsedata = await response.json();
        setSubmissionUser(responsedata.response);
        console.log(responsedata);
      } catch (err) {
        console.log(err.message);
      }
    };
    if (wallet && IMAGEPATH) handleGetSubmission();
  }, [wallet]);

  const handleTransferRewardToSolverFun = async () => {
    try {
      const response = await handleTransferRewardToSolver(eachWorkitem.id);
      console.log(response);
    } catch (err) {
      console.log(err.message);
    }
  };

  const handleUpvoteandDownvote = async (id, type, current) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/submission/${id}/${type}/${current}`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      const responsedata = await response.json();
      console.log(responsedata);
      const new_type = type + "s";
      console.log(new_type);
      if (responsedata.message == "Upvote and Downvote updated successfully!")
        setSubmissionUser((prev) => ({
          ...prev,
          [new_type]: prev[new_type] + 1,
        }));
    } catch (err) {
      console.log(err.message);
    }
  };

  if (isLoading)
    return (
      <>
        <Header />
        <div className={classes.contaier}>
          <div className={classes.box}>
            <h1>
              {MINORWORK.replace(/-/g, " ")} -{IMAGEPATH}
            </h1>
            <h1>Loading...</h1>
          </div>
        </div>
      </>
    );

  if (!wallet)
    return (
      <>
        <Header />
        <div className={classes.contaier}>
          <div className={classes.connect_wallet}>
            <h1>Please connect your wallet to see this page!</h1>
          </div>
        </div>
      </>
    );

  return (
    <>
      <Header />
      <div className={classes.contaier}>
        <div className={classes.box}>
          <h1>
            {MINORWORK.replace(/-/g, " ")} -{IMAGEPATH}
          </h1>
          <EachWorkitem
            workitem={eachWorkitem}
            projectAddress={params.id.split("_")[1]}
          />
          {eachWorkitem.creator.toUpperCase() == wallet.toUpperCase() ? (
            <>
              {allRequestForThisTask.length > 0 ? (
                <>
                  {allRequestForThisTask.map((request, index) => {
                    return (
                      <>
                        <div className={classes.request_container} key={index}>
                          <div className={classes.reques_container_box}>
                            <h1>
                              {index + 1}. User :<span>{request}</span>
                            </h1>
                            <div
                              style={{
                                cursor: "pointer",
                              }}
                            >
                              <MdDelete
                                size={30}
                                color="black"
                                onClick={() => {
                                  handleDelete(request);
                                }}
                              />
                              <TiTick
                                size={35}
                                color="var(--primary-color)"
                                onClick={() => {
                                  handleAccept(request);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })}
                </>
              ) : (
                <>
                  <div className={classes.request_container}>
                    <div className={classes.reques_container_box}>
                      <h1>No user Requested for this task yet!</h1>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className={classes.request_container}>
                <div className={classes.reques_container_box}>
                  <h1>
                    No user Requested for this task yet. Be the first one to do!
                  </h1>
                </div>
              </div>
            </>
          )}
          <div className={classes.reviewsInput}>
            <div className={classes.headingReview}>Reviews</div>
            <div className={classes.box_reviews}>
              {data.map((people, index) => (
                <ReviewsItem key={index} data={people} />
              ))}
            </div>
            <ReviewsInput
              setDataInput={setDataInput}
              jobId={params.id.split("_")[0]}
            />
          </div>
          {eachWorkitem.creator.toUpperCase() == wallet.toUpperCase() &&
            submissionUser != null && (
              <div className={classes.user_submission}>
                <div className={classes.box_submission}>
                  <h1>Project Submission</h1>
                  <p>Submission Id: {submissionUser.id}</p>
                  <p>Creator Address: {submissionUser.createrAddress}</p>
                  <p>Project Address: {submissionUser.projectAddress}</p>
                  <p>Solver Address: {submissionUser.solverAddress}</p>
                  <p>
                    Submission Link:{" "}
                    <a
                      href={submissionUser.subbmissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {submissionUser.subbmissionLink}
                    </a>
                  </p>
                  <p>Upvotes: {submissionUser.upvotes}</p>
                  <p>Downvotes: {submissionUser.downvotes}</p>
                  <p>Submission Date: {submissionUser.submissionDate}</p>
                  <button onClick={handleTransferRewardToSolverFun}>
                    Give Reward to user
                  </button>
                </div>
              </div>
            )}
          {eachWorkitem.creator.toUpperCase() != wallet.toUpperCase() &&
            submissionUser != null && (
              <div className={classes.user_submission}>
                <div className={classes.box_submission_voting}>
                  <p>
                    Submission Link:{" "}
                    <a
                      href={submissionUser.subbmissionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {submissionUser.subbmissionLink}
                    </a>
                  </p>
                  <p>
                    Upvotes: {submissionUser.upvotes}{" "}
                    <FaThumbsUp
                      size={20}
                      color="var(--light-black-color)"
                      onClick={() => {
                        handleUpvoteandDownvote(
                          submissionUser.projectAddress,
                          "upvote",
                          submissionUser.upvotes
                        );
                      }}
                    />
                  </p>
                  <p>
                    Downvotes: {submissionUser.downvotes}
                    <FaThumbsDown
                      size={20}
                      color="var(--light-black-color)"
                      onClick={() => {
                        handleUpvoteandDownvote(
                          submissionUser.projectAddress,
                          "downvote",
                          submissionUser.downvotes
                        );
                      }}
                    />
                  </p>
                </div>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default Page;
