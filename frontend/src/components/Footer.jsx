import React from "react";
import Link from "next/link";
import classes from "@/styles/footer.module.css";
import ContactLogo from "@/components/ContactLogo";

const footer_Items = [
  {
    category: "COMPANY",
    subcategories: [
      "About Us",
      "Contact Us",
      "FAQs",
      "Testimonials",
      "Become an Affiliate",
      "Press Release",
      "Partners",
      "Non Profit",
    ],
  },
  {
    category: "SERVICES",
    subcategories: [
      "Website Builder",
      "One To One Projects",
      "Logo Design Contests",
      "Creative Gigs",
      "T-Shirt Printing",
      "Custom Clothing",
      "Business Cards",
      "Custom T-Shirts",
      "PrintShop",
      "Templates",
    ],
  },
  {
    category: "TOOLS",
    subcategories: [
      "Business Tools",
      "Logo Maker",
      "Brand Kit",
      "T-Shirt Maker",
      "Business Card Maker",
      "Flyer Maker",
      "Comic Maker",
      "Digital Business Card",
      "Gift Cards",
      "Studio",
    ],
  },
  {
    category: "GET A DESIGN",
    subcategories: [
      "Graphic Design",
      "Logo Design",
      "Label Design",
      "Packaging Design",
      "Website Design",
      "T-Shirt Design",
      "Brochure Design",
      "Book Cover Design",
      "Business Card Design",
      "Funny T Shirts",
    ],
  },
  {
    category: "RESOURCES",
    subcategories: [
      "Blog",
      "Graphic Designers",
      "Awarded Designs",
      "Interactive Guides",
      "Logo Ideas",
      "Events",
      "Learn",
      "Size",
      "Pro Designer",
    ],
  },
];

const Footer = () => {
  return (
    <div className={classes.container} id="contact">
      <div className={classes.box}>
        <div className={classes.bottom}>
          {footer_Items.map((category) => (
            <div key={category.category} className={classes.bottom_items_box}>
              <h2>{category.category}</h2>
              <div className={classes.bottom_items}>
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory} className={classes.bottom_item}>
                    {subcategory}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={classes.bottom_footer}>
          <div className={classes.bottom_footer_left}>
            <p>© 2026 SmartPay Platform - Blockchain-Powered Freelancing</p>
          </div>
          <div className={classes.bottom_footer_right}>
            <ContactLogo size={25} rotate={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
