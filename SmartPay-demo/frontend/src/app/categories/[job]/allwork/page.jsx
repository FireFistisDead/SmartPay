"use client";
import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import imagePathForallCatogries from "../../../../../public/data/imagePath.json";
import classes from "@/styles/AllWork.module.css";
import Image from "next/image";
import Link from "next/link";
import useGetAllTaskByNinorTypeOfTask from "@/hooks/useGetAllTaskByNinorTypeOfTask";

const Page = ({ params }) => {
  const { isLoading, handleGetAllTaskByNinorTypeOfTask } =
    useGetAllTaskByNinorTypeOfTask();
  const [allTask, setAllTask] = useState([]);
  const PATHNAME = params.job;
  const AllImagePAth = imagePathForallCatogries[PATHNAME];
  const INDEX = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    const getFunction = async () => {
      const result = await handleGetAllTaskByNinorTypeOfTask(PATHNAME);
      setAllTask(result);
    };
    getFunction();
  }, []);

  if (isLoading)
    return (
      <>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
            fontSize: "30px",
            fontWeight: "bold",
            color: "var(--primary-color)",
          }}
        >
          Loading...
        </div>
      </>
    );
  if (allTask.length === 0)
    return (
      <>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
            fontSize: "30px",
            fontWeight: "bold",
            color: "var(--primary-color)",
          }}
        >
          No task is available!
        </div>
      </>
    );

  return (
    <>
      <Header />
      <div className={classes.cotainer}>
        <h1>All available work</h1>
        <div className={classes.box}>
          {allTask.map((imagePath, index) => (
            <div className={classes.hover_effect} key={index}>
              <div className={classes.imageBox} key={index}>
                <Link
                  href={`/categories/${PATHNAME}/allwork/seework/${imagePath.address}_${imagePath.index}`}
                >
                  <Image
                    width={500}
                    height={500}
                    src={`/image/${PATHNAME}/${AllImagePAth[INDEX[index]]}`}
                    alt="image"
                    key={index}
                  />
                </Link>
                <div className={classes.button}>See more</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Page;
