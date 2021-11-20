import * as cheerio from "cheerio";
import fs from "fs";
import puppeteer from "puppeteer";
import request from "request";

const selectors = {
  heroSection: "#d_app .product-page-box section.hero",
  heroImg: ".gallery-container__image .image-wrapper img",
  heroTitle: '.hero-options [data-testid="product-title"]',
};

const download = function (uri, filename, callback = () => {}) {
  request.head(uri, function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on("close", callback);
  });
};

(async () => {
  // just for naming purposes
  let imageIdx = 0;
  // read the data from file
  const rawData = fs.readFileSync(`${__dirname}/links.txt`, "utf8");
  //   form an array of links
  const links = rawData.split("\n");
  // resultant array which would contain all the image links
  const imageLinks = [];

  //   launch browser and open a page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const link of links) {
    //   check if the link is actually a link
    if (link.indexOf("http") !== -1) {
      imageIdx++;
      // naviagate to the page
      await page.goto(link);
      await page.waitForSelector(selectors.heroSection);

      //   select hero-section
      const heroSection = await page.$(selectors.heroSection);

      //   get image source
      const imgSrc = await heroSection.$eval(`${selectors.heroImg}`, (el) => {
        return el.src;
      });

      //   get image extension
      const imgExt = imgSrc.split(".").pop();

      // get image name
      const imgName = await heroSection.$eval(
        `${selectors.heroTitle}`,
        (el) => {
          return el.innerText;
        }
      );

      // download the image
      download(
        imgSrc,
        `${process.cwd()}/results/${imageIdx}${imgName}.${imgExt}`,
        () => {
          console.log("Finished downloading ", imgName);
        }
      );

      //   push image object into resultant array
      imageLinks.push({
        imgSrc,
        imgName,
      });
    }
  }
  //   close browser
  await browser.close();
  //   write resultant array to a file
  fs.writeFileSync(
    `${process.cwd()}/results/results.txt`,
    JSON.stringify(imageLinks, null, 2),
    "utf-8"
  );
})();
