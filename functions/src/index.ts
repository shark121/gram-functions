import {
  onDocumentWritten,
  // Change,
  // FirestoreEvent
} from "firebase-functions/v2/firestore";

import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });
type SummaryType = {
  type: string;
  price: number;
  image: string;
  number: number | string;
  collectionType: string;
};

type PhoneType = {
  type: string;
  price: number;
  image: string;
  number: number | string;
  collectionType: string;
  storage: string;
  color: string;
}; 

const nonCustomisableCollections = ["watches", "airpods"];

exports.createuser = onDocumentWritten(
  "{collection}/{collectionType}",
  async (event) => {
    const collectionType = event.params.collectionType;
    const SuperCollection = event.params.collection;
    const itemsSummaries: SummaryType[] = [];
    const listenCollections = ["watches", "airpods", "prices", "Collection"];

    if (event.data?.after == event.data?.before) return null;
    
    if (!listenCollections.includes(SuperCollection)) return null;

    if (SuperCollection === "Collections" && !nonCustomisableCollections.includes(collectionType)) return null;

    if (SuperCollection !== "Collections") collectionType === SuperCollection;

    const Pricesdata = await db
      .doc(`prices/${collectionType}`)
      .get()
      .then((doc) => doc.data());

    const getImagesData = await db
      .doc(`Collection/${collectionType}`)
      .get()
      .then((doc) => doc.data());

    let numberObject: { [key: string]: string | number } = {};
    const getNumberData = await db
      .collection(collectionType)
      .get()
      .then((doc) =>
        doc.docs.map((doc) => (numberObject[doc.id] = doc.data().number))
      );

    for (const item in getImagesData) {
      let currentSummary: SummaryType = {
        type: "",
        price: 0,
        image: "",
        number: 0,
        collectionType: "",
      };

      currentSummary["type"] = item;
      currentSummary["image"] = getImagesData[item];
      currentSummary["price"] = Pricesdata && Pricesdata[item];
      currentSummary["number"] = numberObject[item];
      currentSummary["collectionType"] = collectionType;

      itemsSummaries.push(currentSummary);
    }

    Pricesdata && console.log(Pricesdata);
    getImagesData && console.log(getImagesData);
    getNumberData && console.log(getNumberData);
    console.log(numberObject);
    console.log(itemsSummaries);

    db.doc(`summaries/${collectionType}`).set(
      { [collectionType]: itemsSummaries },
      { merge: true }
    );

    return null;
  }
);

exports.writePhoneFunction = onDocumentWritten(
  "phones/{phoneId}",
  async (event) => {

    if (event.data?.after == event.data?.before) return null;
   

    const phoneId = event.params.phoneId;
    const phonesSummary: PhoneType[] = [];

    const phonePrice = await db
      .doc(`prices/phones`)
      .get()
      .then((doc) => doc.data());

    const phoneImage = await db
      .doc(`Collection/phones`)
      .get()
      .then((doc) => doc.data());

    const availableStorage = await db
      .doc(`phones/${phoneId}`)
      .get()
      .then((doc) => doc.data());

    const availableStorageArray =
      availableStorage && Object.keys(availableStorage);

    if (availableStorageArray) {
      for (let storage of availableStorageArray) {
        const price = phonePrice && phonePrice[`${phoneId}(${storage})`];
        const image = phoneImage && phoneImage[phoneId];
        const availableColors =
          availableStorage && Object.keys(availableStorage[storage]);
        for (let color of availableColors) {
          const currentPhone: PhoneType = {
            type: phoneId,
            price: price,
            image: image,
            number: availableStorage[storage][color],
            color: color,
            collectionType: "phones",
            storage: storage,
          };
          phonesSummary.push(currentPhone);
        }
      }
    }

    // const phoneSummary: SummaryType = {
    //   type: "phones",
    //   price: phonePrice && phonePrice[phoneId],
    //   image: phoneImage && phoneImage[phoneId],
    //   number: 0,
    // };

    console.log(phonesSummary);
    console.log(availableStorage);
    console.log(availableStorageArray);
    console.log(phonePrice);
    console.log(phoneImage);
    db.doc(`summaries/phones`).set(
      { [phoneId]: phonesSummary },
      { merge: true }
    );
    return null;
  }
);
