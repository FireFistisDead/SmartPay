import React from "react";
import classes from "@/styles/categoriesTypes.module.css";
import Header from "@/components/Header";
import eachCategories from "../../../../public/data/eachCategories/eachCategories.json";
import Image from "next/image";
import { MdOutlineVerified } from "react-icons/md";
import { IoIosContacts } from "react-icons/io";
import { TiTick } from "react-icons/ti";
import Link from "next/link";

const Page = ({ params }) => {
  const PATHNAME = params.job;
  const catalog = eachCategories[PATHNAME];

  return (
    <>
      <Header />
      <div className={classes.container}>
        <div className={classes.box}>
          <div className={classes.top_box}>
            <h1>{PATHNAME.replace(/-/g, " ")}</h1>
            <p>
              An impressive work ensures that your visitors stay at the pages so
              that they can explore more content for buying the products and
              services. ...
            </p>
          </div>
          <div className={classes.bottom_box}>
            <div className={classes.create_work_items}>
              {Object.keys(catalog).map((key, index) => (
                <div key={key} className={classes.create_work_item}>
                  <h2>
                    {index === 0 ? <MdOutlineVerified /> : <IoIosContacts />}
                    {key.replace(/_/g, " ")}
                  </h2>
                  <div className={classes.create_work_item_details}>
                    <h4>{catalog[key].description}</h4>
                    <ul>
                      {catalog[key].four_key_points.map((point, index) => (
                        <li key={index}>
                          <TiTick />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <div className={classes.buttons}>
                      {index === 0 ? (
                        <Link href={`/categories/${PATHNAME}/allwork`}>
                          See work by other user
                        </Link>
                      ) : (
                        <Link href={"/createNewJob"}>Create New Work</Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={classes.image}>
              <Image
                src="/image/website-views.png"
                alt={"image"}
                width={500}
                height={300}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
