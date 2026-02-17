import React from "react";
import classes from "@/styles/OurServices.module.css";
import OurServicesItem from "@/components/OurServicesItem";

const data = [
  {
    a_tag: "/categories/website-design",
    image: "/image/homepage/home-contest-banner.webp",
    heading: "Website Design",
    about:
      "Transform your ideas into visually stunning websites. Our website design services focus on creating a seamless user experience while incorporating modern and eye-catching designs.",
    three_key_points: [
      "Creative and engaging visual aesthetics",
      "Intuitive user interface",
      "Optimized for performance and user satisfaction",
    ],
    short_motivation:
      "Elevate your online presence with our innovative website design solutions. We bring your vision to life on the digital canvas.",
  },
  {
    a_tag: "/categories/website-making",
    image: "/image/homepage/website-builder.webp",
    heading: "Website Making",
    about:
      "Create a website that suits your needs and captivates your audience. Our website-making services are tailored to provide you with a unique online presence.",
    three_key_points: [
      "Customized website development",
      "User-friendly design and navigation",
      "Responsive and mobile-friendly layouts",
    ],
    short_motivation:
      "Empower your business with a compelling online presence through our expert website-making services.",
  },
];

const OurServices = () => {
  return (
    <div className={classes.container}>
      <div className={classes.box}>
        <div className={classes.top}>
          <h1>Our Services</h1>
          <p>
            From creative design projects to comprehensive development solutions,
            powered by smart contracts and blockchain technology. SmartPay offers
            secure, transparent services for all your freelance needs with instant
            cryptocurrency payments.
          </p>
        </div>
        <div className={classes.servicesItems}>
          {data.map((item, index) => (
            <OurServicesItem item={item} key={index} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OurServices;
